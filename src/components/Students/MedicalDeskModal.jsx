import React, { useState, useEffect } from 'react';
import { gasApi } from '../../api/gasApi';
import Swal from 'sweetalert2';

// FIX 1: Safely strip the "data:image/..." prefix so Google Apps Script doesn't crash
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader(); 
  reader.readAsDataURL(file);
  reader.onload = () => {
    // Split the string and only send the raw base64 data to the backend
    const base64Data = reader.result.split(',')[1];
    resolve(base64Data);
  }; 
  reader.onerror = error => reject(error);
});

const extractId = (url) => {
  if (!url) return null;
  if (String(url).includes('id=')) return String(url).split('id=')[1].split('&')[0];
  if (String(url).includes('/d/')) return String(url).split('/d/')[1].split('/')[0];
  return url;
};

export default function MedicalDeskModal({ studentName, onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editForms, setEditForms] = useState({});
  const [files, setFiles] = useState({});
  
  const [showMarForm, setShowMarForm] = useState(null);
  
  // NEW: Dynamic list to hold MULTIPLE medicines at once!
  const defaultMedicine = { 
    medicineName: '', 
    type: 'Tablet', // Added type for better UX
    dose: '', 
    frequency: 'Twice Daily', 
    duration: '3', 
    instructions: '' 
  };
  
  const [marList, setMarList] = useState([{ ...defaultMedicine, startDate: new Date().toISOString().split('T')[0] }]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const allRecords = await gasApi('getMedicalRecords');
      const studentRecords = allRecords.filter(r => String(r['Student Name']).toLowerCase() === studentName.toLowerCase());
      setRecords(studentRecords);

      const initialForms = {};
      studentRecords.forEach(r => {
        if (r['Status'] === 'Active') {
          initialForms[r['Incident ID']] = {
            diagnosis: r['Diagnosis'] || '',
            status: r['Status'] || 'Active',
            notes: r['Notes'] || ''
          };
        }
      });
      setEditForms(initialForms);
    } catch (error) {
      Swal.fire('Error', 'Failed to load medical records.', 'error');
      onClose();
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [studentName]);

  const handleFormChange = (incidentId, field, value) => {
    setEditForms({ ...editForms, [incidentId]: { ...editForms[incidentId], [field]: value } });
  };

  const handleFileChange = (incidentId, type, file) => {
    setFiles({ ...files, [`${incidentId}_${type}`]: file });
  };

  // --- MULTI-MEDICINE HANDLERS ---
  const updateMarItem = (index, field, value) => {
    const updatedList = [...marList];
    updatedList[index][field] = value;
    setMarList(updatedList);
  };

  const addMarItem = () => {
    // Inherit the start date from the first item to save clicks
    const sharedStartDate = marList[0]?.startDate || new Date().toISOString().split('T')[0];
    setMarList([...marList, { ...defaultMedicine, startDate: sharedStartDate }]);
  };

  const removeMarItem = (index) => {
    const updatedList = marList.filter((_, i) => i !== index);
    setMarList(updatedList);
  };
  // -------------------------------

  const handleUpdateRecord = async (incidentId) => {
    setSavingId(incidentId);
    Swal.fire({ title: 'Saving...', text: 'Updating medical database & uploads.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const formData = editForms[incidentId];
      const payload = {
        incidentId, studentName,
        diagnosis: formData.diagnosis,
        status: formData.status,
        notes: formData.notes
      };

      if (files[`${incidentId}_prescription`]) payload.prescriptionPhoto = await fileToBase64(files[`${incidentId}_prescription`]);
      if (files[`${incidentId}_medicine`]) payload.medicinePhoto = await fileToBase64(files[`${incidentId}_medicine`]);

      await gasApi('updateMedicalRecord', payload);
      Swal.fire({ title: 'Success', text: 'Medical record updated.', icon: 'success', timer: 2000, showConfirmButton: false });
      
      if (formData.status === 'Recovered') onClose();
      else fetchRecords();
    } catch (error) {
      // FIX 2: Actually display the backend error message!
      Swal.fire('Upload Error', error.message || 'Failed to update record.', 'error');
    } finally { setSavingId(null); }
  };

  const handleAddPrescription = async (incidentId) => {
    if (isSubmitting) return; 
    
    // Validate all items
    if (marList.some(med => !med.medicineName || !med.dose)) {
      return Swal.fire('Missing Info', 'Please ensure all added medicines have a Name and Dose.', 'warning');
    }

    setIsSubmitting(true);
    Swal.fire({ 
      title: 'Generating Schedules...', 
      text: `Processing ${marList.length} medicine${marList.length > 1 ? 's' : ''}. Please wait...`, 
      allowOutsideClick: false, 
      didOpen: () => Swal.showLoading() 
    });
    
    try {
      // Loop sequentially so we don't overwhelm the Google Apps Script API limits
      for (let i = 0; i < marList.length; i++) {
        const med = marList[i];
        
        const startD = new Date(med.startDate);
        const endD = new Date(startD);
        endD.setDate(startD.getDate() + parseInt(med.duration) - 1);
        const endDateStr = endD.toISOString().split('T')[0];

        // Combine the Type and Name beautifully for the backend (e.g., "Paracetamol (Tablet)")
        const combinedName = `${med.medicineName} (${med.type})`;

        await gasApi('addPrescription', { 
          medicineName: combinedName,
          dose: med.dose,
          frequency: med.frequency,
          duration: med.duration,
          startDate: med.startDate,
          endDate: endDateStr, 
          instructions: med.instructions || "No special instructions", 
          incidentId, 
          studentName 
        });
      }
      
      Swal.fire({ title: 'MAR Generated!', text: `Successfully scheduled ${marList.length} medicines.`, icon: 'success' });
      setShowMarForm(null); 
      setMarList([{ ...defaultMedicine, startDate: new Date().toISOString().split('T')[0] }]); // Reset
    } catch (err) {
      Swal.fire('Error', err.message || 'Failed to generate MAR schedule.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center"><div className="bg-white p-6 rounded-2xl shadow-xl font-bold text-indigo-600"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Loading Medical Desk...</div></div>;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-50 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto relative border border-slate-200">
        
        <div className="bg-slate-900 p-5 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2"><i className="fa-solid fa-briefcase-medical text-indigo-400"></i> Medical Desk</h2>
            <p className="text-indigo-200 text-xs font-bold mt-1 tracking-wider uppercase">Patient: {studentName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-800 hover:bg-rose-500 text-slate-300 hover:text-white rounded-full flex items-center justify-center transition shadow-sm"><i className="fa-solid fa-xmark"></i></button>
        </div>

        <div className="p-4 md:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {records.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200"><i className="fa-solid fa-notes-medical text-4xl text-slate-300 mb-3"></i><p className="text-slate-500 font-bold">No medical history found for this student.</p></div>
          ) : (
            records.map((record, idx) => {
              const isActive = record['Status'] === 'Active';
              const rForm = editForms[record['Incident ID']];
              const pPhotoId = extractId(record['Prescription Photo']);
              const mPhotoId = extractId(record['Medicine Photo']);

              return (
                <div key={idx} className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all ${isActive ? 'border-indigo-400 shadow-indigo-100/50 shadow-lg' : 'border-slate-200 opacity-80'}`}>
                  
                  <div className={`p-4 flex justify-between items-start border-b ${isActive ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${isActive ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>{isActive ? 'Active Case' : 'Recovered'}</span>
                        <span className="text-[10px] font-bold text-slate-400">ID: {record['Incident ID']}</span>
                      </div>
                      <h3 className="font-black text-slate-800">{record['Incident Type']} reported by {record['Reported By']}</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-1"><i className="fa-regular fa-clock mr-1"></i> {formatDate(record['Timestamp'])}</p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"><i className="fa-solid fa-comment-medical mr-1"></i> Initial Symptoms / Reason</p>
                      <p className="text-sm font-bold text-slate-800">{record['Symptoms / Reason']}</p>
                      <div className="mt-2 text-xs font-semibold text-indigo-700 bg-indigo-50 inline-block px-2 py-1 rounded border border-indigo-100"><i className="fa-solid fa-truck-medical mr-1"></i> Hospital Action: {record['Hospital Visit Required'] || 'Not specified'}</div>
                    </div>

                    {isActive && rForm ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-indigo-900 mb-1 uppercase tracking-wider">Doctor's Diagnosis</label>
                            <input type="text" value={rForm.diagnosis} onChange={(e) => handleFormChange(record['Incident ID'], 'diagnosis', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="e.g., Viral Fever, Sprained Ankle" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-indigo-900 mb-1 uppercase tracking-wider">Update Status</label>
                            <select value={rForm.status} onChange={(e) => handleFormChange(record['Incident ID'], 'status', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold">
                              <option value="Active">Currently Active</option>
                              <option value="Recovered">Mark as Recovered (Closes Case)</option>
                            </select>
                          </div>
                        </div>

                        {/* ==================================================== */}
                        {/* MULTI-MEDICINE GENERATOR UI                          */}
                        {/* ==================================================== */}
                        <div className="bg-blue-50/50 border border-blue-200 rounded-2xl overflow-hidden">
                          <div className="flex justify-between items-center p-4 bg-blue-100/50 border-b border-blue-100">
                            <h4 className="font-black text-blue-900 text-sm"><i className="fa-solid fa-pills mr-1 text-blue-600"></i> Full Prescription Generator</h4>
                            <button onClick={() => setShowMarForm(showMarForm === record['Incident ID'] ? null : record['Incident ID'])} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm">
                              {showMarForm === record['Incident ID'] ? 'Cancel' : '+ Add Medications'}
                            </button>
                          </div>

                          {showMarForm === record['Incident ID'] && (
                            <div className="p-4 space-y-4 animate-fade-in bg-white">
                              {marList.map((med, index) => (
                                <div key={index} className="relative bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
                                  
                                  {marList.length > 1 && (
                                    <button onClick={() => removeMarItem(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow text-xs">
                                      <i className="fa-solid fa-xmark"></i>
                                    </button>
                                  )}

                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                    <div className="md:col-span-3">
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Type</label>
                                      <select value={med.type} onChange={e => updateMarItem(index, 'type', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500 bg-white">
                                        <option value="Tablet">💊 Tablet</option>
                                        <option value="Capsule">💊 Capsule</option>
                                        <option value="Syrup">🥄 Syrup</option>
                                        <option value="Drops">💧 Drops (Eye/Ear)</option>
                                        <option value="Cream/Ointment">🧴 Cream/Ointment</option>
                                        <option value="Powder">💨 Powder</option>
                                        <option value="Injection">💉 Injection</option>
                                        <option value="Other">Other</option>
                                      </select>
                                    </div>
                                    <div className="md:col-span-6">
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Medicine Name</label>
                                      <input type="text" value={med.medicineName} onChange={e => updateMarItem(index, 'medicineName', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500 bg-white" placeholder="e.g. Paracetamol 500mg" />
                                    </div>
                                    <div className="md:col-span-3">
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Dose</label>
                                      <input type="text" value={med.dose} onChange={e => updateMarItem(index, 'dose', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500 bg-white" placeholder="e.g. 1 Tab, 5ml, 2 Drops" />
                                    </div>
                                    
                                    <div className="md:col-span-4">
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Frequency</label>
                                      <select value={med.frequency} onChange={e => updateMarItem(index, 'frequency', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500 bg-white">
                                        <option value="Once Daily (Morning)">Once Daily (Morning)</option>
                                        <option value="Once Daily (Night)">Once Daily (Night)</option>
                                        <option value="Twice Daily">Twice Daily (Morning & Night)</option>
                                        <option value="Three Times Daily">Three Times Daily</option>
                                        <option value="Every 6 Hours">Every 6 Hours</option>
                                      </select>
                                    </div>
                                    <div className="md:col-span-4">
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Duration (Days)</label>
                                      <input type="number" min="1" value={med.duration} onChange={e => updateMarItem(index, 'duration', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500 bg-white" />
                                    </div>
                                    <div className="md:col-span-4">
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Start Date</label>
                                      <input type="date" value={med.startDate} onChange={e => updateMarItem(index, 'startDate', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500 bg-white" />
                                    </div>

                                    <div className="md:col-span-12">
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Special Instructions</label>
                                      <input type="text" value={med.instructions} onChange={e => updateMarItem(index, 'instructions', e.target.value)} className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500 bg-white" placeholder="e.g. Apply externally, after meals, right ear only..." />
                                    </div>
                                  </div>
                                </div>
                              ))}

                              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button onClick={addMarItem} className="flex-1 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-600 font-black py-2.5 rounded-xl transition text-sm">
                                  <i className="fa-solid fa-plus mr-1"></i> Add Another Medicine
                                </button>
                                <button 
                                  onClick={() => handleAddPrescription(record['Incident ID'])} 
                                  disabled={isSubmitting} 
                                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-black py-2.5 rounded-xl shadow transition text-sm"
                                >
                                  <i className="fa-solid fa-wand-magic-sparkles mr-1"></i> 
                                  {isSubmitting ? 'Generating...' : `Save ${marList.length} Medicine Schedule${marList.length > 1 ? 's' : ''}`}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* ==================================================== */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                          <div>
                            <label className="block text-[10px] font-bold text-indigo-900 mb-1"><i className="fa-solid fa-file-prescription mr-1"></i> Prescription Photo</label>
                            {pPhotoId && <a href={`https://drive.google.com/file/d/${pPhotoId}/view`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 font-bold block mb-1 underline"><i className="fa-solid fa-check"></i> View Uploaded</a>}
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(record['Incident ID'], 'prescription', e.target.files[0])} className="w-full text-xs bg-white rounded p-1.5 border border-slate-200" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-indigo-900 mb-1"><i className="fa-solid fa-pills mr-1"></i> Medicine Photo (Wrapper/Bottle)</label>
                            {mPhotoId && <a href={`https://drive.google.com/file/d/${mPhotoId}/view`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 font-bold block mb-1 underline"><i className="fa-solid fa-check"></i> View Uploaded</a>}
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(record['Incident ID'], 'medicine', e.target.files[0])} className="w-full text-xs bg-white rounded p-1.5 border border-slate-200" />
                          </div>
                        </div>

                        <button onClick={() => handleUpdateRecord(record['Incident ID'])} disabled={savingId === record['Incident ID']} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition flex items-center justify-center gap-2">
                          <i className="fa-solid fa-cloud-arrow-up"></i> Save General Medical Record
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100"><p className="text-[9px] font-bold text-slate-400 uppercase">Diagnosis</p><p className="text-sm font-bold text-slate-800">{record['Diagnosis'] || 'None recorded'}</p></div>
                        {(pPhotoId || mPhotoId) && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                            {pPhotoId && <a href={`https://drive.google.com/file/d/${pPhotoId}/view`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border border-slate-200 rounded shadow-sm text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"><i className="fa-solid fa-file-prescription"></i> Prescription</a>}
                            {mPhotoId && <a href={`https://drive.google.com/file/d/${mPhotoId}/view`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border border-slate-200 rounded shadow-sm text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"><i className="fa-solid fa-pills"></i> Medicine</a>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}