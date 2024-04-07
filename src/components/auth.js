import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

const config = {
  apiKey: "AIzaSyBkmJZ30iTHoQ3rndQNYvWGvm8oFJfy6AU",
  authDomain: "stalkstock-5f4ec.firebaseapp.com",
  projectId: "stalkstock-5f4ec",
  storageBucket: "stalkstock-5f4ec.appspot.com",
  messagingSenderId: "535045044490",
  appId: "1:535045044490:web:bde1c30c50b15ba2c6a2f3",
  measurementId: "G-01XJ868KH7"
};

firebase.initializeApp(config);

export const googleProvider = new firebase.auth.GoogleAuthProvider();
export const firebaseAuth = firebase.auth;
export const db = firebase.firestore();

export function loginWithGoogle() {
    return firebaseAuth().signInWithRedirect(googleProvider);
}

export function auth(email, pw) {
    console.log("hello");
    let username = localStorage.getItem("user");
    return firebaseAuth()
        .createUserWithEmailAndPassword(email, pw)
        .then(function(newUser) {
            db.collection("users")
                .doc(newUser.user.uid)
                .set({
                    email,
                    username,
                    funds: "100000",
                    currentfunds: "100000",
                    positions: "0",
                    admin: false,
                    watchlist: [],
                })
                .catch(function(error) {
                    console.error("Error writing document: ", error);
                });
            return firebase.auth().currentUser.updateProfile({
                displayName: username,
            });
        });
}

export function logout() {
    return firebaseAuth().signOut();
}

export function login(email, pw) {
    return firebaseAuth().signInWithEmailAndPassword(email, pw);
}

export function resetPassword(email) {
    return firebaseAuth().sendPasswordResetEmail(email);
}