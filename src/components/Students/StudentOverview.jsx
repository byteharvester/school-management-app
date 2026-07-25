import React, { useState, useEffect, useMemo, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { gasApi } from '../../api/gasApi';
import StudentProfileModal from './StudentProfileModal';
import MedicalDeskModal from './MedicalDeskModal'; // <-- ADD THIS IMPORT
import Swal from 'sweetalert2';

// Exact Replica of the Old App's Circular Ring
const StatCard = ({ title, count, icon, color, percent, boys, girls, onClick, isActive }) => {
  const radius = 23;
  const circumference = 2 * Math.PI * radius;
  const visualPercent = Math.min(percent, 100);
  const dashoffset = circumference - (circumference * visualPercent) / 100;

  return (
    <div onClick={onClick} className={`bg-white border ${isActive ? `border-[${color}] ring-2 ring-[${color}]/20` : 'border-slate-200 hover:border-indigo-300'} rounded-2xl p-3 shadow-sm flex items-center gap-3 cursor-pointer active:scale-95 transition-all`}>
      <div className="relative w-[72px] h-[72px] shrink-0">
        <svg className="w-[72px] h-[72px] transform -rotate-90" viewBox="0 0 54 54">
          <circle cx="27" cy="27" r="23" fill="none" stroke="#f1f5f9" strokeWidth="4.5"></circle>
          <circle cx="27" cy="27" r="23" fill="none" stroke={color} strokeWidth="4.5" strokeDasharray={circumference} strokeDashoffset={dashoffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }}></circle>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
          <span className="text-[16px] font-black text-slate-800 leading-none">{percent}%</span>
          <span className="text-[9px] font-bold text-slate-500 mt-0.5 tracking-wider">B:{boys} G:{girls}</span>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-800 leading-none">
          {count} <i className={`fa-solid ${icon} text-sm text-slate-400 ml-1`}></i>
        </p>
      </div>
    </div>
  );
};

