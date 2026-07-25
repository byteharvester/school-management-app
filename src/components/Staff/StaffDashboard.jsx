import React, { useState, useEffect } from 'react';
import { gasApi } from '../../api/gasApi';

export default function StaffDashboard() {
  const [data, setData] = useState({ staff: [], counts: {}, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const result = await gasApi('getStaffDashboard');
      setData(result);
    } catch (error) {
      console.error("Failed to fetch staff dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter staff based on selected status badge
  const filteredStaff = filter === 'All' 
    ? data.staff 
    : data.staff.filter(member => member.status === filter);

  if (loading) return <div className="p-6 text-center text-slate-500 font-bold">Loading Directory...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Global Staff Dashboard</h2>
        <button 
          onClick={fetchDashboardData}
          className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg font-bold transition shadow-sm flex items-center gap-2"
        >
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div onClick={() => setFilter('All')} className={`p-4 rounded-xl cursor-pointer transition ${filter === 'All' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 transform -translate-y-1' : 'bg-white border border-slate-200 text-slate-600 hover:shadow-md'}`}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Total Staff</p>
          <p className="text-2xl font-black">{data.total}</p>
        </div>
        <div onClick={() => setFilter('Present')} className={`p-4 rounded-xl cursor-pointer transition ${filter === 'Present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 transform -translate-y-1' : 'bg-white border border-slate-200 text-slate-600 hover:shadow-md'}`}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Present</p>
          <p className="text-2xl font-black">{data.counts['Present'] || 0}</p>
        </div>
        <div onClick={() => setFilter('Outdoor Duty')} className={`p-4 rounded-xl cursor-pointer transition ${filter === 'Outdoor Duty' ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 transform -translate-y-1' : 'bg-white border border-slate-200 text-slate-600 hover:shadow-md'}`}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Outdoor</p>
          <p className="text-2xl font-black">{data.counts['Outdoor Duty'] || 0}</p>
        </div>
        <div onClick={() => setFilter('On Leave')} className={`p-4 rounded-xl cursor-pointer transition ${filter === 'On Leave' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 transform -translate-y-1' : 'bg-white border border-slate-200 text-slate-600 hover:shadow-md'}`}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">On Leave</p>
          <p className="text-2xl font-black">{data.counts['On Leave'] || 0}</p>
        </div>
        <div onClick={() => setFilter('Absent')} className={`p-4 rounded-xl cursor-pointer transition ${filter === 'Absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 transform -translate-y-1' : 'bg-white border border-slate-200 text-slate-600 hover:shadow-md'}`}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Absent</p>
          <p className="text-2xl font-black">{data.counts['Absent'] || 0}</p>
        </div>
        <div onClick={() => setFilter('Offline')} className={`p-4 rounded-xl cursor-pointer transition ${filter === 'Offline' ? 'bg-slate-500 text-white shadow-lg shadow-slate-200 transform -translate-y-1' : 'bg-white border border-slate-200 text-slate-600 hover:shadow-md'}`}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Offline</p>
          <p className="text-2xl font-black">{data.counts['Offline'] || 0}</p>
        </div>
      </div>

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start gap-4 hover:shadow-md transition">
            <div className="w-16 h-16 rounded-full bg-slate-200 shrink-0 overflow-hidden flex items-center justify-center text-xl font-bold text-slate-500">
              {member.photoUrl ? (
                <img src={`https://drive.google.com/uc?id=${member.photoUrl}`} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                member.name.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 truncate">{member.name}</h3>
              <p className="text-xs text-indigo-600 font-bold mb-2 truncate">{member.role}</p>
              
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider
                  ${member.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 
                    member.status === 'Outdoor Duty' ? 'bg-blue-100 text-blue-700' : 
                    member.status === 'On Leave' ? 'bg-amber-100 text-amber-700' : 
                    member.status === 'Absent' ? 'bg-rose-100 text-rose-700' : 
                    'bg-slate-100 text-slate-600'}`}
                >
                  {member.status}
                </span>
              </div>
              {member.statusNote && (
                <p className="text-xs text-slate-500 mt-2 truncate bg-slate-50 p-1.5 rounded border border-slate-100">
                  <i className="fa-solid fa-comment-dots mr-1 opacity-50"></i>
                  {member.statusNote}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}