// src/App.jsx
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import StudentDashboard from './components/dashboard/StudentDashboard';
import StaffDashboard from './components/dashboard/StaffDashboard';

// Tab Switcher component
function Navigation() {
  const location = useLocation();
  const { user } = useAuth();
  const isStaffRoute = location.pathname === '/staff';

  // Only show Staff tab if Admin
  const showStaffTab = user?.role === 'Admin';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1 flex flex-wrap gap-1 mb-4">
      <Link
        to="/"
        className={`px-6 py-2 font-bold text-sm transition tracking-wide ${
          !isStaffRoute
            ? 'text-indigo-600 border-b-2 border-indigo-600'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        Students
      </Link>
      {showStaffTab && (
        <Link
          to="/staff"
          className={`px-6 py-2 font-bold text-sm transition tracking-wide ${
            isStaffRoute
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Staff
        </Link>
      )}
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-indigo-600 text-xl">Loading...</div>;
  }

  if (!user || user.role === 'Blocked') {
    return <div className="flex items-center justify-center h-screen text-red-600 text-xl">Access Denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-3 py-3">
      <Header user={user} />
      <Navigation />
      <Routes>
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/staff" element={<StaffDashboard />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;