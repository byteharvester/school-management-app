// src/components/common/AttendanceWidget.jsx
import { useEffect, useState } from 'react';
import { clockIn, clockOut, getTodayAttendance } from '../../api/endpoints';

export default function AttendanceWidget({ email, onStatusChange }) {
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState('');
  const [clockOutTime, setClockOutTime] = useState('');
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [statusText, setStatusText] = useState('Offline');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('--:--:--');
  const [dateDisplay, setDateDisplay] = useState('');

  // Real-time clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: true }));
      setDateDisplay(now.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load today's attendance on mount and after changes
  const loadAttendance = async () => {
    try {
      const data = await getTodayAttendance(email);
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (parsed.error) return;
      setClockedIn(parsed.isClockedIn || false);
      setClockInTime(parsed.clockIn || '');
      setClockOutTime(parsed.clockOut || '');
      setTotalSeconds(parsed.totalSeconds || 0);
      setStatusText(parsed.status || 'Offline');
    } catch (err) {
      console.error('Failed to load attendance:', err);
    }
  };

  useEffect(() => {
    if (email) loadAttendance();
  }, [email]);

  const handleClockIn = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation not available');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = `${pos.coords.latitude}, ${pos.coords.longitude}`;
        const res = await clockIn(email, loc);
        if (res.startsWith('Clocked in')) {
          loadAttendance();
          if (onStatusChange) onStatusChange('Present');
          alert(res);
        } else {
          alert(res);
        }
        setLoading(false);
      },
      (err) => { alert('GPS Error: ' + err.message); setLoading(false); }
    );
  };

  const handleClockOut = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation not available');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = `${pos.coords.latitude}, ${pos.coords.longitude}`;
        const res = await clockOut(email, loc);
        if (res.startsWith('Clocked out')) {
          loadAttendance();
          if (onStatusChange) onStatusChange('Offline');
          alert(res);
        } else {
          alert(res);
        }
        setLoading(false);
      },
      (err) => { alert('GPS Error: ' + err.message); setLoading(false); }
    );
  };

  // Update floor time ring
  const maxSeconds = 8 * 60 * 60; // 8 hours
  const percent = Math.min(totalSeconds / maxSeconds, 1);
  const circumference = 263.89;
  const offset = circumference - (circumference * percent);
  const ringColor = percent < 0.3 ? '#10b981' : percent < 0.7 ? '#f59e0b' : '#ef4444';

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  };

  return (
    <div className="w-full bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        {/* Circular Timer */}
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="6"></circle>
            <circle 
              cx="50" cy="50" r="42" 
              fill="none" 
              stroke={ringColor} 
              strokeWidth="6" 
              strokeLinecap="round" 
              strokeDasharray={circumference} 
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-slate-800 leading-none">{formatTime(totalSeconds)}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Floor Time</span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-slate-400">Current Time</p>
              <p className="text-2xl font-black text-slate-800 font-mono">{currentTime}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-400">Status</p>
              <p className={`text-sm font-bold ${statusText === 'Present' ? 'text-emerald-600' : 'text-rose-500'}`}>
                {statusText}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{dateDisplay}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleClockIn}
          disabled={clockedIn || loading}
          className={`py-3 font-bold rounded-lg text-sm transition shadow-sm active:scale-95 ${
            clockedIn || loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-arrow-right-to-bracket"></i>} Clock In
        </button>
        <button
          onClick={handleClockOut}
          disabled={!clockedIn || loading}
          className={`py-3 font-bold rounded-lg text-sm transition shadow-sm active:scale-95 ${
            !clockedIn || loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600 text-white'
          }`}
        >
          {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-arrow-right-from-bracket"></i>} Clock Out
        </button>
        <button
          onClick={() => window.openOutdoorDutyModal && window.openOutdoorDutyModal(email)}
          className="py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-sm transition shadow-sm active:scale-95"
        >
          <i className="fa-solid fa-route"></i> Outdoor
        </button>
      </div>
    </div>
  );
}