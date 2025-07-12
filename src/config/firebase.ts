import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Configuração do Firebase (pegue essas informações no console do Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyADwK7A0KgN5S7DijQ7hSmRVShWZpxtmkg",
  authDomain: "trunfia-49fbc.firebaseapp.com",
  projectId: "trunfia-49fbc",
  storageBucket: "trunfia-49fbc.firebasestorage.app",
  messagingSenderId: "63717613771",
  appId: "1:63717613771:web:ed2b0c0b15d43b3b5bbb4e",
  databaseURL: "https://trunfia-49fbc-default-rtdb.firebaseio.com/",
  measurementId: "G-5XL061XMTB"
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Realtime Database
export const database = getDatabase(app);
export default app;