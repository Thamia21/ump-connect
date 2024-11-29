import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Handle form submission
const registerForm = document.getElementById('registerForm');
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('full-name').value;
    const surname = document.getElementById('surname').value;
    const email = document.getElementById('email').value;
    const staffNumber = document.getElementById('staff-number').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Ensure password and confirm password match
    if (password !== confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Password Mismatch',
            text: 'Passwords do not match!',
        });
        return;
    }

    // Check if the email is from the university domain
    if (!email.endsWith('@ump.ac.za')) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Email',
            text: 'Please use your university email (@ump.ac.za) to register as an admin.',
        });
        return;
    }

    try {
        // Show loading state
        Swal.fire({
            title: 'Registering...',
            text: 'Please wait while we create your account.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Register the admin in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send verification email
        await sendEmailVerification(user);

        // Store admin data in Firestore
        await setDoc(doc(db, 'admins', user.uid), {
            fullName: fullName,
            surname: surname,
            email: email,
            staffNumber: staffNumber,
            isAdmin: true,
            emailVerified: false, // This will be updated when they verify their email
            registrationDate: new Date(), // Add registration date
            status: 'active' // Set initial status
        });

        // Sign out the user
        await auth.signOut();

        Swal.fire({
            icon: 'success',
            title: 'Registration Successful',
            text: 'A verification email has been sent to your email address. Please verify your email before logging in.',
            confirmButtonText: 'OK'
        }).then(() => {
            window.location.href = 'adminLogin.html';
        });
    } catch (error) {
        console.error('Registration error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Registration Failed',
            text: error.message || 'Error registering admin. Please try again.',
        });
    }
});

// Show/Hide password toggle function
window.togglePassword = function togglePassword() {
    const passwordField = document.getElementById("password");
    const confirmPasswordField = document.getElementById("confirm-password");
    if (passwordField.type === "password") {
        passwordField.type = "text";
        confirmPasswordField.type = "text";
    } else {
        passwordField.type = "password";
        confirmPasswordField.type = "password";
    }
};
