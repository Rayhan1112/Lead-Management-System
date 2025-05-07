// firebase.js

// Import necessary Firebase services
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Realtime Database

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4tt2fFP7I0TYm3sGhTWQF_59LZ9uiERQ",
  authDomain: "new-lms-3a0dc.firebaseapp.com",
  databaseURL: "https://new-lms-3a0dc-default-rtdb.firebaseio.com", // Add Realtime DB URL
  projectId: "new-lms-3a0dc",
  storageBucket: "new-lms-3a0dc.appspot.com",
  messagingSenderId: "956423626146",
  appId: "1:956423626146:web:63b0c32e4640181dc7e6fb",
  measurementId: "G-NZ9H6VP6TB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and Realtime Database
const auth = getAuth(app);
const database = getDatabase(app);

// Export the services for use in your app
export { app, analytics, auth, database };
