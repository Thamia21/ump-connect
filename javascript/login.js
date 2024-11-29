import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRo0-7uMM7wvNC5zGF3nXTbjJgw56YBeE",
  authDomain: "admin-form-72be8.firebaseapp.com",
  projectId: "admin-form-72be8",
  storageBucket: "admin-form-72be8.appspot.com",
  messagingSenderId: "955286780881",
  appId: "1:955286780881:web:b6c93cecf4f727774ebef0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const togglePassword = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  const passwordIcon = document.getElementById('password-icon');

  // Toggle password visibility
  togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Toggle between eye and eye-slash icons
    if (type === 'password') {
      passwordIcon.classList.remove('fa-eye-slash');
      passwordIcon.classList.add('fa-eye');
    } else {
      passwordIcon.classList.remove('fa-eye');
      passwordIcon.classList.add('fa-eye-slash');
    }
  });

  const submitButton = document.getElementById("submit");
  const resetButton = document.getElementById("reset");

  submitButton.addEventListener("click", function(event) {
    event.preventDefault(); // Prevents page from refreshing every time the submit button is clicked

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please enter both email and password.',
      });
      return; // Exit the function if validation fails
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Check user status in Firestore
        const userRef = doc(db, "users", userCredential.user.uid);
        return getDoc(userRef).then((docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.status === "Blocked") {
              // Sign out the user if they are blocked
              auth.signOut();
              throw new Error("Account is blocked");
            }
            // User is not blocked, proceed with login
            console.log("Login successful", userCredential);
            Swal.fire({
              icon: 'success',
              title: 'Login Successful',
              text: 'Redirecting to the home screen...',
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              window.location.href = "events.html";
            });
          } else {
            throw new Error("User data not found");
          }
        });
      })
      .catch((error) => {
        console.error("Login error", error);
        let errorMessage = 'Incorrect login details';
        
        if (error.message === "Account is blocked") {
          errorMessage = 'Your account has been blocked. Please contact the administrator.';
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: errorMessage,
        });
      });
  });

  resetButton.addEventListener("click", function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;

    if (!email) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please enter your email.',
      });
      return; // Exit the function if validation fails
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        // Password reset email sent!
        console.log("Password reset email sent to", email);
        Swal.fire({
          icon: 'success',
          title: 'Email Sent',
          text: 'Password reset email has been sent to your inbox.',
        });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Password reset error", errorCode, errorMessage);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
        });
      });
  });
});