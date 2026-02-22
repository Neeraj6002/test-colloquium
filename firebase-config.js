// ============================================================
// FIREBASE AUTHENTICATION FOR ADMIN DASHBOARD
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged,
    signOut 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDDbtbxlzWsRL4nZ3YyjSkW7DFmqMsdwfk",
    authDomain: "colloquium-26.firebaseapp.com",
    projectId: "colloquium-26",
    storageBucket: "colloquium-26.firebasestorage.app",
    messagingSenderId: "467903040407",
    appId: "1:467903040407:web:cd56e1e700ff45b7f752d2",
    measurementId: "G-EMPLCFJW8Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// ============================================================
// HARDCODED ALLOWED ADMIN EMAILS
// ============================================================
const ALLOWED_ADMINS = [
    'pjneeraj6002@gmail.com',
    'jasiansari@ieee.org',
    'vigneshnarrayan@ieee.org',
    'thahir05ae@gmail.com',
    'adithyanath.s10b@gmail.com',
    'neerajj6002@gmail.com',
    'ananthapadmanabhanprakash@ieee.org'
];

// ============================================================
// CHECK IF USER IS AUTHORIZED
// ============================================================
function isAuthorizedUser(email) {
    return ALLOWED_ADMINS.includes(email.toLowerCase());
}

// ============================================================
// GOOGLE SIGN IN
// ============================================================
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        console.log('User signed in:', user.email);
        
        if (isAuthorizedUser(user.email)) {
            console.log('User authorized');
            return { success: true, user };
        } else {
            console.log('User not authorized');
            await signOut(auth);
            return { 
                success: false, 
                error: 'Access Denied: Your email is not authorized to access this admin panel.' 
            };
        }
        
    } catch (error) {
        console.error('Error during sign in:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// ============================================================
// SIGN OUT
// ============================================================
export async function signOutUser() {
    try {
        await signOut(auth);
        console.log('User signed out');
        return { success: true };
    } catch (error) {
        console.error('Error during sign out:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================
// AUTH STATE OBSERVER
// ============================================================
export function initAuthObserver(onAuthorized, onUnauthorized) {
    onAuthStateChanged(auth, (user) => {
        if (user && isAuthorizedUser(user.email)) {
            console.log('Authorized user detected:', user.email);
            onAuthorized(user);
        } else {
            console.log('No authorized user');
            onUnauthorized();
        }
    });
}

// ============================================================
// GET CURRENT USER
// ============================================================
export function getCurrentUser() {
    return auth.currentUser;
}

// ============================================================
// EXPORTS
// ============================================================
export { auth, db, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp };