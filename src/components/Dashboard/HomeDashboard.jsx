import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { gasApi } from '../../api/gasApi';

export default function HomeDashboard() {
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  
  // UPDATED: Now also storing the full staff array sent from the backend
  const [staffStats, setStaffStats] = useState({ total: 0, counts: {}, staff: [] });
  
  // NEW: State to control which list is currently open in the modal
  const [selectedFilter, setSelectedFilter] = useState(null); // 'Total', 'Present', 'Leave', 'Offline'

  const isManagement = currentUser.Role === 'Admin' || currentUser.Role === 'Headmaster';

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (isManagement) {
          const data = await gasApi('getStaffDashboard');
          if (data) {
            // Save total, counts, AND the raw staff array
            setStaffStats({ 
              total: data.total || 0, 
              counts: data.counts || {}, 
              staff: data.staff || [] 
            });
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isManagement]);

  // NEW: Helper function to filter the staff list based on the clicked card
  const getFilteredStaff = () => {
    if (!selectedFilter) return [];
    if (selectedFilter === 'Total') return staffStats.staff;
    if (selectedFilter === 'Present') return staffStats.staff.filter(s => s.status === 'Present');
    if (selectedFilter === 'Leave') return staffStats.staff.filter(s => s.status === 'On Leave' || s.status === 'Outdoor Duty');
    if (selectedFilter === 'Offline') return staffStats.staff.filter(s => s.status === 'Offline' || s.status === 'Absent');
    return [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen relative">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2">Welcome back, {currentUser.Name.split(' ')[0]}!</h1>
            <p className="text-indigo-200 font-medium text-sm">
              {isManagement 
                ? "Here is your live campus overview for today." 
                : "Have a great day at work! Check your profile to clock in."}
            </p>
          </div>
          <i className="fa-solid fa-school absolute -bottom-10 -right-10 text-9xl text-white opacity-5 transform -rotate-12"></i>
        </div>

        {/* MANAGEMENT VIEW: Live Attendance Monitoring */}
        {isManagement && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-chart-pie text-indigo-600"></i> Live Staff Attendance
            </h2>
            
            {/* Stat Cards Grid - UPDATED with onClick and hover effects */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div 
                onClick={() => setSelectedFilter('Total')}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Staff</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black text-slate-800">{staffStats.total}</p>
                  <i className="fa-solid fa-users text-slate-300 text-2xl"></i>
                </div>
              </div>

              <div 
                onClick={() => setSelectedFilter('Present')}
                className="bg-white p-5 rounded-xl border-b-4 border-b-emerald-500 shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Present (Clocked In)</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black text-emerald-600">{staffStats.counts['Present'] || 0}</p>
                  <i className="fa-solid fa-building-circle-check text-emerald-200 text-2xl"></i>
                </div>
              </div>

              <div 
                onClick={() => setSelectedFilter('Leave')}
                className="bg-white p-5 rounded-xl border-b-4 border-b-amber-500 shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">On Leave / Outdoor</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black text-amber-600">
                    {(staffStats.counts['On Leave'] || 0) + (staffStats.counts['Outdoor Duty'] || 0)}
                  </p>
                  <i className="fa-solid fa-plane-departure text-amber-200 text-2xl"></i>
                </div>
              </div>

              <div 
                onClick={() => setSelectedFilter('Offline')}
                className="bg-white p-5 rounded-xl border-b-4 border-b-rose-500 shadow-sm flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Offline / Absent</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black text-rose-600">{staffStats.counts['Offline'] || 0}</p>
                  <i className="fa-solid fa-user-xmark text-rose-200 text-2xl"></i>
                </div>
              </div>
            </div>

            {/* Quick Action Hints for Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex gap-4 items-center">
                <div className="h-12 w-12 bg-indigo-200 text-indigo-700 rounded-full flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-hand-pointer text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900">Interactive Dashboard</h3>
                  <p className="text-sm text-indigo-700 mt-1">Click on any of the stat cards above to instantly see a detailed list of the staff members in that category.</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-4 items-center">
                <div className="h-12 w-12 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-calendar-check text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">Pending Leaves</h3>
                  <p className="text-sm text-blue-700 mt-1">Check the <strong>Leave Admin</strong> desk to approve or reject new leave applications for your staff.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NEW: Staff List Modal Overlay */}
      {selectedFilter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-xl text-slate-800">
                  {selectedFilter === 'Total' && 'All Registered Staff'}
                  {selectedFilter === 'Present' && 'Staff Currently Present'}
                  {selectedFilter === 'Leave' && 'Staff On Leave / Outdoor Duty'}
                  {selectedFilter === 'Offline' && 'Offline / Absent Staff'}
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Showing {getFilteredStaff().length} record(s)
                </p>
              </div>
              <button 
                onClick={() => setSelectedFilter(null)} 
                className="h-10 w-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Modal Body / Table */}
            <div className="overflow-y-auto p-5">
              {getFilteredStaff().length === 0 ? (
                <div className="text-center py-10">
                  <div className="inline-flex h-16 w-16 bg-slate-100 text-slate-400 rounded-full items-center justify-center mb-3">
                    <i className="fa-solid fa-folder-open text-2xl"></i>
                  </div>
                  <p className="text-slate-500 font-medium">No staff members found in this category.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-3 rounded-tl-lg font-bold">Staff Member</th>
                      <th className="p-3 font-bold">Designation / Role</th>
                      <th className="p-3 rounded-tr-lg font-bold">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getFilteredStaff().map((staff, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0 shadow-sm border border-indigo-200">
                              {staff.name ? staff.name.charAt(0) : '?'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{staff.name}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{staff.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-medium text-slate-600">
                          {staff.role || 'Staff'}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            staff.status === 'Present' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                            (staff.status === 'On Leave' || staff.status === 'Outdoor Duty') ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            'bg-rose-100 text-rose-700 border border-rose-200'
                          }`}>
                            {staff.status}
                          </span>
                          {staff.statusNote && (
                            <p className="text-xs text-slate-500 mt-1.5 italic flex items-start gap-1 max-w-[200px]">
                              <i className="fa-solid fa-comment-dots mt-0.5 text-slate-400"></i>
                              {staff.statusNote}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}