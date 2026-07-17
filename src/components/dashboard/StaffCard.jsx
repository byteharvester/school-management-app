// src/components/dashboard/StaffCard.jsx
import { cleanId } from '../../utils/helpers';

export default function StaffCard({ staff, canEdit, onEdit, onViewHistory }) {
  const statusColors = {
    Present: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    Absent: { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
    'On Leave': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    'Outdoor Duty': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    Offline: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  };
  const color = statusColors[staff.status] || statusColors.Offline;

  const photoId = cleanId(staff.photoUrl);
  const initialStr = staff.name
    ? staff.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'ST';

  return (
    <div className="staff-card bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition hover:border-indigo-300 flex flex-col items-center text-center">
      <div className="relative mb-3">
        {photoId ? (
          <img
            src={`https://drive.google.com/thumbnail?id=${photoId}&sz=w150`}
            className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-white bg-slate-100"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
            alt=""
          />
        ) : null}
        <div
          className={`w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-md border-2 border-white ${photoId ? 'hidden' : ''}`}
        >
          {initialStr}
        </div>
        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${color.dot}`}></div>
      </div>

      <h4 className="font-bold text-slate-800 text-base w-full truncate">{staff.name || 'Unknown'}</h4>
      <p className={`text-[11px] font-bold px-3 py-0.5 rounded-full ${
        staff.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
        staff.role === 'Editor' ? 'bg-blue-100 text-blue-700' :
        staff.role === 'Teacher' ? 'bg-emerald-100 text-emerald-700' :
        'bg-indigo-100 text-indigo-700'
      } mt-1`}>
        {staff.role || 'Staff'}
      </p>

      <div className="w-full mt-2 flex flex-col gap-1 items-center">
        <span className={`text-[11px] font-bold ${color.text}`}>
          {staff.status || 'Offline'}
          {staff.statusNote ? ` ${staff.statusNote}` : ''}
        </span>
        {staff.classAssigned ? (
          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
            <i className="fa-solid fa-chalkboard-user"></i> {staff.classAssigned}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">No Class Assigned</span>
        )}
        {staff.lastUpdated && (
          <span className="text-[9px] text-slate-400">
            Updated: {new Date(staff.lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="w-full mt-3 pt-3 border-t border-slate-100 flex gap-2">
        {canEdit && (
          <button
            onClick={() => onEdit(staff.email, staff.name)}
            className="flex-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-100 transition border border-indigo-200"
          >
            <i className="fa-solid fa-pen"></i> Edit
          </button>
        )}
        <button
          onClick={() => onViewHistory(staff.email, staff.name)}
          className="flex-1 text-[10px] font-bold bg-slate-50 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-100 transition border border-slate-200"
        >
          <i className="fa-solid fa-clock"></i> Logs
        </button>
      </div>
    </div>
  );
}