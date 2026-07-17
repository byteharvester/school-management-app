// src/components/dashboard/StaffDashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStaffDashboardData, getStaffByStatus } from '../../api/endpoints';
import StaffCard from './StaffCard';
import RingChart from '../common/RingChart';

export default function StaffDashboard({ onEditStaff, onViewHistory }) {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({
    total: 0, present: 0, absent: 0, onLeave: 0, outdoorDuty: 0, offline: 0
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getStaffDashboardData();
      // data is JSON string from GAS, parse it
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      setStaff(parsed.staff || []);
      setStats({
        total: parsed.total || 0,
        present: parsed.counts?.Present || 0,
        absent: parsed.counts?.Absent || 0,
        onLeave: parsed.counts?.['On Leave'] || 0,
        outdoorDuty: parsed.counts?.['Outdoor Duty'] || 0,
        offline: parsed.counts?.Offline || 0,
      });
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openStaffList = async (status, title) => {
    // You can implement a modal to show staff by status
    // For now, we'll just alert the count, but you can create a staff list modal.
    alert(`${title}: ${stats[status] || 0} staff members`);
    // If you want to show a modal, you can reuse the staff list modal from your original app.
  };

  const ringData = [
    { key: 'total', label: 'Total Staff', color: '#6366f1', icon: 'fa-users', filter: 'All' },
    { key: 'present', label: 'Present', color: '#10b981', icon: 'fa-user-check', filter: 'Present' },
    { key: 'absent', label: 'Absent', color: '#f43f5e', icon: 'fa-user-xmark', filter: 'Absent' },
    { key: 'onLeave', label: 'On Leave', color: '#f59e0b', icon: 'fa-clock', filter: 'On Leave' },
    { key: 'outdoorDuty', label: 'Outdoor Duty', color: '#3b82f6', icon: 'fa-route', filter: 'Outdoor Duty' },
    { key: 'offline', label: 'Offline', color: '#94a3b8', icon: 'fa-circle', filter: 'Offline' },
  ];

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading staff...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 w-full mb-4">
        {ringData.map((r) => (
          <RingChart
            key={r.key}
            value={stats[r.key] || 0}
            max={stats.total || 1}
            color={r.color}
            label={r.label}
            icon={r.icon}
            onClick={() => openStaffList(r.key, r.label)}
          />
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Staff Members</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {staff.map((member) => (
            <StaffCard
              key={member.email}
              staff={member}
              canEdit={user?.role === 'Admin' || user?.email === member.email}
              onEdit={onEditStaff}
              onViewHistory={onViewHistory}
            />
          ))}
        </div>
        {staff.length === 0 && (
          <div className="text-center py-12 text-slate-400">No staff members found.</div>
        )}
      </div>
    </div>
  );
}
