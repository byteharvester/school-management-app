// src/components/modals/StudentModal.jsx
import { useEffect, useState } from 'react';
import { saveStudentProfile, deleteDocument, getStaffData } from '../../api/endpoints';
import { cleanId } from '../../utils/helpers';

export default function StudentModal({ 
  isOpen, 
  onClose, 
  student,          // existing student data (for edit) or null (for new)
  onSaved,          // callback to refresh the student list
  canEdit           // boolean
}) {
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);

  // Form state
  const [form, setForm] = useState({
    rowNum: '',
    GRNumber: '',
    Name: '',
    Gender: 'Male',
    Class: 'Play-Group',
    DOB: '',
    Mobile: '',
    Address: '',
    Aadhar: '',
    UDID: '',
    Type: 'ID',
    'Toilet Status': 'Not Trained',
    Vitals: '',
    Habits: '',
    Fits: '',
    Medicine: '',
    Talents: '',
    Height: '',
    Weight: '',
    'IQ Score': '',
    'Disability Percent': '',
    'Disability Level': '',
    'Residential Status': 'Residential',
    'Brought By': '',
  });

  // File inputs
  const [files, setFiles] = useState({
    student: null,
    clothes: null,
    chappal: null,
    aadhaar: null,
    udid: null,
    multiDoc: null,
  });

  // Existing document URLs (for display & deletion)
  const [existingDocs, setExistingDocs] = useState({
    Profile: '',
    Clothes: '',
    Chappal: '',
    Aadhaar: '',
    UDID: '',
    MultiDocs: [], // array of { name, url }
  });

  // Multi-doc field (additional documents)
  const [multiDocFields, setMultiDocFields] = useState([]); // each: { name: '', desc: '', file: null }

  // Load staff list for "Brought By" dropdown
  useEffect(() => {
    if (isOpen) {
      getStaffData()
        .then((data) => {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          setStaffList(parsed);
        })
        .catch(() => setStaffList([]));
    }
  }, [isOpen]);

  // When editing, populate form and existing docs
  useEffect(() => {
    if (student) {
      setForm({
        rowNum: student.rowNum || '',
        GRNumber: student['GR Number'] || '',
        Name: student.Name || '',
        Gender: student.Gender || 'Male',
        Class: student.Class || 'Play-Group',
        DOB: student.DOB ? new Date(student.DOB).toISOString().split('T')[0] : '',
        Mobile: student['Mobile Number'] || '',
        Address: student.Address || '',
        Aadhar: student['Aadhar Number'] || student.Aadhar || '',
        UDID: student.UDID || '',
        Type: student['Diagnosis Type'] || student.Type || 'ID',
        'Toilet Status': student['Toilet Status'] || 'Not Trained',
        Vitals: student.Vitals || '',
        Habits: student.Habits || '',
        Fits: student.Fits || '',
        Medicine: student.Medicine || '',
        Talents: student.Talents || '',
        Height: student.Height || '',
        Weight: student.Weight || '',
        'IQ Score': student['IQ Score'] || '',
        'Disability Percent': student['Disability Percent'] || '',
        'Disability Level': student['Disability Level'] || '',
        'Residential Status': student['Residential Status'] || 'Residential',
        'Brought By': student['Brought By'] || '',
      });

      // Set existing doc URLs
      setExistingDocs({
        Profile: student['Student Photo'] || student.Photo || '',
        Clothes: student['Clothes Photo'] || student.Clothes || '',
        Chappal: student['Chappal Photo'] || student.Chappal || '',
        Aadhaar: student['Aadhaar Doc URL'] || student['Aadhaar URL'] || '',
        UDID: student['UDID Doc URL'] || student['UDID URL'] || '',
        MultiDocs: student['Extra Doc 3 URL'] ? JSON.parse(student['Extra Doc 3 URL']) : [],
      });
    } else {
      // Reset form for new student
      setForm({
        rowNum: '',
        GRNumber: '',
        Name: '',
        Gender: 'Male',
        Class: 'Play-Group',
        DOB: '',
        Mobile: '',
        Address: '',
        Aadhar: '',
        UDID: '',
        Type: 'ID',
        'Toilet Status': 'Not Trained',
        Vitals: '',
        Habits: '',
        Fits: '',
        Medicine: '',
        Talents: '',
        Height: '',
        Weight: '',
        'IQ Score': '',
        'Disability Percent': '',
        'Disability Level': '',
        'Residential Status': 'Residential',
        'Brought By': '',
      });
      setExistingDocs({ Profile: '', Clothes: '', Chappal: '', Aadhaar: '', UDID: '', MultiDocs: [] });
      setFiles({ student: null, clothes: null, chappal: null, aadhaar: null, udid: null, multiDoc: null });
      setMultiDocFields([]);
    }
  }, [student, isOpen]);

  // Close modal if not open
  if (!isOpen) return null;

  // ------ Form Handlers ------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    setFiles(prev => ({ ...prev, [key]: file }));
    // Reset the file input label (we can't reset easily, but we can show filename)
    // Optionally we can update a label using a ref, but for simplicity we'll display filename in UI.
  };

  const addMultiDocField = () => {
    setMultiDocFields(prev => [...prev, { name: '', desc: '', file: null }]);
  };

  const removeMultiDocField = (index) => {
    setMultiDocFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleMultiDocChange = (index, field, value) => {
    setMultiDocFields(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleMultiDocFileChange = (index, file) => {
    setMultiDocFields(prev => prev.map((item, i) => 
      i === index ? { ...item, file } : item
    ));
  };

  // ------ Delete existing document ------
  const handleDeleteDoc = (col, url, multiIndex = -1) => {
    if (!window.confirm('Delete this document permanently?')) return;
    const rowNum = form.rowNum;
    if (!rowNum) return;
    deleteDocument(rowNum, col, url)
      .then(() => {
        if (col === 'MultiDoc' && multiIndex >= 0) {
          setExistingDocs(prev => ({
            ...prev,
            MultiDocs: prev.MultiDocs.filter((_, i) => i !== multiIndex)
          }));
        } else {
          setExistingDocs(prev => ({ ...prev, [col]: '' }));
        }
        // Optionally refresh student list (call onSaved)
      })
      .catch(err => alert('Error deleting: ' + err));
  };

  // ------ Submit Handler ------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Helper to read file as base64
    const readFileAsBase64 = (file) => {
      return new Promise((resolve) => {
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          // Compress image if needed (optional – we'll keep original for now)
          resolve(reader.result);
        };
      });
    };

    try {
      const [
        photoBase64,
        clothesBase64,
        chappalBase64,
        aadhaarBase64,
        udidBase64,
        multiDocBase64,
      ] = await Promise.all([
        readFileAsBase64(files.student),
        readFileAsBase64(files.clothes),
        readFileAsBase64(files.chappal),
        readFileAsBase64(files.aadhaar),
        readFileAsBase64(files.udid),
        readFileAsBase64(files.multiDoc),
      ]);

      // Additional multi-docs: we need to upload them separately. For simplicity, we'll handle them in the backend.
      // In the original code, they were sent as an array of objects with file data.
      // We'll gather them:
      const extraDocs = [];
      for (let i = 0; i < multiDocFields.length; i++) {
        const field = multiDocFields[i];
        if (field.name && field.file) {
          const fileData = await readFileAsBase64(field.file);
          extraDocs.push({
            name: field.name,
            type: 'Other',
            description: field.desc || '',
            file: fileData,
          });
        }
      }

      // Submit
      await saveStudentProfile(
        form,                       // formData object
        photoBase64,
        clothesBase64,
        chappalBase64,
        aadhaarBase64,
        udidBase64,
        multiDocBase64,             // This is for the main multi-doc file (single)
        extraDocs                   // Additional multi-docs (array)
      );

      alert('Student saved successfully!');
      onSaved(); // Refresh the student list
      onClose();
    } catch (err) {
      alert('Error saving: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ------ Render ------
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            <i className="fa-solid fa-pen-to-square text-indigo-500"></i> 
            {student ? 'Edit Student' : 'Add Student'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden rowNum */}
          <input type="hidden" name="rowNum" value={form.rowNum} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600">GR Number</label>
              <input name="GRNumber" value={form.GRNumber} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600">Full Name</label>
              <input name="Name" value={form.Name} onChange={handleInputChange} required className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600">Gender</label>
              <select name="Gender" value={form.Gender} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option>Male</option><option>Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600">Class</label>
              <select name="Class" value={form.Class} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option>Play-Group</option><option>Pre-Primary</option><option>Primary</option>
                <option>Primary -I</option><option>Primary -II</option><option>Secondary</option>
                <option>Secondary -I</option><option>Secondary -II</option><option>Pre-Vocational</option>
                <option>Pre-Vocational -I</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600">Date of Birth</label>
              <input type="date" name="DOB" value={form.DOB} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600">Mobile Number</label>
              <input type="tel" name="Mobile" value={form.Mobile} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600">Address</label>
            <input name="Address" value={form.Address} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600">Aadhar Number</label>
              <input name="Aadhar" value={form.Aadhar} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600">UDID Number</label>
              <input name="UDID" value={form.UDID} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600">Diagnosis Type</label>
              <select name="Type" value={form.Type} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option>ID</option><option>CP</option><option>ASD</option>
                <option>Down Syndrome</option><option>ADHD</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600">Toilet Status</label>
              <select name="Toilet Status" value={form['Toilet Status']} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option>Trained</option><option>Not Trained</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600">Height (cm)</label>
              <input type="number" step="0.1" name="Height" value={form.Height} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600">Weight (kg)</label>
              <input type="number" step="0.1" name="Weight" value={form.Weight} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600">IQ Score</label>
              <input name="IQ Score" value={form['IQ Score']} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600">Disability %</label>
              <input type="number" name="Disability Percent" value={form['Disability Percent']} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600">Disability Level</label>
            <input name="Disability Level" value={form['Disability Level']} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600">Residential Status</label>
            <select name="Residential Status" value={form['Residential Status']} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>Residential</option><option>Day Scholar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600">Brought By (Staff)</label>
            <select name="Brought By" value={form['Brought By']} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">Select Staff Member...</option>
              {staffList.map((staff) => (
                <option key={staff.email} value={staff.name}>{staff.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600">Vitals</label>
            <input name="Vitals" value={form.Vitals} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600">Habits (comma separated)</label>
            <input name="Habits" value={form.Habits} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600">Fits/Seizures</label>
            <input name="Fits" value={form.Fits} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600">Medicine Log</label>
            <textarea name="Medicine" value={form.Medicine} onChange={handleInputChange} rows="2" className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600">Special Talents</label>
            <input name="Talents" value={form.Talents} onChange={handleInputChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          {/* Documents & Photos */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-bold text-indigo-600 mb-3">Documents & Photos</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600">Student Photo</label>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'student')} className="w-full text-xs" />
                {existingDocs.Profile && (
                  <div className="mt-1">
                    <a href={`https://drive.google.com/file/d/${cleanId(existingDocs.Profile)}/view`} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline">View existing</a>
                    <button type="button" onClick={() => handleDeleteDoc('Profile', existingDocs.Profile)} className="text-rose-500 text-[10px] ml-2">Delete</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600">Clothes Photo</label>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'clothes')} className="w-full text-xs" />
                {existingDocs.Clothes && (
                  <div className="mt-1">
                    <a href={`https://drive.google.com/file/d/${cleanId(existingDocs.Clothes)}/view`} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline">View existing</a>
                    <button type="button" onClick={() => handleDeleteDoc('Clothes', existingDocs.Clothes)} className="text-rose-500 text-[10px] ml-2">Delete</button>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-600">Chappal Photo</label>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'chappal')} className="w-full text-xs" />
                {existingDocs.Chappal && (
                  <div className="mt-1">
                    <a href={`https://drive.google.com/file/d/${cleanId(existingDocs.Chappal)}/view`} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline">View existing</a>
                    <button type="button" onClick={() => handleDeleteDoc('Chappal', existingDocs.Chappal)} className="text-rose-500 text-[10px] ml-2">Delete</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600">Aadhaar Doc</label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'aadhaar')} className="w-full text-xs" />
                {existingDocs.Aadhaar && (
                  <div className="mt-1">
                    <a href={`https://drive.google.com/file/d/${cleanId(existingDocs.Aadhaar)}/view`} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline">View existing</a>
                    <button type="button" onClick={() => handleDeleteDoc('Aadhaar', existingDocs.Aadhaar)} className="text-rose-500 text-[10px] ml-2">Delete</button>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-600">UDID Doc</label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'udid')} className="w-full text-xs" />
                {existingDocs.UDID && (
                  <div className="mt-1">
                    <a href={`https://drive.google.com/file/d/${cleanId(existingDocs.UDID)}/view`} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline">View existing</a>
                    <button type="button" onClick={() => handleDeleteDoc('UDID', existingDocs.UDID)} className="text-rose-500 text-[10px] ml-2">Delete</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600">Other Doc (Single)</label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'multiDoc')} className="w-full text-xs" />
                {/* Existing multi-docs (list) */}
                {existingDocs.MultiDocs.map((doc, idx) => (
                  <div key={idx} className="mt-1 flex items-center justify-between bg-slate-50 p-1 rounded">
                    <a href={`https://drive.google.com/file/d/${cleanId(doc.url)}/view`} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline">{doc.name}</a>
                    <button type="button" onClick={() => handleDeleteDoc('MultiDoc', doc.url, idx)} className="text-rose-500 text-[10px]">Delete</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional multi-doc fields (dynamic) */}
            <div className="mt-3">
              <p className="text-xs font-bold text-slate-600 mb-1">Additional Documents</p>
              {multiDocFields.map((field, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-2">
                  <input
                    type="text"
                    placeholder="Doc Name"
                    value={field.name}
                    onChange={(e) => handleMultiDocChange(idx, 'name', e.target.value)}
                    className="flex-1 p-1 border border-slate-300 rounded text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={field.desc}
                    onChange={(e) => handleMultiDocChange(idx, 'desc', e.target.value)}
                    className="flex-1 p-1 border border-slate-300 rounded text-xs"
                  />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleMultiDocFileChange(idx, e.target.files[0])}
                    className="flex-1 text-xs"
                  />
                  <button type="button" onClick={() => removeMultiDocField(idx)} className="text-rose-500">✕</button>
                </div>
              ))}
              <button type="button" onClick={addMultiDocField} className="text-xs text-indigo-600 font-bold hover:text-indigo-800">
                <i className="fa-solid fa-plus"></i> Add Another Document
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
              {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}