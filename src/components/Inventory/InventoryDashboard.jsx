import React, { useState, useEffect } from 'react';
import { gasApi } from '../../api/gasApi';

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState([]);

  const loadInventory = () => gasApi('getInventory').then(setInventory).catch(console.error);
  
  useEffect(() => { loadInventory(); }, []);

  const handleAddStock = async () => {
    await gasApi('addStock', { itemName: 'New Item', category: 'Supplies', quantity: 10, unit: 'pcs' });
    loadInventory();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Inventory</h2>
        <button onClick={handleAddStock} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
          Add Test Item
        </button>
      </div>
      <table className="w-full bg-white shadow-sm rounded-lg overflow-hidden">
        <thead className="bg-slate-800 text-white">
          <tr><th className="p-3 text-left">Item</th><th className="p-3 text-left">Qty</th></tr>
        </thead>
        <tbody>
          {inventory.map((item, idx) => (
            <tr key={idx} className="border-b">
              <td className="p-3">{item['Item Name']}</td>
              <td className="p-3">{item['Quantity']} {item['Unit']}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}