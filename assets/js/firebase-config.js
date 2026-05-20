// Firebase Configuration for Mini Cart
// To connect your database, create a Firebase project at https://console.firebase.google.com/
// and replace the config keys below with your web app's credentials.

const firebaseConfig = {
  apiKey: "AIzaSyCJy8i8vBVpHAr2l-OEfuFUnTzo4BDhQt8",
  authDomain: "mini-cart-70c14.firebaseapp.com",
  projectId: "mini-cart-70c14",
  storageBucket: "mini-cart-70c14.firebasestorage.app",
  messagingSenderId: "928510137686",
  appId: "1:928510137686:web:9f6534d7f0f68092ab72f7",
  measurementId: "G-HQW80MPSW9"
};

// Initialize Firebase
let app;
let db;
let auth;

try {
  app = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  console.log("Firebase initialized successfully for Mini Cart!");
} catch (error) {
  console.warn("Firebase initialization failed. Please update your firebaseConfig in assets/js/firebase-config.js", error);
}

// ==========================================
// Example Firestore Database helper functions
// ==========================================

// 1. Fetch products from Firestore
async function getProducts() {
  if (!db) return [];
  try {
    const querySnapshot = await db.collection("products").get();
    let products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return products;
  } catch (error) {
    console.error("Error fetching products: ", error);
    return [];
  }
}

// 2. Save an order to Firestore
async function saveOrder(userId, cartItems, totalAmount) {
  if (!db) return null;
  try {
    const orderRef = await db.collection("orders").add({
      userId: userId || "guest",
      items: cartItems,
      total: totalAmount,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: "pending"
    });
    console.log("Order saved with ID: ", orderRef.id);
    return orderRef.id;
  } catch (error) {
    console.error("Error saving order: ", error);
    throw error;
  }
}