export default function StudentOverview() {
  const { currentUser } = useContext(AuthContext); // <-- Add this line
  const [data, setData] = useState({ allList: [] });
  const [loading, setLoading] = useState(true);
  const [selectedStudentName, setSelectedStudentName] = useState(null);

  const [selectedMedicalStudent, setSelectedMedicalStudent] = useState(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterBroughtBy, setFilterBroughtBy] = useState('');
  const [activeCardFilter, setActiveCardFilter] = useState('All'); 

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const result = await gasApi('getStudentDashboard');
      setData(result);
    } catch (error) { 
      Swal.fire('Error', 'Failed to load dashboard data', 'error'); 
    } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  // PRO CONFIRMATION ALERTS FOR ATTENDANCE
  const handleAttendance = async (e, studentName, status) => {
    e.stopPropagation();
    
    // Custom colors based on the status
    let btnColor = status === 'Present' ? '#10b981' : (status === 'Absent' ? '#f43f5e' : '#f59e0b');

    const result = await Swal.fire({
      title: 'Update Attendance?',
      text: `Are you sure you want to mark ${studentName} as ${status}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: btnColor,
      cancelButtonColor: '#94a3b8',
      confirmButtonText: `Yes, Mark ${status}`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    const prevList = [...data.allList];
    setData({ allList: data.allList.map(s => s.name === studentName ? { ...s, attendance: status } : s) });
    
    try { 
      await gasApi('updateStudentAttendance', { studentName, status }); 
    } catch (err) { 
      Swal.fire('Error', 'Failed to update attendance.', 'error');
      setData({ allList: prevList }); 
    }
  };

  // PRO CONFIRMATION & INPUT ALERTS FOR HEALTH
  // PRO CONFIRMATION & ADVANCED MEDICAL LOGGING
  const handleHealth = async (e, studentName, status) => {
    e.stopPropagation();
    
    if (status === 'Injured' || status === 'Sick') {
      // 1. Launch the Advanced Medical Form Popup
      const { value: formValues } = await Swal.fire({
        title: `Report Medical Incident`,
        html: `
          <div class="text-left mt-2">
            <div class="mb-3">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Patient Name</span>
              <div class="font-black text-slate-800 text-lg">${studentName} <span class="text-sm font-bold ${status === 'Injured' ? 'text-rose-500' : 'text-amber-500'}">(${status})</span></div>
            </div>
            
            <label class="block text-[10px] font-bold text-indigo-900 mb-1 uppercase tracking-wider"><i class="fa-solid fa-stethoscope mr-1"></i> Symptoms / Reason</label>
            <textarea id="swal-symptoms" class="w-full p-3 border border-slate-300 rounded-xl mb-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 shadow-inner" placeholder="e.g. High fever since morning, Fell on the playground..." rows="2"></textarea>
            
            <label class="block text-[10px] font-bold text-indigo-900 mb-1 uppercase tracking-wider"><i class="fa-solid fa-truck-medical mr-1"></i> Civil Hospital Action</label>
            <select id="swal-hospital" class="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 shadow-inner">
              <option value="Pending / Observation">Pending / Keeping under observation</option>
              <option value="Yes - Immediate">Yes - Sending to hospital immediately</option>
              <option value="Routine Checkup">Routine Checkup Scheduled</option>
            </select>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: status === 'Injured' ? '#e11d48' : '#f59e0b',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Log Incident',
        preConfirm: () => {
          const symptoms = document.getElementById('swal-symptoms').value;
          if (!symptoms) {
            Swal.showValidationMessage('Please enter the symptoms or reason for the record.');
            return false;
          }
          return {
            symptoms: symptoms,
            hospitalVisit: document.getElementById('swal-hospital').value
          }
        }
      });

      if (!formValues) return; // User cancelled

      // 2. Show Loading State
      Swal.fire({
        title: 'Logging to Database...',
        text: 'Creating medical record and updating student profile.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading() }
      });

      const prevList = [...data.allList];
      setData({ allList: data.allList.map(s => s.name === studentName ? { ...s, health: status } : s) });
      
      try { 
        // 3. Update the main Student Sheet (Turns the ring Yellow/Red)
        await gasApi('updateStudentHealth', { studentName, status, note: formValues.symptoms }); 
        
        // 4. Create the detailed Medical Record for the new Sheet
        await gasApi('addMedicalRecord', {
          studentName: studentName,
          reportedBy: currentUser.Name,
          incidentType: status,
          symptoms: formValues.symptoms,
          hospitalVisit: formValues.hospitalVisit
        });

        Swal.fire({ title: 'Logged Successfully!', text: 'The medical record has been created and is pending doctor review.', icon: 'success', timer: 2500, showConfirmButton: false });
      } catch (err) { 
        Swal.fire('Error', 'Failed to log the medical record securely.', 'error');
        setData({ allList: prevList }); 
      }

    } else {
      // MARKING AS FIT (No form required)
      const result = await Swal.fire({
        title: 'Mark as Fit?',
        text: `Are you sure ${studentName} has fully recovered?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Yes, mark as Fit'
      });
      if (!result.isConfirmed) return;

      const prevList = [...data.allList];
      setData({ allList: data.allList.map(s => s.name === studentName ? { ...s, health: status } : s) });
      
      try { 
        await gasApi('updateStudentHealth', { studentName, status, note: 'Recovered' }); 
      } catch (err) { 
        Swal.fire('Error', 'Failed to update medical status.', 'error');
        setData({ allList: prevList }); 
      }
    }
  };

  const { c, broughtCounts } = useMemo(() => {
    let c = {
      Tot: 0, Boy: 0, Girl: 0, P: 0, PBoy: 0, PGirl: 0, A: 0, ABoy: 0, AGirl: 0,
      L: 0, LBoy: 0, LGirl: 0, Sick: 0, MedBoy: 0, MedGirl: 0, ToiletTrained: 0, TrainedBoy: 0, TrainedGirl: 0,
      NotTrained: 0, NotTrainedBoy: 0, NotTrainedGirl: 0, UpDown: 0, UpDownBoy: 0, UpDownGirl: 0
    };
    let broughtCounts = {};

    (data.allList || []).forEach(s => {
      const isBoy = s.gender?.toLowerCase() === 'male' || s.gender?.toLowerCase() === 'boy';
      const isGirl = s.gender?.toLowerCase() === 'female' || s.gender?.toLowerCase() === 'girl';
      
      c.Tot++;
      if (isBoy) c.Boy++; else if (isGirl) c.Girl++;

      if (s.attendance === 'Present') { c.P++; if (isBoy) c.PBoy++; else if (isGirl) c.PGirl++; }
      else if (s.attendance === 'Absent') { c.A++; if (isBoy) c.ABoy++; else if (isGirl) c.AGirl++; }
      else { c.L++; if (isBoy) c.LBoy++; else if (isGirl) c.LGirl++; }

      if (s.health === 'Sick' || s.health === 'Injured') { c.Sick++; if (isBoy) c.MedBoy++; else if (isGirl) c.MedGirl++; }
      if (s.toiletStatus === 'Trained') { c.ToiletTrained++; if (isBoy) c.TrainedBoy++; else if (isGirl) c.TrainedGirl++; }
      else { c.NotTrained++; if (isBoy) c.NotTrainedBoy++; else if (isGirl) c.NotTrainedGirl++; }
      if (s.residentialStatus === 'Day Scholar') { c.UpDown++; if (isBoy) c.UpDownBoy++; else if (isGirl) c.UpDownGirl++; }

      if (s.broughtBy) broughtCounts[s.broughtBy] = (broughtCounts[s.broughtBy] || 0) + 1;
    });

    return { c, broughtCounts };
  }, [data.allList]);

  const displayedList = useMemo(() => {
    let list = data.allList || [];
    
    if (searchQuery) list = list.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterClass) list = list.filter(s => s.className === filterClass);
    if (filterGender === 'Male') list = list.filter(s => s.gender?.toLowerCase() === 'male' || s.gender?.toLowerCase() === 'boy');
    if (filterGender === 'Female') list = list.filter(s => s.gender?.toLowerCase() === 'female' || s.gender?.toLowerCase() === 'girl');
    if (filterBroughtBy) list = list.filter(s => s.broughtBy === filterBroughtBy);

    if (activeCardFilter === 'Present') list = list.filter(s => s.attendance === 'Present');
    if (activeCardFilter === 'Absent') list = list.filter(s => s.attendance === 'Absent');
    if (activeCardFilter === 'Leave') list = list.filter(s => s.attendance === 'Leave' || s.attendance === 'On Leave');
    if (activeCardFilter === 'Day Scholar') list = list.filter(s => s.residentialStatus === 'Day Scholar');
    if (activeCardFilter === 'Medical') list = list.filter(s => s.health === 'Sick' || s.health === 'Injured');
    if (activeCardFilter === 'Trained') list = list.filter(s => s.toiletStatus === 'Trained');
    if (activeCardFilter === 'NotTrained') list = list.filter(s => s.toiletStatus !== 'Trained');
    
    return list;
  }, [data.allList, searchQuery, filterClass, filterGender, filterBroughtBy, activeCardFilter]);

  const calcPercent = (val) => Math.round((val / 80) * 100);

  if (loading) return <div className="fixed inset-0 bg-slate-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen relative">
      
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-solid fa-xmark"></i></button>}
        
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none shadow-sm focus:ring-2 focus:ring-indigo-500">
            <option value="">All Classes</option>
            <option value="Play-Group">Play-Group</option><option value="Pre-Primary">Pre-Primary</option>
            <option value="Primary">Primary</option><option value="Primary -I">Primary -I</option><option value="Primary -II">Primary -II</option>
            <option value="Secondary">Secondary</option><option value="Secondary -I">Secondary -I</option><option value="Secondary -II">Secondary -II</option>
            <option value="Pre-Vocational">Pre-Vocational</option><option value="Pre-Vocational -I">Pre-Vocational -I</option>
          </select>
          <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none shadow-sm focus:ring-2 focus:ring-indigo-500">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select value={filterBroughtBy} onChange={(e) => setFilterBroughtBy(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none shadow-sm focus:ring-2 focus:ring-indigo-500">
            <option value="">Filter Brought By...</option>
            {Object.keys(broughtCounts).sort().map(k => <option key={k} value={k}>{k} ({broughtCounts[k]})</option>)}
          </select>
          <button onClick={fetchDashboard} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2.5 rounded-xl shadow-sm transition"><i className="fa-solid fa-rotate-right"></i></button>
      
      {/* NEW: ENROLL BUTTON */}
      <button onClick={() => setIsEnrolling(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-sm font-bold flex items-center gap-2 transition"><i className="fa-solid fa-user-plus"></i> Enroll Student</button>
    </div>
      </div>

      {(activeCardFilter !== 'All' || filterClass || filterGender || filterBroughtBy || searchQuery) && (
        <div className="mb-4 text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-2 border border-indigo-200">
          <i className="fa-solid fa-filter"></i> 
          Showing Filtered Results ({displayedList.length} Students)
          <button onClick={() => { setActiveCardFilter('All'); setFilterClass(''); setFilterGender(''); setFilterBroughtBy(''); setSearchQuery(''); }} className="ml-2 hover:text-rose-500"><i className="fa-solid fa-xmark"></i> Clear</button>
          </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard title="Enrolled (Max 80)" count={c.Tot} percent={calcPercent(c.Tot)} boys={c.Boy} girls={c.Girl} icon="fa-users" color="#6366f1" isActive={activeCardFilter==='All'} onClick={() => setActiveCardFilter('All')} />
        <StatCard title="Present" count={c.P} percent={calcPercent(c.P)} boys={c.PBoy} girls={c.PGirl} icon="fa-user-check" color="#10b981" isActive={activeCardFilter==='Present'} onClick={() => setActiveCardFilter('Present')} />
        <StatCard title="Absent" count={c.A} percent={calcPercent(c.A)} boys={c.ABoy} girls={c.AGirl} icon="fa-user-xmark" color="#f43f5e" isActive={activeCardFilter==='Absent'} onClick={() => setActiveCardFilter('Absent')} />
        <StatCard title="Day Scholar" count={c.UpDown} percent={calcPercent(c.UpDown)} boys={c.UpDownBoy} girls={c.UpDownGirl} icon="fa-arrow-up-right-dots" color="#f59e0b" isActive={activeCardFilter==='Day Scholar'} onClick={() => setActiveCardFilter('Day Scholar')} />
        <StatCard title="On Leave" count={c.L} percent={calcPercent(c.L)} boys={c.LBoy} girls={c.LGirl} icon="fa-user-clock" color="#fb923c" isActive={activeCardFilter==='Leave'} onClick={() => setActiveCardFilter('Leave')} />
        <StatCard title="Medical Alert" count={c.Sick} percent={calcPercent(c.Sick)} boys={c.MedBoy} girls={c.MedGirl} icon="fa-suitcase-medical" color="#3b82f6" isActive={activeCardFilter==='Medical'} onClick={() => setActiveCardFilter('Medical')} />
        <StatCard title="Toilet Train" count={c.ToiletTrained} percent={calcPercent(c.ToiletTrained)} boys={c.TrainedBoy} girls={c.TrainedGirl} icon="fa-toilet" color="#8b5cf6" isActive={activeCardFilter==='Trained'} onClick={() => setActiveCardFilter('Trained')} />
        <StatCard title="Not Trained" count={c.NotTrained} percent={calcPercent(c.NotTrained)} boys={c.NotTrainedBoy} girls={c.NotTrainedGirl} icon="fa-baby-carriage" color="#ec4899" isActive={activeCardFilter==='NotTrained'} onClick={() => setActiveCardFilter('NotTrained')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedList.map((student, idx) => {
          let ringColor = 'border-slate-200';
          if (student.attendance === 'Present') ringColor = 'border-emerald-500';
          else if (student.attendance === 'Absent') ringColor = 'border-rose-500';
          else if (student.attendance === 'On Leave' || student.attendance === 'Leave') ringColor = 'border-amber-500';
          if (student.residentialStatus === 'Day Scholar' && student.attendance === 'Present') ringColor = 'border-yellow-400';

          const habits = student.habits ? student.habits.split(',').filter(h => h.trim()) : [];

          return (
            <div key={idx} onClick={() => setSelectedStudentName(student.name)} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-indigo-300 transition cursor-pointer flex flex-col active:scale-[0.99]">
              
              <div className="flex items-start gap-3 mb-2">
                <div className="shrink-0 flex flex-col items-center">
                  {student.photoId ? (
                    <img src={`https://drive.google.com/thumbnail?id=${student.photoId}&sz=w150`} className={`w-14 h-14 rounded-full object-cover shadow-sm bg-slate-100 border-4 ${ringColor}`} alt="" />
                  ) : (
                    <div className={`w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xl border-4 ${ringColor}`}><i className="fa-solid fa-user"></i></div>
                  )}
                  {student.residentialStatus === 'Day Scholar' && <div className="mt-1"><span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-full border border-amber-300">UpDown</span></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{student.name}</h4>
                  <p className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 inline-block px-1.5 py-0.5 rounded mt-0.5">{student.className || 'Class'} | GR: {student.gr || '-'}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{student.toiletStatus === 'Trained' ? <span className="text-emerald-500"><i className="fa-solid fa-toilet"></i> Trained</span> : <span className="text-rose-400"><i className="fa-solid fa-baby-carriage"></i> Not Trained</span>}</p>
                  {habits.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{habits.map((h, i) => <span key={i} className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-bold rounded border border-rose-100 uppercase">{h.trim()}</span>)}</div>}
                </div>
              </div>

              <div className="mt-1 mb-2 bg-slate-50 rounded border border-slate-100 p-1.5 text-[9.5px] font-semibold text-slate-500 space-y-1">
                <div className="truncate text-indigo-700"><i className="fa-solid fa-chalkboard-user w-3"></i> CT: {student.classTeacher}</div>
                <div className="truncate text-emerald-700"><i className="fa-solid fa-handshake-angle w-3"></i> Brought: {student.broughtBy || '-'}</div>
              </div>

              <div className="mt-auto space-y-2 no-select">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Attendance</p>
                  <div className="flex rounded border border-slate-200 bg-slate-50 text-[10px] font-bold overflow-hidden" onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => handleAttendance(e, student.name, 'Present')} className={`flex-1 py-1 transition ${student.attendance === 'Present' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-emerald-100'}`}>Present</button>
                    <button onClick={(e) => handleAttendance(e, student.name, 'Absent')} className={`flex-1 border-x border-slate-200 py-1 transition ${student.attendance === 'Absent' ? 'bg-rose-500 text-white' : 'text-slate-500 hover:bg-rose-100'}`}>Absent</button>
                    <button onClick={(e) => handleAttendance(e, student.name, 'Leave')} className={`flex-1 py-1 transition ${student.attendance === 'Leave' || student.attendance === 'On Leave' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-amber-100'}`}>Leave</button>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">Medical Status</p>
                  <div className="flex rounded border border-slate-200 bg-slate-50 text-[10px] font-bold overflow-hidden" onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => handleHealth(e, student.name, 'Fit')} className={`flex-1 py-1 transition ${student.health === 'Fit' || student.health === 'Healthy' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-blue-100'}`}><i className="fa-solid fa-heart"></i> Fit</button>
                    <button onClick={(e) => handleHealth(e, student.name, 'Sick')} className={`flex-1 border-x border-slate-200 py-1 transition ${student.health === 'Sick' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-amber-100'}`}><i className="fa-solid fa-virus"></i> Sick</button>
                    <button onClick={(e) => handleHealth(e, student.name, 'Injured')} className={`flex-1 py-1 transition ${student.health === 'Injured' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-rose-100'}`}><i className="fa-solid fa-bandage"></i> Injured</button>
                  </div>
                 
                 <div> 
                  {/* NEW: DEDICATED MEDICAL DESK BUTTON (Only shows when sick/injured) */}
                  {(student.health === 'Sick' || student.health === 'Injured') && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedMedicalStudent(student.name); }} 
                      className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md text-[10px] font-black uppercase tracking-wider flex justify-center items-center gap-2 transition"
                    >
                      <i className="fa-solid fa-briefcase-medical text-sm"></i> Open Medical Desk
                    </button>
                  )}
                </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayedList.length === 0 && !loading && <div className="text-center py-10 text-slate-400 font-bold">No students found.</div>}
      {selectedStudentName && <StudentProfileModal studentName={selectedStudentName} onClose={() => { setSelectedStudentName(null); fetchDashboard(); }} />}
      {isEnrolling && <StudentProfileModal studentName="NEW_STUDENT_MODE" isNew={true} onClose={() => { setIsEnrolling(false); fetchDashboard(); }} />}
      {selectedMedicalStudent && <MedicalDeskModal studentName={selectedMedicalStudent} onClose={() => { setSelectedMedicalStudent(null); fetchDashboard(); }} />}
    </div>
  );
}