import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email);
    
    if (!result.success) {
      setError(result.message || 'Login failed. Make sure your email is registered in the Staff sheet.');
      setLoading(false);
    }
    // If successful, the AuthContext will automatically update the state and hide this screen
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
            <i className="fa-solid fa-graduation-cap text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">SMI</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Staff Portal Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
              Registered Email
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. staff@school.com"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-600 text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {loading ? (
              <><i className="fa-solid fa-circle-notch fa-spin"></i> Verifying...</>
            ) : (
              <><i className="fa-solid fa-arrow-right-to-bracket"></i> Secure Login</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}