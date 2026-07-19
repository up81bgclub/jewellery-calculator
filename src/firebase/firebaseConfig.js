// 1. Firebase core aur required services ko import karein
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4oZHrsIWHPJhCAJnu-Ay9bFIyAfCXJoA",
  authDomain: "caculation-system.firebaseapp.com",
  projectId: "caculation-system",
  storageBucket: "caculation-system.firebasestorage.app",
  messagingSenderId: "950951282080",
  appId: "1:950951282080:web:35e2864b7bf874aede50c5",
  measurementId: "G-P0F7SG4WES"
};

// 2. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 3. Services ko extract karein aur EXPORT karein taaki Login/SignUp components inko use kar sakein
export const auth = getAuth(app);
export const db = getFirestore(app);