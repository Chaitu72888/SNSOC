// Firebase Initialization for SNSOC Web App
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQlFEMY4MNGsa0TK-vYuML3TifqX90O6o",
  authDomain: "snsoc-b2c20.firebaseapp.com",
  projectId: "snsoc-b2c20",
  storageBucket: "snsoc-b2c20.firebasestorage.app",
  messagingSenderId: "198468694814",
  appId: "1:198468694814:web:d22e5c75dc34e3bb3a8f0f",
  measurementId: "G-MSC1FSH919"
};

// Initialize Firebase & Analytics
const app = initializeApp(firebaseConfig);
let analytics = null;

try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("[Firebase] Analytics initialization note:", e);
}

export { app, analytics };
window.firebaseApp = app;
window.firebaseAnalytics = analytics;
console.log("[SNSOC] Firebase initialized successfully (snsoc-b2c20).");
