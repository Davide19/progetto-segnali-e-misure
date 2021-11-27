// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWT4pc_UP_e7DaqP6VJ_cbDatK3oNNSgM",
  authDomain: "segnali-e-misure.firebaseapp.com",
  databaseURL: "https://segnali-e-misure-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "segnali-e-misure",
  storageBucket: "segnali-e-misure.appspot.com",
  messagingSenderId: "990634275920",
  appId: "1:990634275920:web:db6350ea514bb5ca2ccd55",
  measurementId: "G-DVKMVH7EZZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
