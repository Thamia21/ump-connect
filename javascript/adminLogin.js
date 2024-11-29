  // Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Handle login form submission
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

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

        // Attempt to sign in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if email is verified
        if (!user.emailVerified) {
            await auth.signOut(); // Sign out immediately if email is not verified
            
            const result = await Swal.fire({
                icon: 'error',
                title: 'Email Not Verified',
                text: 'You must verify your email before logging in. Would you like us to send a new verification email?',
                showCancelButton: true,
                confirmButtonText: 'Send Verification Email',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33'
            });

            if (result.isConfirmed) {
                try {
                    await sendEmailVerification(user);
                    await Swal.fire({
                        icon: 'success',
                        title: 'Verification Email Sent',
                        text: 'Please check your email and click the verification link before trying to log in again.',
                        confirmButtonText: 'OK'
                    });
                } catch (error) {
                    console.error('Error sending verification email:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to send verification email. Please try again later.'
                    });
                }
            }
            return;
        }

        // Check if the user is an admin
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (!adminDoc.exists()) {
            await auth.signOut();
            throw new Error('Access denied. This account is not registered as an admin.');
        }

        const adminData = adminDoc.data();
        if (!adminData.isAdmin) {
            await auth.signOut();
            throw new Error('Access denied. This account does not have admin privileges.');
        }

        // Check if admin is blocked
        if (adminData.status === "Blocked") {
            await auth.signOut();
            throw new Error('Your admin account has been blocked. Please contact the system administrator.');
        }

        // Store user ID in session storage
        sessionStorage.setItem('userId', user.uid);

        // Successful login
        await Swal.fire({
            icon: 'success',
            title: 'Welcome Back!',
            text: 'Login successful',
            timer: 1500,
            showConfirmButton: false
        });

        // Redirect to dashboard
        window.location.href = 'adminDashboard.html';

    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Invalid email or password.';
        
        if (error.message.includes('Access denied')) {
            errorMessage = error.message;
        } else if (error.message.includes('blocked')) {
            errorMessage = error.message;
        } else if (error.code === 'auth/invalid-credential') {
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

// Handle forgot password
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
forgotPasswordLink.addEventListener('click', async () => {
    const { value: email } = await Swal.fire({
        title: 'Reset Password',
        input: 'email',
        inputLabel: 'Enter your UMP email address',
        inputPlaceholder: 'email@ump.ac.za',
        showCancelButton: true,
        validationMessage: 'Please enter a valid UMP email address',
        inputValidator: (value) => {
            if (!value) {
                return 'Please enter your email address';
            }
            if (!value.endsWith('@ump.ac.za')) {
                return 'Please use your UMP email address';
            }
        }
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
});

// Show/Hide password toggle function
document.getElementById('show-password').addEventListener('change', function() {
    const passwordField = document.getElementById('password');
    passwordField.type = this.checked ? 'text' : 'password';
});