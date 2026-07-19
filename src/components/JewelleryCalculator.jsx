import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

const JewelleryCalculator = ({ userRole, userName }) => {
  // Top Bar Rates
  const [rate22k, setRate22k] = useState('75000');
  const [rate18k, setRate18k] = useState('62000');
  const [rate14k, setRate14k] = useState('50000');
  const [rateSilver, setRateSilver] = useState('90000');

  // Tabs & Views
  const [activeTab, setActiveTab] = useState('gold');
  const [showAllData, setShowAllData] = useState(false); // Page toggle logic

  // Form Fields
  const [itemName, setItemName] = useState('');
  const [weight, setWeight] = useState('');
  const [goldPurity, setGoldPurity] = useState('22kt');
  const [mkgPercent, setMkgPercent] = useState('');
  const [mkgAmount, setMkgAmount] = useState('');
  const [stone1, setStone1] = useState('');
  const [stone2, setStone2] = useState('');
  const [diamondAmount, setDiamondAmount] = useState('');

  // Lists & States
  const [calculations, setCalculations] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState('');

  // Checkbox & Custom Calculator States (For Today's Data Only)
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [minusAmount, setMinusAmount] = useState('');

  // Fetch Live Data from Firestore
  useEffect(() => {
    const calcRef = collection(db, "jewellery_calculations");
    const unsubscribe = onSnapshot(calcRef, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sorting by date new to old
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCalculations(list);
    });
    return () => unsubscribe();
  }, []);

  // Filter Functions
  const isToday = (dateString) => {
    const today = new Date();
    const itemDate = new Date(dateString);
    return today.toDateString() === itemDate.toDateString();
  };

  const todaysCalculations = calculations.filter(c => isToday(c.createdAt));
  const olderCalculations = calculations.filter(c => !isToday(c.createdAt));
  
  // Active rendering list based on current view page toggle
  const displayedList = showAllData ? olderCalculations : todaysCalculations;

  // Handle Checkbox Selection
  const handleCheckboxChange = (id) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter(itemId => itemId !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  // Live Checkbox Calculations
  const selectedItemsSum = todaysCalculations
    .filter(item => selectedItemIds.includes(item.id))
    .reduce((sum, item) => sum + (item.grandTotal || 0), 0);

  const discountValue = parseFloat(minusAmount) || 0;
  const finalCalculatedTotal = Math.max(0, selectedItemsSum - discountValue);

  // Calculate & Save Logic
  const handleCalculateAndSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!itemName.trim() || !weight) {
      setError("Item Name aur Weight zaroori hain.");
      return;
    }

    const wt = parseFloat(weight) || 0;
    let currentRate = 0;
    let metalAmount = 0;
    let finalMkg = 0;
    let st1 = parseFloat(stone1) || 0;
    let st2 = parseFloat(stone2) || 0;
    let dmAmt = parseFloat(diamondAmount) || 0;

    if (activeTab === 'gold') {
      if (goldPurity === '22kt') currentRate = parseFloat(rate22k) || 0;
      if (goldPurity === '18kt') currentRate = parseFloat(rate18k) || 0;
      if (goldPurity === '14kt') currentRate = parseFloat(rate14k) || 0;
      metalAmount = (wt * currentRate) / 10;
      finalMkg = (metalAmount * (parseFloat(mkgPercent) || 0)) / 100 + (parseFloat(mkgAmount) || 0);
    } else if (activeTab === 'silver') {
      currentRate = parseFloat(rateSilver) || 0;
      metalAmount = (wt * currentRate) / 10;
      finalMkg = parseFloat(mkgAmount) || 0;
    } else if (activeTab === 'diamond') {
      if (goldPurity === '18kt') currentRate = parseFloat(rate18k) || 0;
      if (goldPurity === '14kt') currentRate = parseFloat(rate14k) || 0;
      metalAmount = (wt * currentRate) / 10;
      finalMkg = parseFloat(mkgAmount) || 0;
    }

    const stoneTotal = st1 + st2;
    const totalBeforeTax = metalAmount + finalMkg + stoneTotal + dmAmt;
    const gst3 = totalBeforeTax * 0.03;
    const grandTotal = totalBeforeTax + gst3;

    try {
      await addDoc(collection(db, "jewellery_calculations"), {
        type: activeTab,
        itemName: itemName.trim(),
        weight: wt,
        rate: currentRate,
        purity: activeTab !== 'silver' ? goldPurity : 'Silver',
        goldAmount: metalAmount,
        mkg: finalMkg,
        stoneAmount: stoneTotal || null,
        diamondAmount: activeTab === 'diamond' ? dmAmt : null,
        totalBeforeTax,
        gst: gst3,
        grandTotal,
        addedByName: userName || "Staff",
        createdAt: new Date().toISOString()
      });

      // Clear fields
      setItemName(''); setWeight(''); setMkgPercent(''); setMkgAmount(''); setStone1(''); setStone2(''); setDiamondAmount('');
    } catch (err) {
      setError("Database entry failed: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (userRole !== 'admin') {
      alert("Only Admin can delete!");
      return;
    }
    if (window.confirm("Permanently delete?")) {
      await deleteDoc(doc(db, "jewellery_calculations", id));
      if (selectedItem?.id === id) setSelectedItem(null);
      setSelectedItemIds(selectedItemIds.filter(itemId => itemId !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Global Rates Live Config Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Gold 22KT Rate (10g)</label>
          <input type="number" value={rate22k} onChange={(e) => setRate22k(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-yellow-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Gold 18KT Rate (10g)</label>
          <input type="number" value={rate18k} onChange={(e) => setRate18k(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-yellow-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Gold 14KT Rate (10g)</label>
          <input type="number" value={rate14k} onChange={(e) => setRate14k(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-yellow-600 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Silver Rate (10g)</label>
          <input type="number" value={rateSilver} onChange={(e) => setRateSilver(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-300 focus:outline-none" />
        </div>
      </div>

      {/* 2. Type Tabs */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 max-w-md">
        {['gold', 'silver', 'diamond'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setGoldPurity(tab === 'diamond' ? '18kt' : '22kt'); }}
            className={`w-full py-2 text-sm font-bold rounded-lg transition-all uppercase ${activeTab === tab ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Dynamic Calculation Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 capitalize">✨ New {activeTab} Item Calculator</h3>
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-3">{error}</p>}

        <form onSubmit={handleCalculateAndSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Ring, Chain..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (gm) *</label>
              <input type="number" step="0.001" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.000" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" required />
            </div>
            {activeTab !== 'silver' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
                <select value={goldPurity} onChange={(e) => setGoldPurity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                  {activeTab === 'gold' && <option value="22kt">22KT Gold</option>}
                  <option value="18kt">18KT Gold</option>
                  <option value="14kt">14KT Gold</option>
                </select>
              </div>
            )}
            {activeTab === 'gold' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Making Charge (%)</label>
                <input type="number" step="0.01" value={mkgPercent} onChange={(e) => setMkgPercent(e.target.value)} placeholder="%" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            )}
            {activeTab !== 'gold' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Making Charge (Flat Amt)</label>
                <input type="number" value={mkgAmount} onChange={(e) => setMkgAmount(e.target.value)} placeholder="₹" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            )}
            {activeTab === 'gold' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extra MKG Amt (Optional)</label>
                <input type="number" value={mkgAmount} onChange={(e) => setMkgAmount(e.target.value)} placeholder="₹ Extra" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            )}
            {activeTab === 'diamond' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diamond Flat Amount</label>
                <input type="number" value={diamondAmount} onChange={(e) => setDiamondAmount(e.target.value)} placeholder="₹ Value" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            )}
            {activeTab !== 'silver' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stone 1 Amt (Optional)</label>
                  <input type="number" value={stone1} onChange={(e) => setStone1(e.target.value)} placeholder="₹ Stone 1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stone 2 Amt (Optional)</label>
                  <input type="number" value={stone2} onChange={(e) => setStone2(e.target.value)} placeholder="₹ Stone 2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </>
            )}
            {activeTab === 'silver' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stone Amt (Optional)</label>
                <input type="number" value={stone1} onChange={(e) => setStone1(e.target.value)} placeholder="₹ Stone" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            )}
          </div>
          <div className="flex justify-end"><button type="submit" className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-sm shadow-md">Calculate & Save List</button></div>
        </form>
      </div>

      {/* Page Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button onClick={() => setShowAllData(false)} className={`py-2.5 px-6 font-bold text-sm transition-all border-b-2 ${!showAllData ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          📅 Today's Entries ({todaysCalculations.length})
        </button>
        <button onClick={() => setShowAllData(true)} className={`py-2.5 px-6 font-bold text-sm transition-all border-b-2 ${showAllData ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          🗄️ History / Older Data ({olderCalculations.length})
        </button>
      </div>

      {/* 4. Live Data View & Custom Counter Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-800 text-white text-xs uppercase">
                  <tr>
                    {!showAllData && <th className="p-3 w-10 text-center">Select</th>}
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">WT (gm)</th>
                    <th className="p-3">Grand Total</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedList.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-6 text-gray-400">Is page par koi data nahi mila.</td></tr>
                  ) : (
                    displayedList.map((calc) => (
                      <tr key={calc.id} className="hover:bg-slate-50 transition-colors">
                        {!showAllData && (
                          <td className="p-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedItemIds.includes(calc.id)}
                              onChange={() => handleCheckboxChange(calc.id)}
                              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-gray-300 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="p-3 font-semibold text-gray-900">{calc.itemName}</td>
                        <td className="p-3"><span className="text-xs px-2 py-0.5 font-bold uppercase rounded bg-amber-100 text-amber-800">{calc.type}</span></td>
                        <td className="p-3 font-medium">{calc.weight.toFixed(3)} gm</td>
                        <td className="p-3 font-bold text-emerald-600">₹{calc.grandTotal.toFixed(1)}</td>
                        <td className="p-3 text-right space-x-2">
                          <button onClick={() => setSelectedItem(calc)} className="bg-slate-900 text-white text-xs px-2.5 py-1 rounded font-semibold hover:bg-slate-700">Show</button>
                          {userRole === 'admin' && <button onClick={() => handleDelete(calc.id)} className="bg-rose-600 text-white text-xs px-2.5 py-1 rounded font-semibold hover:bg-rose-700">Delete</button>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CHECKBOX DYNAMIC COUNTER SUM SCREEN (Visible on Today's Page Only) */}
          {!showAllData && todaysCalculations.length > 0 && (
            <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg border border-slate-700 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm tracking-wide text-slate-300">
                  🔢 Checkbox Total Calculator ({selectedItemIds.length} Items Selected)
                </h4>
                <button 
                  onClick={() => { setSelectedItemIds([]); setMinusAmount(''); }} 
                  className="text-xs font-bold text-rose-400 hover:text-rose-300"
                >
                  Clear Selection
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2">
                <div>
                  <span className="block text-xs text-slate-400 mb-1">Selected Items Sum</span>
                  <span className="text-xl fo                                          nt-bold text-yellow-400">₹{selectedItemIds.length > 0 ? selectedItemsSum.toFixed(1) : '0.0'}</span>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Minus Amount / Discount (Optional)</label>
                  <input 
                    type="number" 
                    value={minusAmount} 
                    onChange={(e) => setMinusAmount(e.target.value)} 
                    placeholder="₹ Entering Amount to Minus" 
                    className="w-full bg-slate-800 border border-slate-700 text-sm text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-right">
                  <span className="block text-xs text-slate-400">Final Checked Total</span>
                  <span className="text-2xl font-black text-emerald-400">₹{finalCalculatedTotal.toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Inspector Panel */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-fit">
          <div className="p-4 bg-slate-900 text-white font-bold text-center tracking-wide">🔍 Item Details Breakdown</div>
          {selectedItem ? (
            <div className="divide-y divide-gray-200 bg-slate-900 text-slate-100 text-sm">
              <div className="flex justify-between p-3"><span className="text-slate-400">Item Name</span><span className="font-bold text-amber-400">{selectedItem.itemName}</span></div>
              <div className="flex justify-between p-3"><span className="text-slate-400">Weight</span><span className="font-bold">{selectedItem.weight.toFixed(3)} gm</span></div>
              <div className="flex justify-between p-3"><span className="text-slate-400">Rate</span><span className="font-bold">₹{selectedItem.rate}</span></div>
              <div className="flex justify-between p-3"><span className="text-slate-400">Gold/Metal Amount</span><span className="font-bold text-yellow-400">₹{selectedItem.goldAmount.toFixed(1)}</span></div>
              <div className="flex justify-between p-3"><span className="text-slate-400">MKG Charges</span><span className="font-bold">₹{selectedItem.mkg.toFixed(1)}</span></div>
              <div className="flex justify-between p-3"><span className="text-slate-400">ST AMT (Stones)</span><span className="font-bold">{selectedItem.stoneAmount ? `₹${selectedItem.stoneAmount.toFixed(1)}` : 'null'}</span></div>
              <div className="flex justify-between p-3"><span className="text-slate-400">Diamond Amount</span><span className="font-bold">{selectedItem.diamondAmount ? `₹${selectedItem.diamondAmount.toFixed(1)}` : 'null'}</span></div>
              <div className="flex justify-between p-3 bg-slate-800"><span className="text-slate-300 font-semibold">Total (Before Tax)</span><span className="font-bold">₹{selectedItem.totalBeforeTax.toFixed(2)}</span></div>
              <div className="flex justify-between p-3"><span className="text-slate-400">GST 3%</span><span className="font-bold text-rose-400">₹{selectedItem.gst.toFixed(1)}</span></div>
              <div className="flex justify-between p-4 bg-slate-950 border-t border-amber-500"><span className="text-amber-400 font-extrabold text-base">Grand Total</span><span className="font-black text-emerald-400 text-lg">₹{selectedItem.grandTotal.toFixed(1)}</span></div>
              <div className="p-2 bg-slate-800 text-center text-xs text-slate-400">Calculated By: {selectedItem.addedByName}</div>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-gray-400 bg-gray-50 italic">List mein se kisi item ke "Show" button par click karke breakdown dekhein.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JewelleryCalculator;
