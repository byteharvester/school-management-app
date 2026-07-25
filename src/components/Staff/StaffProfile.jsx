import React, { useState, useEffect } from 'react';
import { gasApi } from '../../api/gasApi';

// Helper utility to convert a file to a Base64 string
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

export default function StaffProfile({ email }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ phone: '', address: '', bloodGroup: '' });
  const [files, setFiles] = useState({ photoFile: null, aadhaarFile: null, panFile: null });

  // Outdoor Duty State
  const [isOutdoorModalOpen, setIsOutdoorModalOpen] = useState(false);
  const [outdoorNote, setOutdoorNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await gasApi('getStaffProfile', { email });
      setProfile(data);
      setFormData({
        phone: data.Phone || '',
        address: data.Address || '',
        bloodGroup: data.Blood_Group || ''
      });
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [email]);

  const handleFileChange = (e, fileType) => {
    setFiles({ ...files, [fileType]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Convert attached files to base64 strings
      const photoBase64 = files.photoFile ? await fileToBase64(files.photoFile) : null;
      const aadhaarBase64 = files.aadhaarFile ? await fileToBase64(files.aadhaarFile) : null;
      const panBase64 = files.panFile ? await fileToBase64(files.panFile) : null;

      await gasApi('updateStaffProfile', {
        email: email,
        formData: formData,
        photoFile: photoBase64,
        aadhaarFile: aadhaarBase64,
        panFile: panBase64
      });

      alert("Profile and documents saved successfully!");
      setIsEditing(false);
      loadProfile(); // Refresh data
    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOutdoorDutySubmit = async () => {
    setUpdatingStatus(true);
    try {
      await gasApi('updateStaffStatus', {
        email: email,
        newStatus: 'Outdoor Duty',
        statusNote: outdoorNote
      });
      alert("Status updated to Outdoor Duty");
      setIsOutdoorModalOpen(false);
      setOutdoorNote('');
      loadProfile(); // Refresh to show new status
    } catch (error) {
      alert("Failed to update status: " + error.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading || !profile) return <div className="p-6 text-center text-slate-500 font-bold">Loading Profile...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-slate-800 text-white px-5 py-4 flex justify-between items-center shadow-md">
          <h3 className="font-bold text-sm flex items-center tracking-wide">
            <i className="fa-solid fa-user-tie mr-2 text-indigo-400 text-lg"></i>
            <span>My Profile</span>
          </h3>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="text-indigo-300 hover:text-white transition text-sm font-bold px-3 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-600"
            >
              <i className="fa-solid fa-pen mr-1"></i> Edit Profile
            </button>
          )}
        </div>

        <div className="p-6 bg-slate-50">
          {/* VIEW MODE */}
          {!isEditing ? (
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full shadow-md border-4 border-white mb-2 bg-indigo-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {/* Render actual photo if we have an ID/URL, else initials */}
                {profile.Photo_URL ? (
                  <img src={`https://drive.google.com/uc?id=${profile.Photo_URL}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile.Name.charAt(0)
                )}
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">{profile.Name}</h2>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{profile.Role}</p>
              <p className="text-[10px] text-slate-400">{profile.Email}</p>
              
              <div className="grid grid-cols-2 gap-3 w-full mt-6">
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Blood Group</p>
                  <p className="text-sm font-black text-slate-700">{profile.Blood_Group || "-"}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Phone</p>
                  <p className="text-sm font-black text-slate-700">{profile.Phone || "-"}</p>
                </div>
              </div>
              
              <div className="w-full mt-4 bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Address</p>
                <p className="text-sm font-bold text-slate-700">{profile.Address || "Not provided"}</p>
              </div>

              {/* Actions (Clock In/Out, Outdoor) */}
              <div className="w-full mt-4 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Status</p>
                    <p className="text-xl font-black text-slate-700 mt-1">{profile.Current_Status}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={async () => { 
                      try {
                        const res = await gasApi('clockIn', { email });
                        alert(res); 
                        loadProfile(); 
                      } catch(err) {
                        alert(err.message);
                      }
                    }} 
                    className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm transition shadow-sm active:scale-95"
                  >
                    Clock In
                  </button>
                  <button 
                    onClick={async () => { 
                      try {
                        const res = await gasApi('clockOut', { email });
                        alert(res); 
                        loadProfile(); 
                      } catch(err) {
                        alert(err.message);
                      }
                    }} 
                    className="py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-sm transition shadow-sm active:scale-95"
                  >
                    Clock Out
                  </button>
                  <button 
                    onClick={() => setIsOutdoorModalOpen(true)} 
                    className="py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-sm transition shadow-sm active:scale-95"
                  >
                    Outdoor
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Blood Group</label>
                  <select 
                    value={formData.bloodGroup} 
                    onChange={e => setFormData({...formData, bloodGroup: e.target.value})} 
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Address</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <h4 className="text-sm font-bold text-indigo-600 mb-3">Upload Documents</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Profile Photo (JPG/PNG)</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleFileChange(e, 'photoFile')} 
                      className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Aadhaar Card (PDF/Image)</label>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      onChange={e => handleFileChange(e, 'aadhaarFile')} 
                      className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">PAN Card (PDF/Image)</label>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      onChange={e => handleFileChange(e, 'panFile')} 
                      className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="flex-1 py-2 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {saving ? 'Uploading...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Outdoor Duty Modal */}
      {isOutdoorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Outdoor Duty</h3>
            <p className="text-sm text-slate-600 mb-4">Please specify the reason for your outdoor duty:</p>
            <input 
              type="text" 
              value={outdoorNote}
              onChange={e => setOutdoorNote(e.target.value)}
              placeholder="e.g., Going to Bank, Hospital with student..." 
              className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsOutdoorModalOpen(false)} 
                className="flex-1 py-2 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleOutdoorDutySubmit} 
                disabled={!outdoorNote || updatingStatus}
                className="flex-1 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}