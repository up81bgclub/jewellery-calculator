import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

const Customers = ({ userRole, userId, userName }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [pan, setPan] = useState('');
  const [notes, setNotes] = useState('');
  const [customers, setCustomers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  // 1. Realtime Data Fetch from Firestore
  useEffect(() => {
    const customersRef = collection(db, "customers");
    const unsubscribe = onSnapshot(customersRef, (snapshot) => {
      const customersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomers(customersList);
    }, (err) => {
      setError("Data fetch karne mein dikkat aayi: " + err.message);
    });

    return () => unsubscribe();
  }, []);

  // 2. Form Submit Handler (Add / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation: Sirf Name required hai
    if (!name.trim()) {
      setError("Customer Name zaroori (Required) hai.");
      return;
    }

    try {
      const customerData = {
        name: name.trim(),
        phone: phone.trim() || null,
        aadhar: aadhar.trim() || null,
        pan: pan.trim() || null,
        notes: notes.trim() || null,
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        // Update existing customer
        const customerRef = doc(db, "customers", editingId);
        await updateDoc(customerRef, customerData);
        setEditingId(null);
      } else {
        // Add new customer
        await addDoc(collection(db, "customers"), {
          ...customerData,
          addedBy: userId,
          addedByName: userName || "Unknown Staff",
          createdAt: new Date().toISOString()
        });
      }

      // Form clear karein
      setName('');
      setPhone('');
      setAadhar('');
      setPan('');
      setNotes('');
    } catch (err) {
      setError("Database mein save nahi ho paya: " + err.message);
    }
  };

  // 3. Edit Mode Trigger
  const handleEdit = (customer) => {
    setEditingId(customer.id);
    setName(customer.name);
    setPhone(customer.phone || '');
    setAadhar(customer.aadhar || '');
    setPan(customer.pan || '');
    setNotes(customer.notes || '');
  };

  // 4. Delete Handler (Admin Only)
  const handleDelete = async (id) => {
    if (userRole !== 'admin') {
      alert("Aapke paas delete karne ki permission nahi hai!");
      return;
    }
    
    if (window.confirm("Kya aap sach mein is customer ko delete karna chahte hain?")) {
      try {
        await deleteDoc(doc(db, "customers", id));
      } catch (err) {
        setError("Delete fail ho gaya: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {editingId ? "✏️ Edit Customer Details" : "👤 Register New Customer"}
        </h3>
        
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Name Field - REQUIRED */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                required
              />
            </div>

            {/* Phone Field - OPTIONAL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile Number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            {/* Aadhaar Field - OPTIONAL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number (Optional)</label>
              <input
                type="text"
                value={aadhar}
                onChange={(e) => setAadhar(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>

            {/* PAN Field - OPTIONAL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number (Optional)</label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Notes Field - OPTIONAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Customer ke baare mein kuch extra details jaise address, credit balance, etc."
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setName('');
                  setPhone('');
                  setAadhar('');
                  setPan('');
                  setNotes('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {editingId ? "Update Customer" : "Save Customer"}
            </button>
          </div>
        </form>
      </div>

      {/* Customer Display Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Saved Customers</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Aadhaar</th>
                <th className="px-6 py-3">PAN</th>
                <th className="px-6 py-3">Added By</th>
                <th className="px-6 py-3">Notes</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">
                    Database mein koi customer record nahi mila.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{cust.name}</td>
                    <td className="px-6 py-4 text-gray-600">{cust.phone || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{cust.aadhar || '—'}</td>
                    <td className="px-6 py-4 text-gray-600 uppercase">{cust.pan || '—'}</td>
                    <td className="px-6 py-4">
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200'>
                        {cust.addedByName || 'System'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{cust.notes || '—'}</td>
                    <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(cust)}
                        className="text-blue-600 hover:text-blue-900 font-semibold"
                      >
                        Edit
                      </button>
                      
                      {userRole === 'admin' ? (
                        <button
                          onClick={() => handleDelete(cust.id)}
                          className="text-rose-600 hover:text-rose-900 font-semibold"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-gray-300 cursor-not-allowed select-none font-semibold">Delete</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;