import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; // Import serverTimestamp

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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Toggle Password Visibility
document.querySelectorAll('.toggle-password').forEach((toggle) => {
  toggle.addEventListener('click', function() {
    const passwordField = this.previousElementSibling;
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash');
    this.classList.toggle('fa-eye');
  });
});

// Real-time Password Validation
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordStrengthMessage = document.getElementById('passwordStrengthMessage');
const passwordMatchMessage = document.getElementById('passwordMatchMessage');

passwordInput.addEventListener('input', validatePasswordStrength);
confirmPasswordInput.addEventListener('input', validatePasswordMatch);

function validatePasswordStrength() {
  const password = passwordInput.value;
  let strengthMessage = '';

  if (password.length < 8) {
    strengthMessage = 'Password must be at least 8 characters long.';
  } else if (!/[A-Z]/.test(password)) {
    strengthMessage = 'Password must contain at least one uppercase letter.';
  } else if (!/[0-9]/.test(password)) {
    strengthMessage = 'Password must contain at least one number.';
  } else if (!/[!@#$%^&*]/.test(password)) {
    strengthMessage = 'Password must contain at least one special character.';
  } else {
    strengthMessage = '';
  }

  passwordStrengthMessage.textContent = strengthMessage;
}

function validatePasswordMatch() {
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  passwordMatchMessage.textContent = password === confirmPassword ? '' : 'Passwords do not match.';
}

// Handle Form Submission
document.getElementById('registrationForm').addEventListener('submit', function(event) {
  event.preventDefault();

  console.log("Form Submitted");
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (passwordStrengthMessage.textContent === '' && passwordMatchMessage.textContent === '') {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const studentNumber = document.getElementById('StudentNumber').value;
        const firstName = document.getElementById('FirstName').value;
        const lastName = document.getElementById('LastName').value;
        const phoneNumber = document.getElementById('phoneNumber').value;

        // Store user details in Firestore, including registrationDate
        return setDoc(doc(db, 'users', user.uid), {
          studentNumber,
          firstName,
          lastName,
          phoneNumber,
          email,
          registrationDate: serverTimestamp() // Set current timestamp
        });
      })
      .then(() => {
        // Show SweetAlert success notification
        Swal.fire({
          icon: 'success',
          title: 'Registration successful!',
          text: 'You have been successfully registered.',
        }).then(() => {
          window.location.href = 'login.html'; // Redirect after success
        });
      })
      .catch((error) => {
        if (error.code === 'auth/email-already-in-use') {
          // Show SweetAlert error for already registered email
          Swal.fire({
            icon: 'error',
            title: 'Email already in use',
            text: 'This email is already registered. Please use a different email or log in.',
          });
        } else {
          // Show SweetAlert for other registration errors
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
          });
        }
        console.error('Error registering:', error.message);
      });
  }
});
