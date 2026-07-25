
import React, { useState, useEffect } from 'react';
import { gasApi } from '../../api/gasApi';
import Swal from 'sweetalert2'; // <-- Imported SweetAlert2

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader(); reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result); reader.onerror = error => reject(error);
});

const extractId = (url) => {
  if (!url) return null;
  if (String(url).includes('id=')) return String(url).split('id=')[1].split('&')[0];
  if (String(url).includes('/d/')) return String(url).split('/d/')[1].split('/')[0];
  return url;
};

export default function StudentProfileModal({ studentName, isNew = false, onClose }) {
  const [profile, setProfile] = useState(null);
  const [staffNames, setStaffNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState({ photoFile: null, udidFile: null, aadhaarFile: null, clothesFile: null, chappalFile: null });
  const [multiDocs, setMultiDocs] = useState([]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await gasApi('getStudentProfile', { studentName });
      setProfile(data.profile);
      setStaffNames(data.staffList || []);

      setFormData({
        name: data.profile['Name'] || (isNew ? '' : studentName), // Leave blank if new
        grNumber: data.profile['GR Number'] || '', className: data.profile['Class'] || '', 
        dob: data.profile['DOB'] ? data.profile['DOB'].split('T')[0] : '', mobile: data.profile['Mobile Number'] || '', 
        address: data.profile['Address'] || '', diagnosis: data.profile['Diagnosis Type'] || '', 
        toiletStatus: data.profile['Toilet Status'] || '', height: data.profile['Height'] || '', 
        weight: data.profile['Weight'] || '', iq: data.profile['IQ Score'] || '', 
        disabilityPercent: data.profile['Disability Percent'] || '', disabilityLevel: data.profile['Disability Level'] || '', 
        residentialStatus: data.profile['Residential Status'] || 'Residential', fits: data.profile['Fits'] || '', 
        medicine: data.profile['Medicine'] || '', habits: data.profile['Habits'] || '', 
        talents: data.profile['Talents'] || '', vitals: data.profile['Vitals'] || '', 
        broughtBy: data.profile['Brought By'] || '', aadharNum: data.profile['Aadhar Number'] || '', udidNum: data.profile['UDID'] || '',
        gender: data.profile['Gender'] || 'Male'
      });

      // If it's a new student, immediately skip to the editing form
      if (isNew) setIsEditing(true);

    } catch (error) { 
      Swal.fire('Error', 'Failed to load profile details.', 'error');
      onClose(); 
    } 
    finally { setLoading(false); }
  };

  useEffect(() => { loadProfile(); }, [studentName]);

  // PRO CONFIRMATION ALERTS FOR DOCUMENT DELETION
  const handleDeleteDoc = async (columnName) => {
    const result = await Swal.fire({
      title: 'Delete Document?',
      text: "Are you sure you want to remove this file? This cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    try {
      await gasApi('deleteStudentDocument', { studentName, columnName });
      Swal.fire('Deleted!', 'The document has been removed.', 'success');
      loadProfile(); 
    } catch(err) { 
      Swal.fire('Error', 'Error deleting document: ' + err.message, 'error');
    }
  };

  const handleMultiDocChange = (index, field, value) => {
    const newDocs = [...multiDocs];
    newDocs[index][field] = value;
    setMultiDocs(newDocs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNew && !formData.name) {
      return Swal.fire('Wait!', 'You must enter a Full Name to enroll a student.', 'warning');
    }

    setSaving(true);
    
    Swal.fire({
      title: isNew ? 'Enrolling...' : 'Uploading...',
      text: 'Please wait while we save the profile and upload documents.',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading() }
    });

    try {
      // NEW: Pass the isNew flag to the backend
      const payload = { 
        studentName: isNew ? formData.name : studentName, 
        formData, 
        isNew 
      };
      if (files.photoFile) payload.photoFile = await fileToBase64(files.photoFile);
      if (files.udidFile) payload.udidFile = await fileToBase64(files.udidFile);
      if (files.aadhaarFile) payload.aadhaarFile = await fileToBase64(files.aadhaarFile);
      if (files.clothesFile) payload.clothesFile = await fileToBase64(files.clothesFile);
      if (files.chappalFile) payload.chappalFile = await fileToBase64(files.chappalFile);

      let processedMultiDocs = [];
      for (let doc of multiDocs) {
        if (doc.name && doc.file) processedMultiDocs.push({ name: doc.name, fileBase64: await fileToBase64(doc.file) });
      }
      if (processedMultiDocs.length > 0) payload.multiDocsJson = JSON.stringify(processedMultiDocs);

      await gasApi('updateStudentProfile', payload);
      
      // Pro Success Message
      Swal.fire({
        title: 'Success!',
        text: 'Record updated successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      setIsEditing(false);
      setMultiDocs([]);
      onClose(); // Close and refresh parent
    } catch (error) { 
      Swal.fire('Failed!', 'Update failed: ' + error.message, 'error');
    } 
    finally { setSaving(false); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-GB');
  };

  if (loading) return <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center"><div className="bg-white p-6 rounded-2xl shadow-xl font-bold text-indigo-600"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Loading...</div></div>;

  const profileImgId = extractId(profile['Student Photo'] || profile['Photo']);
  const clothesImgId = extractId(profile['Clothes Photo'] || profile['Clothes']);
  const chappalImgId = extractId(profile['Chappal Photo'] || profile['Chappal']);
  const aadhaarId = extractId(profile['Aadhaar Doc URL'] || profile['Aadhaar URL']);
  const udidId = extractId(profile['UDID Doc URL'] || profile['UDID URL']);

  let extraDocsArray = [];
  try { if (profile['Extra Doc 3 URL']) extraDocsArray = JSON.parse(profile['Extra Doc 3 URL']); } catch(e) {}

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-50 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto relative border border-slate-200">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 bg-white hover:bg-rose-100 text-slate-500 rounded-full flex items-center justify-center transition shadow-sm"><i className="fa-solid fa-xmark"></i></button>

        <div className="p-6">
          {!isEditing ? (
            /* VIEW MODE */
            <div className="space-y-5">
              
              <div className="flex flex-col items-center pt-2 text-center pb-4 border-b border-slate-200">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-md bg-indigo-100 flex items-center justify-center text-indigo-400 text-3xl overflow-hidden mb-3 relative hover:opacity-80 transition cursor-pointer" title="Click to view full photo">
                  {profileImgId ? (
                    <a href={`https://drive.google.com/file/d/${profileImgId}/view`} target="_blank" rel="noreferrer" className="w-full h-full">
                      <img src={`https://drive.google.com/thumbnail?id=${profileImgId}&sz=w400`} className="w-full h-full object-cover" alt="Student Profile" />
                      <div className="absolute bottom-1 right-1 bg-black/50 text-white rounded-full p-1 text-[10px]"><i className="fa-solid fa-expand"></i></div>
                    </a>
                  ) : <i className="fa-solid fa-user"></i>}
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{profile['Name'] || studentName}</h2>
                <div className="mt-1 mb-2">
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                    <i className="fa-solid fa-chalkboard mr-1"></i> Class: {profile['Class'] || '-'} | GR: {profile['GR Number'] || '-'}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2"><i className="fa-regular fa-address-card mr-1"></i> Basic Details</h4>
                <div className="grid grid-cols-3 gap-4 text-center divide-x divide-slate-100 mb-3">
                   <div><p className="text-[10px] text-slate-500 mb-1"><i className="fa-solid fa-calendar-days text-indigo-400"></i> DOB</p><p className="font-bold text-slate-800 text-sm">{formatDate(profile['DOB'])}</p></div>
                   <div><p className="text-[10px] text-slate-500 mb-1"><i className="fa-solid fa-venus-mars text-indigo-400"></i> Gender</p><p className="font-bold text-slate-800 text-sm">{profile['Gender'] || '-'}</p></div>
                   <div><p className="text-[10px] text-slate-500 mb-1"><i className="fa-solid fa-phone text-indigo-400"></i> Mobile</p><p className="font-bold text-slate-800 text-sm">{profile['Mobile Number'] || '-'}</p></div>
                </div>
                <div className="pt-2 border-t border-slate-100 bg-slate-50 p-2 rounded-lg text-center md:text-left">
                   <p className="text-[10px] text-slate-500 mb-1"><i className="fa-solid fa-house-chimney text-indigo-400"></i> Home Address</p>
                   <p className="font-bold text-slate-800 text-sm">{profile['Address'] || 'Not Provided'}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2"><i className="fa-solid fa-stethoscope mr-1"></i> Medical & Physical Metrics</h4>
                <div className="grid grid-cols-3 gap-4 text-center divide-x divide-slate-100 mb-3">
                   <div><p className="text-[10px] text-slate-500 mb-1"><i className="fa-solid fa-notes-medical text-purple-500"></i> Diagnosis</p><p className="font-bold text-purple-700 text-sm">{profile['Diagnosis Type'] || '-'}</p></div>
                   <div><p className="text-[10px] text-slate-500 mb-1"><i className="fa-solid fa-layer-group text-purple-500"></i> Level</p><p className="font-bold text-indigo-700 text-sm">{profile['Disability Level'] || '-'}</p></div>
                   <div><p className="text-[10px] text-slate-500 mb-1"><i className="fa-solid fa-restroom text-purple-500"></i> Toilet Status</p><p className={`font-bold text-sm ${profile['Toilet Status'] === 'Trained' ? 'text-emerald-600' : 'text-rose-500'}`}>{profile['Toilet Status'] || '-'}</p></div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center divide-x divide-slate-100 pt-3 border-t border-slate-100">
                   <div><p className="text-[10px] text-slate-500 mb-1"><i className="fa-solid fa-ruler-vertical text-blue-400"></i> Height</p><p className="font-bold text-slate-800 text-sm">{profile['Height'] ? `${profile['Height']}cm` : '-'}</p></div>
                   <div><p className="text-[10px] text-slate-500 mb-1"><i className="fa-solid fa-weight-scale text-blue-400"></i> Weight</p><p className="font-bold text-slate-800 text-sm">{profile['Weight'] ? `${profile['Weight']}kg` : '-'}</p></div>
                   <div><p className="text-[10px] text-slate-500 mb-1"><i className="fa-solid fa-brain text-blue-400"></i> IQ Score</p><p className="font-bold text-slate-800 text-sm">{profile['IQ Score'] || '-'}</p></div>
                   <div><p className="text-[10px] text-slate-500 mb-1"><i className="fa-solid fa-wheelchair text-blue-400"></i> Disability %</p><p className="font-bold text-rose-600 text-sm">{profile['Disability Percent'] ? `${profile['Disability Percent']}%` : '-'}</p></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2"><i className="fa-solid fa-id-card-clip mr-1"></i> Identification & Vitals</h4>
                <div className="grid grid-cols-3 gap-4 text-center divide-x divide-slate-100">
                   <div><p className="text-[10px] text-slate-500 mb-1"><i className="fa-solid fa-fingerprint text-slate-400"></i> Aadhar Num</p><p className="font-bold text-slate-800 text-sm">{profile['Aadhar Number'] || '-'}</p></div>
                   <div><p className="text-[10px] text-slate-500 mb-1"><i className="fa-regular fa-id-card text-slate-400"></i> UDID Num</p><p className="font-bold text-slate-800 text-sm">{profile['UDID'] || '-'}</p></div>
                   <div><p className="text-[10px] text-slate-500 mb-1"><i className="fa-solid fa-heart-pulse text-rose-400"></i> Other Vitals</p><p className="font-bold text-slate-800 text-sm">{profile['Vitals'] || '-'}</p></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#fffdf2] rounded-xl p-4 border border-[#fde68a] shadow-sm"><p className="text-xs font-black text-amber-600 mb-2 uppercase tracking-wider flex items-center gap-2"><i className="fa-solid fa-triangle-exclamation text-lg"></i> Fits / Seizures</p><p className="text-sm font-bold text-slate-800">{profile['Fits'] || 'None'}</p></div>
                <div className="bg-[#f0f9ff] rounded-xl p-4 border border-[#bae6fd] shadow-sm"><p className="text-xs font-black text-blue-600 mb-2 uppercase tracking-wider flex items-center gap-2"><i className="fa-solid fa-pills text-lg"></i> Medicine Log</p><p className="text-sm font-bold text-slate-800 whitespace-pre-line">{profile['Medicine'] || 'None'}</p></div>
                <div className="bg-[#fff1f2] rounded-xl p-4 border border-[#fecdd3] shadow-sm"><p className="text-xs font-black text-rose-600 mb-2 uppercase tracking-wider flex items-center gap-2"><i className="fa-solid fa-tags text-lg"></i> Behavior Habits</p><p className="text-sm font-bold text-slate-800">{profile['Habits'] || 'None'}</p></div>
                <div className="bg-[#fdf4ff] rounded-xl p-4 border border-[#e879f9] shadow-sm"><p className="text-xs font-black text-fuchsia-600 mb-2 uppercase tracking-wider flex items-center gap-2"><i className="fa-solid fa-star text-lg"></i> Special Talents</p><p className="text-sm font-bold text-slate-800">{profile['Talents'] || 'None'}</p></div>
              </div>

              {(clothesImgId || chappalImgId || extraDocsArray.length > 0 || aadhaarId || udidId) && (
                <div className="bg-indigo-50 rounded-2xl shadow-sm border border-indigo-100 p-5 mt-6">
                  <h4 className="text-sm font-black text-indigo-800 uppercase tracking-wider mb-3 flex items-center gap-2"><i className="fa-solid fa-folder-open text-xl"></i> Uploaded Documents</h4>
                  <p className="text-[10px] text-indigo-600 mb-4 font-bold">Click any button below to view the document in a new window.</p>
                  <div className="flex flex-wrap gap-3">
                    {clothesImgId && <a href={`https://drive.google.com/file/d/${clothesImgId}/view`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold bg-white border border-indigo-200 px-4 py-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition text-indigo-700 shadow-sm"><i className="fa-solid fa-shirt text-lg"></i> Clothes</a>}
                    {chappalImgId && <a href={`https://drive.google.com/file/d/${chappalImgId}/view`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold bg-white border border-indigo-200 px-4 py-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition text-indigo-700 shadow-sm"><i className="fa-solid fa-shoe-prints text-lg"></i> Chappals</a>}
                    {aadhaarId && <a href={`https://drive.google.com/file/d/${aadhaarId}/view`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold bg-white border border-blue-200 px-4 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition text-blue-700 shadow-sm"><i className="fa-solid fa-fingerprint text-lg"></i> Aadhaar</a>}
                    {udidId && <a href={`https://drive.google.com/file/d/${udidId}/view`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold bg-white border border-rose-200 px-4 py-2.5 rounded-xl hover:bg-rose-600 hover:text-white transition text-rose-700 shadow-sm"><i className="fa-solid fa-id-card text-lg"></i> UDID</a>}
                    {extraDocsArray.map((doc, idx) => (
                      <a key={idx} href={`https://drive.google.com/file/d/${extractId(doc.url)}/view`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold bg-white border border-emerald-200 px-4 py-2.5 rounded-xl hover:bg-emerald-600 hover:text-white transition text-emerald-700 shadow-sm"><i className="fa-solid fa-file-pdf text-lg"></i> {doc.name}</a>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <button onClick={() => setIsEditing(true)} className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl transition shadow-lg flex justify-center items-center gap-2 text-lg"><i className="fa-solid fa-pen-to-square"></i> Edit Profile & Manage Documents</button>
              </div>
            </div>
          ) : (

            /* EDIT MODE */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-lg font-black text-slate-800"><i className="fa-solid fa-pen-to-square text-indigo-500 mr-2"></i>Edit Profile</h3>
                <button type="button" onClick={() => setIsEditing(false)} className="text-slate-500 bg-slate-100 px-3 py-1 rounded-lg hover:bg-slate-200 font-bold text-sm transition">Cancel</button>
              </div>

              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-3"><i className="fa-solid fa-folder-open mr-1"></i> Manage Documents & Photos</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-2 rounded border border-indigo-50">
                    <label className="block text-[10px] font-bold text-indigo-900 mb-1"><i className="fa-solid fa-camera mr-1"></i> Profile Photo</label>
                    {profileImgId && <p className="text-[10px] mb-1 text-emerald-600 font-bold"><i className="fa-solid fa-check"></i> Uploaded <span onClick={()=>handleDeleteDoc("Student Photo")} className="ml-2 text-rose-500 cursor-pointer underline">Delete</span></p>}
                    <input type="file" accept="image/*" onChange={e => setFiles({...files, photoFile: e.target.files[0]})} className="w-full text-[10px] bg-slate-50 rounded p-1" />
                  </div>
                  <div className="bg-white p-2 rounded border border-indigo-50">
                    <label className="block text-[10px] font-bold text-indigo-900 mb-1"><i className="fa-solid fa-fingerprint mr-1"></i> Aadhaar PDF/Img</label>
                    {aadhaarId && <p className="text-[10px] mb-1 text-emerald-600 font-bold"><i className="fa-solid fa-check"></i> Uploaded <span onClick={()=>handleDeleteDoc("Aadhaar Doc URL")} className="ml-2 text-rose-500 cursor-pointer underline">Delete</span></p>}
                    <input type="file" accept="image/*,application/pdf" onChange={e => setFiles({...files, aadhaarFile: e.target.files[0]})} className="w-full text-[10px] bg-slate-50 rounded p-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-2 rounded border border-indigo-50">
                    <label className="block text-[10px] font-bold text-indigo-900 mb-1"><i className="fa-solid fa-shirt mr-1"></i> Clothes Photo</label>
                    {clothesImgId && <p className="text-[10px] mb-1 text-emerald-600 font-bold"><i className="fa-solid fa-check"></i> Uploaded <span onClick={()=>handleDeleteDoc("Clothes Photo")} className="ml-2 text-rose-500 cursor-pointer underline">Delete</span></p>}
                    <input type="file" accept="image/*" onChange={e => setFiles({...files, clothesFile: e.target.files[0]})} className="w-full text-[10px] bg-slate-50 rounded p-1" />
                  </div>
                  <div className="bg-white p-2 rounded border border-indigo-50">
                    <label className="block text-[10px] font-bold text-indigo-900 mb-1"><i className="fa-solid fa-shoe-prints mr-1"></i> Chappal Photo</label>
                    {chappalImgId && <p className="text-[10px] mb-1 text-emerald-600 font-bold"><i className="fa-solid fa-check"></i> Uploaded <span onClick={()=>handleDeleteDoc("Chappal Photo")} className="ml-2 text-rose-500 cursor-pointer underline">Delete</span></p>}
                    <input type="file" accept="image/*" onChange={e => setFiles({...files, chappalFile: e.target.files[0]})} className="w-full text-[10px] bg-slate-50 rounded p-1" />
                  </div>
                </div>

                <div className="mt-4 border-t border-indigo-200 pt-3">
                  <p className="text-xs font-bold text-indigo-900 mb-2"><i className="fa-solid fa-file-circle-plus mr-1"></i> Additional Documents</p>
                  {extraDocsArray.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {extraDocsArray.map((doc, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] bg-white p-2 rounded border border-slate-100">
                          <span className="font-bold text-slate-700"><i className="fa-solid fa-file text-emerald-500 mr-1"></i> {doc.name}</span>
                          <span onClick={()=>handleDeleteDoc("Extra Doc 3 URL")} className="text-rose-500 font-bold cursor-pointer hover:underline">Clear All Docs</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {multiDocs.map((doc, idx) => (
                    <div key={idx} className="flex gap-2 items-center mb-2 bg-white p-2 rounded border border-slate-100">
                      <input type="text" placeholder="Doc Name (e.g. Caste Cert)" value={doc.name} onChange={e => handleMultiDocChange(idx, 'name', e.target.value)} className="w-1/3 p-1.5 border border-slate-300 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                      <input type="file" onChange={e => handleMultiDocChange(idx, 'file', e.target.files[0])} className="w-1/3 text-xs bg-slate-50 rounded p-1" />
                      <button type="button" onClick={() => setMultiDocs(multiDocs.filter((_, i) => i !== idx))} className="text-rose-500 bg-rose-50 px-2 py-1.5 rounded font-bold text-xs hover:bg-rose-500 hover:text-white transition"><i className="fa-solid fa-trash"></i></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setMultiDocs([...multiDocs, { name: '', file: null }])} className="text-[10px] font-bold text-white bg-indigo-500 px-3 py-1.5 rounded shadow-sm hover:bg-indigo-600 transition"><i className="fa-solid fa-plus mr-1"></i> Add Another Document</button>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Full Name</label><input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">GR Number</label><input type="text" value={formData.grNumber} onChange={e=>setFormData({...formData, grNumber: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Class</label><select value={formData.className} onChange={e=>setFormData({...formData, className: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none bg-slate-50 focus:ring-1 focus:ring-indigo-500"><option value="">Select Class...</option><option value="Play-Group">Play-Group</option><option value="Pre-Primary">Pre-Primary</option><option value="Primary">Primary</option><option value="Primary -I">Primary -I</option><option value="Primary -II">Primary -II</option><option value="Secondary">Secondary</option><option value="Secondary -I">Secondary -I</option><option value="Secondary -II">Secondary -II</option><option value="Pre-Vocational">Pre-Vocational</option><option value="Pre-Vocational -I">Pre-Vocational -I</option></select></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Brought By</label><select value={formData.broughtBy} onChange={e=>setFormData({...formData, broughtBy: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none bg-slate-50 focus:ring-1 focus:ring-indigo-500"><option value="">Select Staff...</option>{staffNames.map((name, i) => <option key={i} value={name}>{name}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">DOB</label><input type="date" value={formData.dob} onChange={e=>setFormData({...formData, dob: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Gender</label><select value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none bg-slate-50 focus:ring-1 focus:ring-indigo-500"><option value="Male">Male</option><option value="Female">Female</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Mobile Number</label><input type="text" value={formData.mobile} onChange={e=>setFormData({...formData, mobile: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Residential Status</label><select value={formData.residentialStatus} onChange={e=>setFormData({...formData, residentialStatus: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none bg-slate-50 focus:ring-1 focus:ring-indigo-500"><option value="Residential">Residential</option><option value="Day Scholar">Day Scholar</option></select></div>
                </div>
                <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Address</label><input type="text" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                
                <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Diagnosis</label><select value={formData.diagnosis} onChange={e=>setFormData({...formData, diagnosis: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none bg-slate-50 focus:ring-1 focus:ring-indigo-500"><option value="ID">ID</option><option value="CP">CP</option><option value="ASD">ASD</option><option value="Down Syndrome">Down Syndrome</option><option value="ADHD">ADHD</option><option value="Other">Other</option></select></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Disability Level</label><input type="text" value={formData.disabilityLevel} onChange={e=>setFormData({...formData, disabilityLevel: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Toilet Status</label><select value={formData.toiletStatus} onChange={e=>setFormData({...formData, toiletStatus: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none bg-slate-50 focus:ring-1 focus:ring-indigo-500"><option value="Trained">Trained</option><option value="Not Trained">Not Trained</option></select></div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Height (cm)</label><input type="text" value={formData.height} onChange={e=>setFormData({...formData, height: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Weight (kg)</label><input type="text" value={formData.weight} onChange={e=>setFormData({...formData, weight: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">IQ Score</label><input type="text" value={formData.iq} onChange={e=>setFormData({...formData, iq: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Disability %</label><input type="text" value={formData.disabilityPercent} onChange={e=>setFormData({...formData, disabilityPercent: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Aadhar Num</label><input type="text" value={formData.aadharNum} onChange={e=>setFormData({...formData, aadharNum: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">UDID Num</label><input type="text" value={formData.udidNum} onChange={e=>setFormData({...formData, udidNum: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Other Vitals</label><input type="text" value={formData.vitals} onChange={e=>setFormData({...formData, vitals: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Fits/Seizures</label><input type="text" value={formData.fits} onChange={e=>setFormData({...formData, fits: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Medicine Log</label><textarea value={formData.medicine} onChange={e=>setFormData({...formData, medicine: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" rows="1"></textarea></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Behavior Habits</label><input type="text" value={formData.habits} onChange={e=>setFormData({...formData, habits: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Special Talents</label><input type="text" value={formData.talents} onChange={e=>setFormData({...formData, talents: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50" /></div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition text-lg">Cancel</button>
                <button type="submit" disabled={saving} className="flex-2 w-2/3 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg disabled:opacity-50 text-lg">
                  <i className="fa-solid fa-cloud-arrow-up mr-2"></i> Save Record & Uploads
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}