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

export default function AdminLeaveApprovals() {
  const { currentUser } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending'); // 'Pending', 'Approved', 'Rejected', 'All'

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
                  <th className="p-4 font-semibold">Applicant</th>
                  <th className="p-4 font-semibold">Leave Details</th>
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
                        <p className="text-xs text-gray-500">ID: {row.EmployeeID}</p>
                        <p className="text-xs text-gray-400 mt-1">App ID: {row.ApplicationID}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-indigo-600">{row.LeaveType} ({row.TotalDays} Days)</p>
                        <p className="text-xs text-gray-600">{row.StartDate} to {row.EndDate}</p>
                        <p className="text-xs text-gray-500 italic mt-1 max-w-xs truncate">"{row.Reason}"</p>
                      </td>
                      <td className="p-4">
                        {row.ChargeHandedTo && row.ChargeHandedTo !== 'N/A' && (
                          <span className="block text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded w-fit mb-1 border border-amber-200">
                            Charge: {row.ChargeHandedTo}
                          </span>
                        )}
                        {row.MedicalCertID && (
                          <a 
                            href={`https://drive.google.com/file/d/${extractId(row.MedicalCertID)}/view`} 
                            target="_blank" rel="noreferrer"
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            View Medical Cert
                          </a>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          row.Status === 'Approved' ? 'bg-green-100 text-green-700' :
                          row.Status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {row.Status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {row.Status === 'Pending' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleAction(row.ApplicationID, 'Approved')}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium text-xs transition"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleAction(row.ApplicationID, 'Rejected')}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium text-xs transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Processed</span>
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