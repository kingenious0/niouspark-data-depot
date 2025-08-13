// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "niouspark-data-depot",
  appId: "1:46076385690:web:2f5d934c31e7ac55d4c223",
  storageBucket: "niouspark-data-depot.firebasestorage.app",
  apiKey: "AIzaSyC1EuhUqyc-_pC-jju2XC0dWy2dSKMzINw",
  authDomain: "niouspark-data-depot.firebaseapp.com",
  messagingSenderId: "46076385690"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
