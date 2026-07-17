// src/components/layout/Header.jsx
export default function Header({ user }) {
    return (
      <header className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-school text-indigo-600 text-2xl"></i>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 leading-none">RUKHMAIGOVIND</h1>
            <p className="text-[10px] font-bold text-indigo-500 tracking-wider">MATIMAND NIVASI VIDYALAY</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700">{user?.name || 'Staff'}</span>
          <span className="text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">{user?.role}</span>
        </div>
      </header>
    );
  }