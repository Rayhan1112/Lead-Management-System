// firebase.js

// Import necessary Firebase services
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Realtime Database
import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8_GQNQB1kw803JB_bvo240Oh-a6PZEsM",
  authDomain: "final-lms-d15f0.firebaseapp.com",
  databaseURL: "https://final-lms-d15f0-default-rtdb.firebaseio.com",
  projectId: "final-lms-d15f0",
  storageBucket: "final-lms-d15f0.firebasestorage.app",
  messagingSenderId: "700655769720",
  appId: "1:700655769720:web:569b445a99bdf6375bb58d",
  measurementId: "G-13D5MWJD3E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and Realtime Database
const auth = getAuth(app);
const database = getDatabase(app);
const messaging = getMessaging(app);

// Export the services for use in your app
export { app, analytics, auth, database,messaging };
