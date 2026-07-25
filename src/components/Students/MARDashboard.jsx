import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { gasApi } from '../../api/gasApi';
import Swal from 'sweetalert2';

export default function MARDashboard() {
  const { currentUser } = useContext(AuthContext);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to get today's date in YYYY-MM-DD format based on local time
  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());

  const fetchMAR = async () => {
    setLoading(true);
    try {
      const data = await gasApi('getDailyMAR', { date: selectedDate });
      setSchedules(data || []);
    } catch (error) {
      Swal.fire('Error', 'Failed to load medicine schedule.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMAR(); }, [selectedDate]);

  const handleAdminister = async (scheduleId, studentName, medName, dose) => {
    const { value: formValues } = await Swal.fire({
      title: 'Administer Medicine',
      html: `
        <div class="text-left mt-3">
          <p class="text-sm text-slate-500 mb-4">Please confirm you are administering the following medicine:</p>
          <div class="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
            <p class="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Patient</p>
            <p class="font-black text-blue-900 text-lg">${studentName}</p>
          </div>
          <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-4">
            <p class="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Medicine & Dose</p>
            <p class="font-black text-indigo-900 text-lg">${medName} <span class="text-sm bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded ml-2">${dose}</span></p>
          </div>
          <label class="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Remarks (Optional)</label>
          <input id="mar-remarks" type="text" class="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" placeholder="e.g., Given after food, swallowed fine..." />
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: '<i class="fa-solid fa-check"></i> Yes, Mark as Given',
      preConfirm: () => document.getElementById('mar-remarks').value
    });

    if (formValues === undefined) return; // User cancelled

    setLoading(true);
    try {
      await gasApi('administerMedicine', {
        scheduleId: scheduleId,
        staffName: currentUser.Name,
        remarks: formValues
      });
      Swal.fire({ title: 'Success!', text: 'Dose recorded successfully.', icon: 'success', timer: 2000, showConfirmButton: false });
      fetchMAR();
    } catch (err) {
      Swal.fire('Error', 'Failed to update the record.', 'error');
      setLoading(false);
    }
  };

  // Calculate statistics for the top cards
  const stats = useMemo(() => {
    let s = { Total: 0, Given: 0, Upcoming: 0, Missed: 0 };
    schedules.forEach(row => {
      s.Total++;
      if (row['Status'] === 'Given') s.Given++;
      else if (row['Status'] === 'Missed') s.Missed++;
      else s.Upcoming++;
    });
    return s;
  }, [schedules]);

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight"><i className="fa-solid fa-pills text-indigo-500 mr-2"></i> MAR Dashboard</h2>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Medication Administration Record</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <button onClick={() => {
            const d = new Date(selectedDate); d.setDate(d.getDate() - 1);
            setSelectedDate(d.toISOString().split('T')[0]);
          }} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg"><i className="fa-solid fa-chevron-left"></i></button>
          
          <div className="flex items-center gap-2 px-2">
            <i className="fa-regular fa-calendar text-indigo-500"></i>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="font-bold text-slate-700 outline-none bg-transparent cursor-pointer text-sm" />
          </div>

          <button onClick={() => {
            const d = new Date(selectedDate); d.setDate(d.getDate() + 1);
            setSelectedDate(d.toISOString().split('T')[0]);
          }} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg"><i className="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 border-l-4 border-l-indigo-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Scheduled</p>
          <p className="text-2xl font-black text-slate-800">{stats.Total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Given Today</p>
          <p className="text-2xl font-black text-emerald-600">{stats.Given}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 border-l-4 border-l-blue-400">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Upcoming Doses</p>
          <p className="text-2xl font-black text-blue-600">{stats.Upcoming}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 border-l-4 border-l-rose-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Missed</p>
          <p className="text-2xl font-black text-rose-600">{stats.Missed}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center text-2xl mx-auto mb-3"><i className="fa-solid fa-bed"></i></div>
          <h3 className="font-black text-slate-700 text-lg">No Medicines Scheduled</h3>
          <p className="text-slate-400 text-sm font-semibold mt-1">There are no active prescriptions for this date.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-4 w-32">Time</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Medicine & Dose</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Sort array by time string roughly */}
                {schedules.sort((a, b) => a['ScheduledTime'].localeCompare(b['ScheduledTime'])).map((row, idx) => {
                  const isGiven = row['Status'] === 'Given';
                  const isMissed = row['Status'] === 'Missed';
                  
                  return (
                    <tr key={idx} className={`transition-colors hover:bg-slate-50 ${isGiven ? 'bg-emerald-50/30' : ''}`}>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 font-black px-3 py-1.5 rounded-lg text-xs">{row['ScheduledTime']}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-black text-slate-800">{row['StudentName']}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {row['IncidentID']}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-indigo-700">{row['MedicineName']}</p>
                        <p className="text-[10px] font-bold text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded mt-1">{row['Dose']}</p>
                      </td>
                      <td className="p-4">
                        {isGiven ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-wider"><i className="fa-solid fa-check-circle"></i> Given</span>
                            <p className="text-[9px] font-bold text-slate-400 mt-1">by {row['GivenBy']}</p>
                          </div>
                        ) : isMissed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 uppercase tracking-wider"><i className="fa-solid fa-triangle-exclamation"></i> Missed</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 uppercase tracking-wider"><i className="fa-solid fa-clock"></i> Upcoming</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {!isGiven && !isMissed && (
                          <button 
                            onClick={() => handleAdminister(row['ScheduleID'], row['StudentName'], row['MedicineName'], row['Dose'])}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-sm transition transform active:scale-95"
                          >
                            <i className="fa-solid fa-hand-holding-medical mr-1"></i> Administer
                          </button>
                        )}
                        {isGiven && (
                          <span className="text-emerald-500 font-bold text-xs"><i className="fa-solid fa-check"></i> Complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}