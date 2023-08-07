import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBzomVHQnUAJbKjGT1_NikI2OLqmBBW-WY',
  authDomain: 'diallcloneproject.firebaseapp.com',
  projectId: 'diallcloneproject',
  storageBucket: 'diallcloneproject.appspot.com',
  messagingSenderId: '935505594048',
  appId: '1:935505594048:web:23d5eff9ab4706ff76cf25',
  measurementId: 'G-X3Z5EHYT1M',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
export { firebase };
