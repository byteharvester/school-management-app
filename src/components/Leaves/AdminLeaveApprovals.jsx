import React, { useState, useEffect } from 'react';
import { gasApi } from '../../api/gasApi';

export default function AdminLeaveApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await gasApi('getLeaves');
      // Only show Pending requests to the Admin
      const pendingRequests = data.filter(req => req.Status === 'Pending');
      setRequests(pendingRequests);
    } catch (error) {
      console.error("Failed to fetch leaves", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleNoteChange = (id, note) => {
    setAdminNotes({ ...adminNotes, [id]: note });
  };

  const handleAction = async (requestId, newStatus) => {
    setProcessingId(requestId);
    try {
      await gasApi('updateLeaveStatus', {
        requestId: requestId,
        newStatus: newStatus,
        adminNote: adminNotes[requestId] || ''
      });
      alert(`Request ${newStatus}!`);
      fetchRequests(); // Refresh the list
    } catch (error) {
      alert("Failed to process request: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500 font-bold">Loading Pending Requests...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Pending Leave Approvals</h2>
        <button 
          onClick={fetchRequests}
          className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg font-bold transition shadow-sm flex items-center gap-2"
        >
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
            <i className="fa-solid fa-check-circle text-4xl text-emerald-400 mb-3"></i>
            <p className="font-bold">All caught up! No pending leave requests.</p>
          </div>
        ) : (
          requests.map((req, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row gap-6 items-start md:items-center">
              
              {/* Request Details */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-extrabold text-lg text-slate-800">{req['Staff_Name'] || req['Staff_Email']}</h3>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    {req['Leave_Type']}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  <strong>Dates:</strong> {new Date(req['From_Date']).toLocaleDateString()} to {new Date(req['To_Date']).toLocaleDateString()}
                </p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                  <p className="text-xs text-slate-700 font-medium">"{req['Reason']}"</p>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="w-full md:w-72 flex flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                <input 
                  type="text" 
                  placeholder="Add an admin note (optional)..." 
                  value={adminNotes[req['ID']] || ''}
                  onChange={(e) => handleNoteChange(req['ID'], e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white mb-1"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAction(req['ID'], 'Approved')}
                    disabled={processingId === req['ID']}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition shadow-sm disabled:opacity-50"
                  >
                    {processingId === req['ID'] ? '...' : 'Approve'}
                  </button>
                  <button 
                    onClick={() => handleAction(req['ID'], 'Rejected')}
                    disabled={processingId === req['ID']}
                    className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-lg transition shadow-sm disabled:opacity-50"
                  >
                    {processingId === req['ID'] ? '...' : 'Reject'}
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}