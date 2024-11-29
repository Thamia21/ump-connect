// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Firebase configuration
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

// Password visibility toggle
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);
        const icon = this.querySelector('i');
        
        // Toggle password visibility
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    });
});

// Handle login form submission
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginMessage = document.getElementById('loginMessage');

    try {
        // Show loading state
        Swal.fire({
            title: 'Logging in...',
            text: 'Please wait',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Successful login
        await Swal.fire({
            icon: 'success',
            title: 'Login Successful',
            text: 'Welcome back!',
            timer: 1500,
            showConfirmButton: false
        });

        // Redirect to events form
        window.location.href = 'managerEventsForm.html';

    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Invalid email or password.';
        
        if (error.code === 'auth/invalid-credential') {
            errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed login attempts. Please try again later.';
        }

        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: errorMessage
        });
    }
});

// Handle password reset
window.resetPassword = async function() {
    const { value: email } = await Swal.fire({
        title: 'Reset Password',
        input: 'email',
        inputLabel: 'Enter your email address',
        inputPlaceholder: 'email@ump.ac.za',
        showCancelButton: true,
        validationMessage: 'Please enter a valid email address'
    });

    if (email) {
        try {
            await sendPasswordResetEmail(auth, email);
            await Swal.fire({
                icon: 'success',
                title: 'Reset Email Sent',
                text: 'Please check your email for password reset instructions.'
            });
        } catch (error) {
            console.error('Password reset error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to send reset email. Please try again.'
            });
        }
    }
};