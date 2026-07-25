// src/components/common/LeaveBalanceWidget.jsx
import { useEffect, useState } from 'react';
import { getStaffLeaveBalance, applyLeave, getLeaveHistory } from '../../api/endpoints';

export default function LeaveBalanceWidget({ email }) {
  const [balance, setBalance] = useState({ total: 15, available: 15, taken: 0, pending: 0 });
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const loadBalance = async () => {
    const data = await getStaffLeaveBalance(email);
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    setBalance(parsed);
  };

  const loadHistory = async () => {
    const data = await getLeaveHistory(email);
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    setHistory(parsed);
  };

  useEffect(() => {
    if (email) {
      loadBalance();
      loadHistory();
    }
  }, [email]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) return alert('Please select dates');
    if (new Date(fromDate) > new Date(toDate)) return alert('From date must be before To date');
    setLoading(true);
    const res = await applyLeave(email, leaveType, fromDate, toDate, reason);
    if (res.startsWith('Leave request submitted')) {
      alert(res);
      setShowApply(false);
      loadBalance();
      loadHistory();
    } else {
      alert(res);
    }
    setLoading(false);
  };

  return (
    <div className="w-full mt-4 border-t border-slate-200 pt-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Leave Management</p>
      
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-indigo-50 rounded-xl p-2 text-center">
          <p className="text-[8px] text-slate-400">Total</p>
          <p className="text-lg font-bold text-slate-700">{balance.total}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-2 text-center">
          <p className="text-[8px] text-slate-400">Available</p>
          <p className="text-lg font-bold text-emerald-600">{balance.available}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-2 text-center">
          <p className="text-[8px] text-slate-400">Taken</p>
          <p className="text-lg font-bold text-amber-600">{balance.taken}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-2 text-center">
          <p className="text-[8px] text-slate-400">Pending</p>
          <p className="text-lg font-bold text-blue-600">{balance.pending}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setShowApply(!showApply)} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center justify-center gap-2">
          <i className="fa-solid fa-plus"></i> Apply for Leave
        </button>
        <button onClick={() => setShowHistory(!showHistory)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2">
          <i className="fa-solid fa-clock-rotate-left"></i> History
        </button>
      </div>

      {showApply && (
        <form onSubmit={handleApply} className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full p-2 border rounded text-sm">
            <option>Casual</option><option>Sick</option><option>Earned</option><option>Emergency</option><option>Compensatory</option>
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full p-2 border rounded text-sm" required />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full p-2 border rounded text-sm" required />
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="w-full p-2 border rounded text-sm" rows="2"></textarea>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowApply(false)} className="flex-1 py-2 border rounded text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded text-sm">{loading ? 'Submitting...' : 'Submit'}</button>
          </div>
        </form>
      )}

      {showHistory && (
        <div className="mt-3 max-h-40 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 text-center">No leave history</p>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="p-2 border-b border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold">{item.type}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                    item.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                    item.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{item.status}</span>
                </div>
                <p className="text-slate-500">{item.fromDate} → {item.toDate}</p>
                {item.reason && <p className="text-slate-400">{item.reason}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}