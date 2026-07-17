// src/components/common/RingChart.jsx
export default function RingChart({ value, max, color, label, icon, onClick }) {
    const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const circumference = 145;
    const offset = circumference - (circumference * percent) / 100;
  
    return (
      <div onClick={onClick} className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm hover:border-indigo-400 cursor-pointer transition transform hover:-translate-y-0.5 min-w-[160px] flex-1">
        <div className="relative w-[72px] h-[72px] shrink-0">
          <svg className="w-[72px] h-[72px] transform -rotate-90" viewBox="0 0 54 54">
            <circle cx="27" cy="27" r="23" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
            <circle
              cx="27" cy="27" r="23"
              fill="none"
              stroke={color}
              strokeWidth="4.5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[16px] font-black text-slate-800 leading-none">{percent}%</span>
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
          <p className="text-xl font-black text-slate-800 leading-none mt-1">
            {value} <span className="text-[11px] font-medium text-slate-400 ml-1"><i className={`fa-solid ${icon}`}></i></span>
          </p>
        </div>
      </div>
    );
  }