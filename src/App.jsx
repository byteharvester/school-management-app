import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/auth/Login';
import StaffProfile from './components/Staff/StaffProfile';
import InventoryDashboard from './components/Inventory/InventoryDashboard';
import LeaveDashboard from './components/Leaves/LeaveDashboard';
import StaffDashboard from './components/Staff/StaffDashboard';
import AdminLeaveApprovals from './components/Leaves/AdminLeaveApprovals';
import StudentOverview from './components/Students/StudentOverview';
import MARDashboard from './components/Students/MARDashboard'; // <-- ADD THIS
// The main interface (only shown if logged in)
function MainInterface() {
  const { currentUser, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('student-dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Helper to close dropdown when a link is clicked
  const handleNavClick = (tabName) => {
    setActiveTab(tabName);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* Top Header Navigation Bar */}
      <header className="bg-slate-900 text-white shadow-md z-30 sticky top-0 px-4 py-3 flex justify-between items-center h-16">
        
        {/* Left Side: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
            <i className="fa-solid fa-school text-xl text-white"></i>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-wider text-indigo-400 leading-tight">BeedSchool</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-tight">Management System</p>
          </div>
        </div>
        
        {/* Right Side: Profile Menu */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
            className="flex items-center gap-3 focus:outline-none bg-slate-800 hover:bg-slate-700 pl-3 pr-1.5 py-1.5 rounded-full transition-colors border border-slate-700"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold leading-tight truncate max-w-[120px]">{currentUser.Name}</p>
              <p className="text-[9px] text-indigo-400 uppercase font-bold tracking-wider">{currentUser.Role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold shadow-sm border-2 border-slate-900">
              {currentUser.Name ? currentUser.Name.charAt(0) : 'U'}
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {isDropdownOpen && (
            <>
              {/* Invisible overlay to catch clicks outside */}
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
              
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-slate-100 overflow-hidden transform origin-top-right transition-all">
                
                {/* Mobile Info Display (Hidden on Desktop) */}
                <div className="md:hidden px-5 py-3 border-b border-slate-100 mb-2 bg-slate-50">
                  <p className="text-sm font-black text-slate-800 truncate">{currentUser.Name}</p>
                  <p className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider">{currentUser.Role}</p>
                </div>

                <div className="px-2 space-y-1">
                  <button onClick={() => handleNavClick('staff')} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${activeTab === 'staff' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <i className={`fa-solid fa-user-tie w-5 text-center ${activeTab === 'staff' ? 'text-indigo-600' : 'text-slate-400'}`}></i> My Profile
                  </button>
                  <button onClick={() => handleNavClick('directory')} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${activeTab === 'directory' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <i className={`fa-solid fa-address-book w-5 text-center ${activeTab === 'directory' ? 'text-indigo-600' : 'text-slate-400'}`}></i> Directory
                  </button>
                  <button onClick={() => handleNavClick('inventory')} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${activeTab === 'inventory' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <i className={`fa-solid fa-boxes-stacked w-5 text-center ${activeTab === 'inventory' ? 'text-indigo-600' : 'text-slate-400'}`}></i> Inventory
                  </button>
                  <button onClick={() => handleNavClick('leaves')} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${activeTab === 'leaves' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <i className={`fa-solid fa-calendar-minus w-5 text-center ${activeTab === 'leaves' ? 'text-indigo-600' : 'text-slate-400'}`}></i> Leaves
                  </button>
                  
                  {(currentUser.Role === 'Admin' || currentUser.Role === 'Headmaster') && (
                    <button onClick={() => handleNavClick('leave-admin')} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${activeTab === 'leave-admin' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <i className={`fa-solid fa-list-check w-5 text-center ${activeTab === 'leave-admin' ? 'text-indigo-600' : 'text-slate-400'}`}></i> Leave Admin
                    </button>
                  )}
                  
                  <button onClick={() => handleNavClick('student-dashboard')} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${activeTab === 'student-dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <i className={`fa-solid fa-graduation-cap w-5 text-center ${activeTab === 'student-dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}></i> Student Dashboard
                  </button>
                  {/* NEW MAR DASHBOARD BUTTON */}
<button onClick={() => handleNavClick('mar-dashboard')} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-3 ${activeTab === 'mar-dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
  <i className={`fa-solid fa-pills w-5 text-center ${activeTab === 'mar-dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}></i> MAR Desk (Medicines)
</button>
                </div>

                <div className="px-2 mt-2 pt-2 border-t border-slate-100">
                  <button onClick={logout} className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-3">
                    <i className="fa-solid fa-right-from-bracket w-5 text-center text-rose-500"></i> Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area (Scrolls independently of the header) */}
      <main className="flex-1 overflow-y-auto relative">
        {activeTab === 'staff' && <StaffProfile email={currentUser.Email} />}
        {activeTab === 'inventory' && <InventoryDashboard />}
        {activeTab === 'leaves' && <LeaveDashboard />}
        {activeTab === 'directory' && <StaffDashboard />}
        {activeTab === 'leave-admin' && <AdminLeaveApprovals />}
        {activeTab === 'student-dashboard' && <StudentOverview />}
        {/* NEW MAR RENDERER */}
        {activeTab === 'mar-dashboard' && <MARDashboard />}
      </main>

    </div>
  );
}

// App Wrapper handles the auth logic routing
export default function App() {
  return (
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

// Helper to decide what to render based on auth state
function AuthConsumer() {
  const { currentUser, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 font-bold text-indigo-500">
        <i className="fa-solid fa-spinner fa-spin text-4xl mb-4"></i>
        Loading System...
      </div>
    );
  }

  return currentUser ? <MainInterface /> : <Login />;
}