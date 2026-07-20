import React, { useState, useEffect } from 'react';
import { auth } from './firebase/firebaseConfig';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Customers from './components/Customers';
import JewelleryCalculator from './components/JewelleryCalculator';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isSignUpPage, setIsSignUpPage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setLoggedInUser({
          uid: currentUser.uid,
          name: currentUser.displayName || 'Staff',
          role: currentUser.role || 'staff',
          email: currentUser.email
        });
      } else {
        setLoggedInUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [])

  const handleLogout = () => {
    auth.signOut().then(() => {
      setLoggedInUser(null);
    });
  };

  if(loading) {
    return(
      <div className='flex items-center justify-center h-screen bg-slate-900 text-white'>
        <div className='font-bold animate-pluse'>Setting up secure session...</div>
      </div>
    )
  }

  if (!loggedInUser) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col justify-center">
        {isSignUpPage ? (
          <SignUp />
        ) : (
          <Login setLoggedInUser={setLoggedInUser} />
        )}
        
        <div className="text-center -mt-6 pb-12">
          <button 
            onClick={() => setIsSignUpPage(!isSignUpPage)} 
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
          >
            {isSignUpPage ? "Already have an account? Login" : "Don't have an account? Register Here"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Tailwind Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Calculation System <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">{loggedInUser.role.toUpperCase()}</span>
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, <b className="text-gray-900">{loggedInUser.name}</b></span>
              <button 
                onClick={handleLogout} 
                className="inline-flex items-center px-3.5 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-rose-600 hover:bg-rose-700 focus:outline-none transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loggedInUser.role === 'admin' ? (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-emerald-800">Admin Control Panel</h3>
            <p className="mt-1 text-sm text-emerald-700">Aapke paas full read, write, aur delete features ka standard access hai.</p>
          </div>
        ) : (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-amber-800">Staff Control Panel</h3>
            <p className="mt-1 text-sm text-amber-700">Aap dynamic data enter aur print kar sakte hain, par management settings limited hain.</p>
          </div>
        )}

        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <Customers userRole={loggedInUser.role} userId={loggedInUser.uid} userName={loggedInUser.displayName}></Customers>
          <JewelleryCalculator userRole={loggedInUser.role} userName={loggedInUser.displayName}></JewelleryCalculator>
        </div>
      </main>
    </div>
  );
}

export default App;