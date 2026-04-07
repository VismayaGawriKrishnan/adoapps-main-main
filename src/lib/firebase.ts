import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Your web app's Firebase configuration
// Replace with actual keys once you create a Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyMockApiKeyToChange",
  authDomain: "ai-health-mock.firebaseapp.com",
  projectId: "ai-health-mock",
  storageBucket: "ai-health-mock.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
const auth = getAuth(app);

// Use Emulators for local development if running in dev mode
if (import.meta.env.MODE === 'development') {
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectAuthEmulator(auth, 'http://localhost:9099');
}

export { app, db, auth };
