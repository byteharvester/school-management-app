import React from 'react';
export default function StudentCard({ student, canEdit, onEdit }) {
  const isPresent = student.Attendance === 'Present';
  const isAbsent = student.Attendance === 'Absent';
  
  let ringColorClass = 'border-[#f59e0b]'; // Leave/Default
  if (isPresent) ringColorClass = 'border-[#10b981]';
  if (isAbsent) ringColorClass = 'border-[#ef4444]';

  return (
    <div className="...">
      {/* ... card content ... */}
      <div className="mt-3 flex gap-2">
        {canEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(student); }}
            className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100"
          >
            <i className="fa-solid fa-pen"></i> Edit
          </button>
        )}
        {/* ... maybe view details button ... */}
      </div>
    </div>
  );
}