const functions = require("firebase-functions");

const express = require("express");
const app = express();

const admin = require("firebase-admin");
admin.initializeApp();

const firebaseConfig = {
  apiKey: "AIzaSyCSut1uxw5Waaz25B2XoGIVwYTNEe0PMx0",
  authDomain: "dev-connect-4ae59.firebaseapp.com",
  databaseURL: "https://dev-connect-4ae59.firebaseio.com",
  projectId: "dev-connect-4ae59",
  storageBucket: "dev-connect-4ae59.appspot.com",
  messagingSenderId: "564021749308",
  appId: "1:564021749308:web:680cc8ab72bbb4e1ecc539",
  measurementId: "G-ZRSX5PB5LS"
};

const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get("/screams", (req, res) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(screams);
    })
    .catch(err => console.error(err));
});

app.post("/scream", (req, res) => {
  if (req.method !== "POST") {
    return res.status(400).json({ error: "Method not allowed!" });
  }
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  db.collection("screams")
    .add(newScream)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "Something went wrong" });
      console.error(err);
    });
});

// Signup route
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  // Validate data
  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(IdToken => {
      token = IdToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      return db
        .doc(`/users/${newUser.handle}`)
        .set(userCredentials)
        .then(() => {
          return res.status(201).json({ token });
        });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email already in use" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

exports.api = functions.region("asia-east2").https.onRequest(app);
