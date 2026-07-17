// src/components/dashboard/StudentDashboard.jsx
import { useEffect, useState } from 'react';
import { getStudentData } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import StudentCard from './StudentCard';
import StudentModal from '../modals/StudentModal';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const loadStudents = async () => {
    const data = await getStudentData();
    setStudents(data.students || []);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleEdit = (student) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingStudent(null);
  };

  const canEdit = user?.role === 'Admin' || user?.role === 'Editor';

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">Student Roster</h2>
        {canEdit && (
          <button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm active:scale-95">
            <i className="fa-solid fa-plus"></i> Enroll
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => (
          <StudentCard
            key={student.rowNum}
            student={student}
            canEdit={canEdit}
            onEdit={handleEdit}
          />
        ))}
      </div>

      <StudentModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        student={editingStudent}
        onSaved={loadStudents}
        canEdit={canEdit}
      />
    </div>
  );
}

// In StudentDashboard.jsx
useEffect(() => {
  getStudentData().then((data) => {
    console.log('📦 Student data received:', data);
    setStudents(data.students || []);
  }).catch(err => console.error('❌ Error fetching students:', err));
}, []);