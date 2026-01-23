// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxIya_i0iAd9rkbypDXgAad9p1JNdi3hw",
  authDomain: "impact-esg-deal.firebaseapp.com",
  projectId: "impact-esg-deal",
  storageBucket: "impact-esg-deal.firebasestorage.app",
  messagingSenderId: "99936555378",
  appId: "1:99936555378:web:1e17129110f66d942ccdeb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);  // For database (storing game data)
export const auth = getAuth(app);     // For authentication (player login)

export default app;
