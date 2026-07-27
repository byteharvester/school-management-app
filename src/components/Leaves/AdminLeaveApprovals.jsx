import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { gasApi } from '../../api/gasApi';
import Swal from 'sweetalert2';

const extractId = (urlOrId) => {
  if (!urlOrId) return null;
  if (String(urlOrId).includes('id=')) return String(urlOrId).split('id=')[1].split('&')[0];
  if (String(urlOrId).includes('/d/')) return String(urlOrId).split('/d/')[1].split('/')[0];
  return urlOrId;
};

// --- Date Formatters ---
const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const formatDateOnly = (isoString) => {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

export default function AdminLeaveApprovals() {
  const { currentUser } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending'); 

  // States to hold the fetched balances for each user
  const [employeeBalances, setEmployeeBalances] = useState({});
  const [loadingBalances, setLoadingBalances] = useState({});

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const data = await gasApi('getLeaves');
      setLeaves(data || []);
    } catch (error) {
      Swal.fire('Error', 'Failed to load leaves.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // --- Fetch Balances On Demand (No backend changes needed!) ---
  const fetchBalanceForUser = async (employeeName) => {
    setLoadingBalances(prev => ({ ...prev, [employeeName]: true }));
    try {
      const bal = await gasApi('getLeaveBalances', { employeeName: employeeName });
      setEmployeeBalances(prev => ({ ...prev, [employeeName]: bal }));
    } catch (err) {
      Swal.fire('Error', `Could not fetch balances for ${employeeName}`, 'error');
    } finally {
      setLoadingBalances(prev => ({ ...prev, [employeeName]: false }));
    }
  };

  const handleAction = async (applicationId, actionType) => {
    const isApprove = actionType === 'Approved';
    
    const { value: remarks, isDismissed } = await Swal.fire({
      title: isApprove ? 'Approve Leave' : 'Reject Leave',
      input: 'text',
      inputLabel: 'Remarks / Notes (Optional for approval, required for rejection)',
      inputPlaceholder: 'Enter remarks here...',
      showCancelButton: true,
      confirmButtonText: isApprove ? 'Approve' : 'Reject',
      confirmButtonColor: isApprove ? '#10b981' : '#ef4444',
      preConfirm: (value) => {
        if (!isApprove && !value) {
          Swal.showValidationMessage('Remarks are mandatory for rejection.');
        }
        return value;
      }
    });

    if (isDismissed) return;

    Swal.fire({ title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      await gasApi('updateLeaveStatus', {
        applicationId: applicationId,
        status: actionType,
        approvedBy: currentUser?.Name || 'Admin',
        remarks: remarks || ''
      });

      Swal.fire('Success', `Application ${actionType.toLowerCase()} successfully.`, 'success');
      fetchLeaves();
    } catch (error) {
      Swal.fire('Error', error.message || 'Failed to update status.', 'error');
    }
  };

  const filteredLeaves = leaves.filter(l => filter === 'All' || l.Status === filter);

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Leave Approval Desk</h1>
            <p className="text-sm text-gray-500">Manage staff leave applications and charge handovers.</p>
          </div>
          <button onClick={fetchLeaves} className="mt-4 md:mt-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition">
            Refresh Data
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200 w-fit">
          {['Pending', 'Approved', 'Rejected', 'All'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === status ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-semibold w-1/3">Applicant & Balances</th>
                  <th className="p-4 font-semibold w-1/4">Leave Details</th>
                  <th className="p-4 font-semibold">Charge & Docs</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeaves.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">No applications found in this category.</td></tr>
                ) : (
                  filteredLeaves.map((row) => (
                    <tr key={row.ApplicationID} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{row.EmployeeName}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Applied: {formatDateTime(row.Timestamp)}</p>
                        <p className="text-[11px] text-gray-400">App ID: {row.ApplicationID}</p>
                        
                        {/* Interactive Balance Viewer */}
                        <div className="mt-2.5">
                          {employeeBalances[row.EmployeeName] ? (
                            <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-md text-[11px] font-bold text-indigo-800 grid grid-cols-3 gap-x-2 gap-y-1 w-fit">
                              <span>CL: {employeeBalances[row.EmployeeName].CL_Balance || 0}</span>
                              <span>EL: {employeeBalances[row.EmployeeName].EL_Balance || 0}</span>
                              <span>HPL: {employeeBalances[row.EmployeeName].HPL_Balance || 0}</span>
                              <span>ML: {employeeBalances[row.EmployeeName].ML_Balance || 0}</span>
                              <span>PL: {employeeBalances[row.EmployeeName].PL_Balance || 0}</span>
                              <span>SCL: {employeeBalances[row.EmployeeName].SCL_Balance || 0}</span>
                            </div>
                          ) : (
                            <button 
                              onClick={() => fetchBalanceForUser(row.EmployeeName)}
                              disabled={loadingBalances[row.EmployeeName]}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition"
                            >
                              {loadingBalances[row.EmployeeName] ? 'Loading...' : '👁️ View Balances'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <p className="font-bold text-indigo-600">{row.LeaveType} ({row.TotalDays} Days)</p>
                        <p className="text-xs text-gray-700 font-medium mt-1">
                          {formatDateOnly(row.StartDate)} <span className="text-gray-400">to</span> {formatDateOnly(row.EndDate)}
                        </p>
                        <p className="text-xs text-gray-500 italic mt-1.5 max-w-xs truncate border-l-2 border-gray-300 pl-2">"{row.Reason}"</p>
                      </td>
                      <td className="p-4 align-top">
                        {row.ChargeHandedTo && row.ChargeHandedTo !== 'N/A' && (
                          <span className="block text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded w-fit mb-1.5 border border-amber-200">
                            Charge: {row.ChargeHandedTo}
                          </span>
                        )}
                        {row.MedicalCertID && (
                          <a 
                            href={`https://drive.google.com/file/d/${extractId(row.MedicalCertID)}/view`} 
                            target="_blank" rel="noreferrer"
                            className="text-[11px] font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded border border-blue-100 inline-block"
                          >
                            📄 View Medical Cert
                          </a>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          row.Status === 'Approved' ? 'bg-green-100 text-green-700' :
                          row.Status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {row.Status}
                        </span>
                      </td>
                      <td className="p-4 text-right align-top">
                        {row.Status === 'Pending' ? (
                          <div className="flex flex-col gap-2 items-end">
                            <button 
                              onClick={() => handleAction(row.ApplicationID, 'Approved')}
                              className="bg-green-500 hover:bg-green-600 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs transition w-24"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleAction(row.ApplicationID, 'Rejected')}
                              className="bg-red-500 hover:bg-red-600 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs transition w-24"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-xs font-semibold text-right">
                            <p>Processed</p>
                            {row.ApprovedBy && <p className="text-[10px] mt-1 truncate max-w-[100px]">by {row.ApprovedBy}</p>}
                          </div>
                        )}
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