// Import Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

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

// Form elements
const form = document.getElementById('signupForm');
const displayNameInput = document.getElementById('displayName');
const surnameInput = document.getElementById('surname');
const staffNumberInput = document.getElementById('staff-number');
const emailInput = document.getElementById('email');
const confirmEmailInput = document.getElementById('confirm-email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const messageBox = document.getElementById('signupMessage');

// Password requirement elements
const lengthCheck = document.getElementById('length-check');
const letterCheck = document.getElementById('letter-check');
const numberCheck = document.getElementById('number-check');

// Password toggle buttons
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    });
});

// Password validation function
function validatePassword(password) {
    const hasLength = password.length >= 8;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);

    lengthCheck.querySelector('i').className = hasLength ? 'fas fa-check' : 'fas fa-times';
    letterCheck.querySelector('i').className = hasLetter ? 'fas fa-check' : 'fas fa-times';
    numberCheck.querySelector('i').className = hasNumber ? 'fas fa-check' : 'fas fa-times';

    return hasLength && hasLetter && hasNumber;
}

// Real-time password validation
passwordInput.addEventListener('input', () => {
    validatePassword(passwordInput.value);
});

// Show error message
function showError(message) {
    messageBox.className = 'message-box error';
    messageBox.textContent = message;
}

// Show success message
function showSuccess(message) {
    messageBox.className = 'message-box success';
    messageBox.textContent = message;
}

// Form validation
function validateForm() {
    // Reset error messages
    document.querySelectorAll('.error-message').forEach(error => error.textContent = '');
    
    let isValid = true;

    // Validate display name
    if (!displayNameInput.value.trim()) {
        document.getElementById('displayName-error').textContent = 'First name is required';
        isValid = false;
    } else if (!/^[A-Za-z\s]+$/.test(displayNameInput.value.trim())) {
        document.getElementById('displayName-error').textContent = 'First name should only contain letters';
        isValid = false;
    }

    // Validate surname
    if (!surnameInput.value.trim()) {
        document.getElementById('surname-error').textContent = 'Last name is required';
        isValid = false;
    } else if (!/^[A-Za-z\s]+$/.test(surnameInput.value.trim())) {
        document.getElementById('surname-error').textContent = 'Last name should only contain letters';
        isValid = false;
    }

    // Validate staff number
    if (!staffNumberInput.value.trim()) {
        document.getElementById('staff-number-error').textContent = 'Staff number is required';
        isValid = false;
    }

    // Validate email
    if (!emailInput.value.trim()) {
        document.getElementById('email-error').textContent = 'Email is required';
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
        document.getElementById('email-error').textContent = 'Please enter a valid email address';
        isValid = false;
    }

    // Validate confirm email
    if (emailInput.value.trim() !== confirmEmailInput.value.trim()) {
        document.getElementById('confirm-email-error').textContent = 'Emails do not match';
        isValid = false;
    }

    // Validate password
    if (!validatePassword(passwordInput.value)) {
        document.getElementById('password-error').textContent = 'Password does not meet requirements';
        isValid = false;
    }

    // Validate confirm password
    if (passwordInput.value !== confirmPasswordInput.value) {
        document.getElementById('confirm-password-error').textContent = 'Passwords do not match';
        isValid = false;
    }

    return isValid;
}

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            emailInput.value.trim(), 
            passwordInput.value
        );

        // Update display name
        await updateProfile(userCredential.user, {
            displayName: `${displayNameInput.value.trim()} ${surnameInput.value.trim()}`
        });

        // Store additional user data in Firestore
        await setDoc(doc(db, "event-manager", userCredential.user.uid), {
            firstName: displayNameInput.value.trim(),
            lastName: surnameInput.value.trim(),
            staffNumber: staffNumberInput.value.trim(),
            email: emailInput.value.trim(),
            role: 'manager',
            createdAt: new Date().toISOString()
        });

        showSuccess('Registration successful! Redirecting to login...');
        
        // Redirect to login page after successful registration
        setTimeout(() => {
            window.location.href = 'managerLogin.html';
        }, 2000);

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific Firebase errors
        switch (error.code) {
            case 'auth/email-already-in-use':
                showError('This email is already registered. Please use a different email or try logging in.');
                break;
            case 'auth/invalid-email':
                showError('Please enter a valid email address.');
                break;
            case 'auth/operation-not-allowed':
                showError('Email/password accounts are not enabled. Please contact support.');
                break;
            case 'auth/weak-password':
                showError('Please choose a stronger password.');
                break;
            default:
                showError('An error occurred during registration. Please try again.');
        }
    }
});