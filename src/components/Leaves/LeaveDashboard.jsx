import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { gasApi } from '../../api/gasApi';
import Swal from 'sweetalert2';

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    const base64Data = reader.result.split(',')[1];
    resolve(base64Data);
  };
  reader.onerror = (error) => reject(error);
});

export default function LeaveDashboard() {
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  
  const [balances, setBalances] = useState({ 
    CL_Balance: 0, EL_Balance: 0, HPL_Balance: 0, 
    ML_Balance: 0, PL_Balance: 0, SCL_Balance: 0 
  });
  const [rules, setRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [staffList, setStaffList] = useState([]); 
  
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: '', startDate: '', endDate: '', reason: '', chargeHandedTo: '', medicalCertFile: null
  });

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [balData, rulesData, historyData, staffData] = await Promise.all([
        gasApi('getLeaveBalances', { employeeName: currentUser.Name, employeeEmail: currentUser.Email }),
        gasApi('getLeaveRules'),
        gasApi('getLeaves'),
        gasApi('getStaffList') 
      ]);

      if (balData) setBalances(balData);
      setRules(rulesData || []);
      setStaffList(staffData || []);
      
      const myLeaves = (historyData || []).filter(
        app => String(app.EmployeeName).trim() === String(currentUser.Name).trim()
      );
      setHistory(myLeaves);
    } catch (error) {
      Swal.fire('Error', 'Failed to load leave data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // SMART FILTER: Only show leaves applicable to this specific employee's Post and Gender
  const availableRules = useMemo(() => {
    if (!rules || !currentUser) return [];
    const userPost = (currentUser.Post || '').toLowerCase();
    const userGender = (currentUser.Gender || '').toLowerCase(); // If you add Gender to Staff sheet later

    return rules.filter(r => {
      // 1. Check if the leave is restricted by Post
      const allowedPosts = r.ApplicablePosts ? r.ApplicablePosts.toLowerCase() : 'all';
      const isPostAllowed = allowedPosts === 'all' || allowedPosts.includes(userPost);

      // 2. Check if the leave is restricted by Gender (e.g., Maternity Leave)
      const allowedGender = r.GenderSpecific ? r.GenderSpecific.toLowerCase() : 'all';
      const isGenderAllowed = allowedGender === 'all' || allowedGender === userGender || userGender === ''; // Defaults to allowed if gender isn't set in DB yet

      return isPostAllowed && isGenderAllowed;
    });
  }, [rules, currentUser]);

  const activeRule = useMemo(() => {
    return rules.find(r => r.LeaveCode === formData.leaveType) || null;
  }, [formData.leaveType, rules]);

  const totalDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) return 0;
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.startDate, formData.endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeRule?.MaxContinuousDays && totalDays > parseInt(activeRule.MaxContinuousDays, 10)) {
      return Swal.fire('Rule Violation', `Maximum allowed continuous days for this leave is ${activeRule.MaxContinuousDays}.`, 'error');
    }
    if (activeRule?.RequiresMedicalCert === 'Yes' && !formData.medicalCertFile) {
      return Swal.fire('Required', 'A Medical Certificate is mandatory for this leave type.', 'warning');
    }
    if (activeRule?.RequiresChargeHandover === 'Yes' && !formData.chargeHandedTo.trim()) {
      return Swal.fire('Required', 'Charge Handover is mandatory for this leave type.', 'warning');
    }

    setIsSubmitting(true);
    Swal.fire({ title: 'Submitting...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      let medicalCertBase64 = null;
      if (formData.medicalCertFile) {
        medicalCertBase64 = await fileToBase64(formData.medicalCertFile);
      }

      await gasApi('applyLeave', {
        employeeId: currentUser?.Email || 'N/A', 
        employeeName: currentUser?.Name,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDays: totalDays,
        reason: formData.reason,
        chargeHandedTo: formData.chargeHandedTo || 'N/A',
        medicalCertFile: medicalCertBase64
      });

      Swal.fire('Success', 'Leave application submitted successfully.', 'success');
      setShowForm(false);
      setFormData({ leaveType: '', startDate: '', endDate: '', reason: '', chargeHandedTo: '', medicalCertFile: null });
      fetchData();
    } catch (err) {
      Swal.fire('Error', err.message || 'Submission failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Leave Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome, {currentUser?.Name} ({currentUser?.Post || 'Staff'})</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
          >
            {showForm ? 'Cancel Application' : '+ Apply for Leave'}
          </button>
        </div>

        {/* Extended Balance Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-emerald-500">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Casual (CL)</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{balances.CL_Balance || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Earned (EL)</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{balances.EL_Balance || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-amber-500">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Half Pay (HPL)</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{balances.HPL_Balance || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-purple-500">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Spl Casual (SCL)</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{balances.SCL_Balance || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-pink-500">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Maternity (ML)</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{balances.ML_Balance || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-indigo-500">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Paternity (PL)</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{balances.PL_Balance || 0}</p>
          </div>
        </div>

        {/* Application Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">New Leave Application</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                  <select 
                    required value={formData.leaveType} 
                    onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  >
                    <option value="">-- Select Type --</option>
                    {availableRules.length === 0 && <option disabled>No leaves applicable for your post.</option>}
                    {/* Maps over availableRules instead of all rules */}
                    {availableRules.map((r, idx) => (
                      <option key={idx} value={r.LeaveCode}>{r.LeaveCode} - {r.MarathiName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <input 
                    type="text" required value={formData.reason} 
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Enter reason..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Info Box showing Marathi Name and Description dynamically */}
                {activeRule && (
                  <div className="md:col-span-2 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h4 className="text-sm font-bold text-indigo-900 mb-1">{activeRule.MarathiName} Information</h4>
                    <p className="text-sm text-indigo-700 mb-2">
                      {activeRule.Description || 'Please select dates according to the leave rules.'}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-indigo-800 font-medium">
                      <span className="bg-white px-2 py-1 rounded border border-indigo-100">
                        Max Continuous Days: {activeRule.MaxContinuousDays || 'No limit'}
                      </span>
                      <span className="bg-white px-2 py-1 rounded border border-indigo-100">
                        Medical Cert Required: {activeRule.RequiresMedicalCert}
                      </span>
                      <span className="bg-white px-2 py-1 rounded border border-indigo-100">
                        Charge Handover Required: {activeRule.RequiresChargeHandover}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="date" required value={formData.startDate} 
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input 
                    type="date" required min={formData.startDate} value={formData.endDate} 
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {activeRule?.RequiresChargeHandover === 'Yes' && (
                  <div className="md:col-span-2 bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <label className="block text-sm font-medium text-amber-800 mb-1">Charge Handover To (Required)</label>
                    <select 
                      required value={formData.chargeHandedTo} 
                      onChange={(e) => setFormData({...formData, chargeHandedTo: e.target.value})}
                      className="w-full p-2.5 border border-amber-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Select Staff Member --</option>
                      {staffList.filter(name => name !== currentUser?.Name).map((name, idx) => (
                        <option key={idx} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeRule?.RequiresMedicalCert === 'Yes' && (
                  <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <label className="block text-sm font-medium text-blue-800 mb-1">Medical Certificate (Required)</label>
                    <input 
                      type="file" required accept="image/*,application/pdf"
                      onChange={(e) => setFormData({...formData, medicalCertFile: e.target.files[0]})}
                      className="w-full p-2 bg-white border border-blue-300 rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition">
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* History Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">Leave History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-semibold">ID</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Dates</th>
                  <th className="p-4 font-semibold">Days</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">No applications found.</td></tr>
                ) : (
                  history.map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">{record.ApplicationID}</td>
                      <td className="p-4 font-bold text-indigo-600">{record.LeaveType}</td>
                      <td className="p-4 text-gray-600">{record.StartDate} to {record.EndDate}</td>
                      <td className="p-4">{record.TotalDays}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          record.Status === 'Approved' ? 'bg-green-100 text-green-700' :
                          record.Status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {record.Status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}