import React, { useState, useEffect } from 'react';
import { gasApi } from '../../api/gasApi';

export default function StudentDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Health Modal State
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [savingHealth, setSavingHealth] = useState(false);
  const [healthForm, setHealthForm] = useState({
    status: '',
    notes: ''
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await gasApi('getStudents');
      setStudents(data);
    } catch (error) {
      console.error("Failed to fetch students", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAttendance = async (rowNum, status) => {
    try {
      await gasApi('updateStudentAttendance', { rowNum, status });
      // Optimistically update the UI to feel instant
      setStudents(students.map(s => 
        s.rowNum === rowNum ? { ...s, 'Attendance': status } : s
      ));
    } catch (error) {
      alert("Failed to update attendance: " + error.message);
    }
  };

  const openHealthModal = (student) => {
    setSelectedStudent(student);
    setHealthForm({
      status: student['Health'] || '',
      notes: student['Health Notes'] || ''
    });
    setIsHealthModalOpen(true);
  };

  const handleHealthSubmit = async (e) => {
    e.preventDefault();
    setSavingHealth(true);
    
    try {
      await gasApi('updateStudentHealth', { 
        rowNum: selectedStudent.rowNum, 
        healthStatus: healthForm.status,
        notes: healthForm.notes
      });
      
      // Optimistically update the local state
      setStudents(students.map(s => 
        s.rowNum === selectedStudent.rowNum 
          ? { ...s, 'Health': healthForm.status, 'Health Notes': healthForm.notes } 
          : s
      ));
      
      setIsHealthModalOpen(false);
    } catch (error) {
      alert("Failed to update health record: " + error.message);
    } finally {
      setSavingHealth(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Student Roster</h2>
        <button 
          onClick={fetchStudents}
          className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg font-bold transition shadow-sm flex items-center gap-2"
        >
          <i className="fa-solid fa-rotate-right"></i> Refresh List
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading student data...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-800 text-white text-sm uppercase tracking-wider">
                <tr>
                  <th className="p-4">GR #</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Health Status</th>
                  <th className="p-4 text-center">Quick Attendance</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {students.length === 0 ? (
                  <tr><td colSpan="5" className="p-6 text-center text-slate-400">No students found.</td></tr>
                ) : (
                  students.map((student, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-4 font-mono text-xs">{student['GR Number']}</td>
                      <td className="p-4 font-bold">{student['Name']}</td>
                      <td className="p-4">{student['Class']}</td>
                      
                      {/* Clickable Health Cell */}
                      <td className="p-4">
                        <button 
                          onClick={() => openHealthModal(student)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 transition-colors text-xs font-bold w-full max-w-[160px]"
                        >
                          <span className={`truncate ${student['Health'] ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {student['Health'] || 'Not set'}
                          </span>
                          <i className="fa-solid fa-pen-to-square ml-auto opacity-50"></i>
                        </button>
                      </td>

                      <td className="p-4 flex justify-center gap-2">
                        <button 
                          onClick={() => handleAttendance(student.rowNum, 'Present')}
                          className={`px-3 py-1 rounded-md font-bold transition ${student['Attendance'] === 'Present' ? 'bg-emerald-500 text-white shadow-inner' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                        >
                          P
                        </button>
                        <button 
                          onClick={() => handleAttendance(student.rowNum, 'Absent')}
                          className={`px-3 py-1 rounded-md font-bold transition ${student['Attendance'] === 'Absent' ? 'bg-rose-500 text-white shadow-inner' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                        >
                          A
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Health Update Modal */}
      {isHealthModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">
                Health Record: <span className="text-indigo-600">{selectedStudent['Name']}</span>
              </h3>
              <button onClick={() => setIsHealthModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleHealthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Health Status</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Healthy, Fever, Injured"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={healthForm.status}
                  onChange={e => setHealthForm({...healthForm, status: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Health Notes & Medications</label>
                <textarea 
                  rows="3" 
                  placeholder="Provide details about medications, symptoms, or instructions..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  value={healthForm.notes}
                  onChange={e => setHealthForm({...healthForm, notes: e.target.value})} 
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsHealthModalOpen(false)} className="flex-1 py-2 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={savingHealth} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {savingHealth ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}