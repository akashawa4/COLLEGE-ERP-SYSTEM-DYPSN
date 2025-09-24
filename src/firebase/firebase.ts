
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDHrqHq6hd2L99ElR-4XyE8S-PcOs1P5Vw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dypsn-erp-system.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dypsn-erp-system",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dypsn-erp-system.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1030896663948",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1030896663948:web:12cf243adef7cde1cbaaa9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RW0Y07GWW4"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);