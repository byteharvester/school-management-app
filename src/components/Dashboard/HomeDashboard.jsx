import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { gasApi } from '../../api/gasApi';

export default function HomeDashboard() {
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [staffStats, setStaffStats] = useState({ total: 0, counts: {} });

  const isManagement = currentUser.Role === 'Admin' || currentUser.Role === 'Headmaster';

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch staff attendance & leave overview from the backend
        if (isManagement) {
          const data = await gasApi('getStaffDashboard');
          if (data) {
            setStaffStats({ total: data.total || 0, counts: data.counts || {} });
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
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
          {/* Decorative background element */}
          <i className="fa-solid fa-school absolute -bottom-10 -right-10 text-9xl text-white opacity-5 transform -rotate-12"></i>
        </div>

        {/* MANAGEMENT VIEW: Live Attendance Monitoring */}
        {isManagement && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-chart-pie text-indigo-600"></i> Live Staff Attendance
            </h2>
            
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Staff</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black text-slate-800">{staffStats.total}</p>
                  <i className="fa-solid fa-users text-slate-300 text-2xl"></i>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-b-4 border-b-emerald-500 shadow-sm flex flex-col justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Present (Clocked In)</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black text-emerald-600">{staffStats.counts['Present'] || 0}</p>
                  <i className="fa-solid fa-building-circle-check text-emerald-200 text-2xl"></i>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-b-4 border-b-amber-500 shadow-sm flex flex-col justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">On Leave / Outdoor</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black text-amber-600">
                    {(staffStats.counts['On Leave'] || 0) + (staffStats.counts['Outdoor Duty'] || 0)}
                  </p>
                  <i className="fa-solid fa-plane-departure text-amber-200 text-2xl"></i>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-b-4 border-b-rose-500 shadow-sm flex flex-col justify-between">
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
                  <i className="fa-solid fa-user-clock text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900">Need to see details?</h3>
                  <p className="text-sm text-indigo-700 mt-1">Head over to the <strong>Directory</strong> tab to see exactly who is clocked in and what their current status is.</p>
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
    </div>
  );
}