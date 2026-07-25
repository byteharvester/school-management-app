import React, { useState, useEffect, useContext } from 'react';
import { gasApi } from '../../api/gasApi';
import { AuthContext } from '../../context/AuthContext';

export default function LeaveDashboard() {
  const { currentUser } = useContext(AuthContext); // Get the logged-in user
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'Casual Leave',
    fromDate: '',
    toDate: '',
    reason: ''
  });

  const fetchLeaves = () => {
    setLoading(true);
    gasApi('getLeaves')
      .then(setLeaves)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const payload = {
        email: currentUser.Email, // Dynamically use the logged-in staff's email
        leaveType: formData.leaveType,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        reason: formData.reason
      };
      
      await gasApi('applyLeave', payload);

      // ADD THIS ALERT!
      alert("Leave request submitted successfully!");
      
      // Reset form and close modal
      setIsModalOpen(false);
      setFormData({ leaveType: 'Casual Leave', fromDate: '', toDate: '', reason: '' });
      
      // Refresh the table to show the new request
      fetchLeaves();
    } catch (error) {
      alert("Failed to submit leave: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter leaves so staff only see their own requests
  const myLeaves = leaves.filter(leave => 
    String(leave['Staff_Email']).toLowerCase() === String(currentUser.Email).toLowerCase()
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">My Leave Requests</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition shadow-sm flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> Apply for Leave
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading leaves...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800 text-white text-sm uppercase tracking-wider">
              <tr>
                <th className="p-4">Type</th>
                <th className="p-4">From</th>
                <th className="p-4">To</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {myLeaves.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-400">You have no leave history.</td></tr>
              ) : (
                myLeaves.map((leave, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-4 font-bold">{leave['Leave_Type']}</td>
                    <td className="p-4">{new Date(leave['From_Date']).toLocaleDateString()}</td>
                    <td className="p-4">{new Date(leave['To_Date']).toLocaleDateString()}</td>
                    <td className="p-4 truncate max-w-xs">{leave['Reason']}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md font-bold text-xs ${leave['Status'] === 'Pending' ? 'bg-amber-100 text-amber-700' : leave['Status'] === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {leave['Status']}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Leave Application</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Leave Type</label>
                <select 
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={formData.leaveType}
                  onChange={e => setFormData({...formData, leaveType: e.target.value})}
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">From Date</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.fromDate}
                    onChange={e => setFormData({...formData, fromDate: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">To Date</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.toDate}
                    onChange={e => setFormData({...formData, toDate: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Reason for Leave</label>
                <textarea 
                  required 
                  rows="3" 
                  placeholder="Please provide details..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})} 
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}