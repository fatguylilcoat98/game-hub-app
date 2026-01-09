import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDmyFrmiLvrNLSlOMYzKloNZgvFVShx2d8",
  authDomain: "duo-shack.firebaseapp.com",
  databaseURL: "https://duo-shack-default-rtdb.firebaseio.com",
  projectId: "duo-shack",
  storageBucket: "duo-shack.firebasestorage.app",
  messagingSenderId: "44265190254",
  appId: "1:44265190254:web:4dd9b3e72c6995c5d0877f"
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);

// Export the database instance
export const db = getDatabase(app);

export default app;
