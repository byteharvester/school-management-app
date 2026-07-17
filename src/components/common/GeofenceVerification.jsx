// src/components/common/GeofenceVerification.jsx
import { useState } from 'react';

// School coordinates (from your original code)
const SCHOOL_LAT = 19.005916434926373;
const SCHOOL_LNG = 75.7375200549537;
const DEFAULT_RADIUS = 200; // meters

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // metres
}

export default function GeofenceVerification({ onVerified, radius = DEFAULT_RADIUS }) {
  const [status, setStatus] = useState('Tap to Verify GPS');
  const [loading, setLoading] = useState(false);

  const verify = () => {
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported');
      if (onVerified) onVerified(false);
      return;
    }
    setLoading(true);
    setStatus('Locating...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, SCHOOL_LAT, SCHOOL_LNG);
        const within = dist <= radius;
        setStatus(within 
          ? `✅ Verified: On Campus (${Math.round(dist)}m)` 
          : `❌ ${Math.round(dist)}m away – must be within ${radius}m`);
        setLoading(false);
        if (onVerified) onVerified(within);
      },
      (err) => {
        let msg = 'GPS Error';
        if (err.code === 1) msg = 'Permission denied';
        else if (err.code === 2) msg = 'Location unavailable';
        else if (err.code === 3) msg = 'Timeout';
        setStatus(`⚠️ ${msg}`);
        setLoading(false);
        if (onVerified) onVerified(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div 
      onClick={verify} 
      className={`text-[10.5px] font-bold p-3 rounded-xl flex items-center justify-center gap-2 w-full transition-colors shadow-sm active:scale-95 cursor-pointer ${
        status.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
        status.includes('❌') || status.includes('⚠️') ? 'bg-rose-50 text-rose-700 border border-rose-200' :
        'bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300'
      }`}
    >
      <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'} text-sm`}></i>
      {status}
    </div>
  );
}