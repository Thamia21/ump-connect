import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, reauthenticateWithCredential, EmailAuthProvider, updatePassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
const storage = getStorage(app);

let currentUserId = null;

// Password validation patterns
const passwordPatterns = {
    length: /.{8,}/,
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*(),.?":{}|<>]/
};

// Populate profile data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        try {
            const userDoc = await getDoc(doc(db, 'admins', user.uid));
            if (userDoc.exists()) {
                const adminData = userDoc.data();
                document.getElementById('full-name').value = adminData.fullName || '';
                document.getElementById('surname').value = adminData.surname || '';
                document.getElementById('email').value = adminData.email || '';
                document.getElementById('staff-number').value = adminData.staffNumber || '';
                
                // Load profile picture if exists
                const profilePicture = document.getElementById('profile-picture');
                if (adminData.profilePicture) {
                    console.log('Profile picture URL:', adminData.profilePicture);
                    profilePicture.src = adminData.profilePicture;
                }
                // Default profile picture is already set in HTML
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load profile data. Please refresh the page.',
            });
        }
    } else {
        window.location.href = 'adminLogin.html';
    }
});

// Handle profile picture upload
document.getElementById('picture-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid File Type',
            text: 'Please upload an image file.',
        });
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        Swal.fire({
            icon: 'error',
            title: 'File Too Large',
            text: 'Please upload an image smaller than 5MB.',
        });
        return;
    }

    try {
        // Show loading state
        Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while we upload your profile picture.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Create a unique filename using timestamp
        const timestamp = new Date().getTime();
        const fileName = `${currentUserId}_${timestamp}`;
        const storageRef = ref(storage, `profile-pictures/${fileName}`);
        
        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);
        console.log('File uploaded successfully');
        
        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('Download URL:', downloadURL);

        // Update profile picture in UI
        const profilePicture = document.getElementById('profile-picture');
        profilePicture.src = downloadURL;

        // Update profile picture URL in Firestore
        await updateDoc(doc(db, 'admins', currentUserId), {
            profilePicture: downloadURL,
            lastUpdated: new Date().toISOString()
        });

        Swal.fire({
            icon: 'success',
            title: 'Profile Picture Updated',
            text: 'Your profile picture has been updated successfully!',
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: error.message || 'Failed to upload profile picture. Please try again.',
        });
    }
});

// Handle profile update
const profileForm = document.getElementById('profileForm');
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('full-name').value.trim();
    const surname = document.getElementById('surname').value.trim();

    if (!fullName || !surname) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please fill in all required fields.',
        });
        return;
    }

    try {
        if (currentUserId) {
            await updateDoc(doc(db, 'admins', currentUserId), {
                fullName: fullName,
                surname: surname
            });

            Swal.fire({
                icon: 'success',
                title: 'Profile Updated',
                text: 'Your profile has been updated successfully!',
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Profile Update Failed',
            text: error.message,
        });
    }
});

// Password visibility toggle
document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        const input = e.target.parentElement.querySelector('input');
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        e.target.classList.toggle('fa-eye');
        e.target.classList.toggle('fa-eye-slash');
    });
});

// Password validation
const newPasswordInput = document.getElementById('new-password');
newPasswordInput.addEventListener('input', validatePassword);

function validatePassword() {
    const password = newPasswordInput.value;
    
    // Check each requirement
    Object.entries(passwordPatterns).forEach(([requirement, pattern]) => {
        const li = document.getElementById(requirement);
        if (pattern.test(password)) {
            li.classList.add('valid');
        } else {
            li.classList.remove('valid');
        }
    });
}

// Handle password update
const passwordForm = document.getElementById('passwordForm');
passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;

    // Validate password requirements
    const isValidPassword = Object.values(passwordPatterns).every(pattern => 
        pattern.test(newPassword)
    );

    if (!isValidPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Password',
            text: 'Please ensure your password meets all requirements.',
        });
        return;
    }

    if (newPassword !== confirmNewPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Password Mismatch',
            text: 'New passwords do not match!',
        });
        return;
    }

    try {
        const user = auth.currentUser;
        if (user) {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            // Clear password fields
            passwordForm.reset();
            
            Swal.fire({
                icon: 'success',
                title: 'Password Updated',
                text: 'Your password has been updated successfully!',
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Password Update Failed',
            text: error.message,
        });
    }
});

// Handle logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'adminLogin.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

// Inactivity timeout logic
let inactivityTimeout;
const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes in milliseconds

function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(logOutOnInactivity, INACTIVITY_LIMIT);
}

async function logOutOnInactivity() {
    try {
        await signOut(auth);
        Swal.fire({
            icon: 'info',
            title: 'Session Expired',
            text: 'You have been logged out due to inactivity.',
            allowOutsideClick: false
        }).then(() => {
            window.location.href = 'adminLogin.html';
        });
    } catch (error) {
        console.error('Error logging out due to inactivity:', error);
    }
}

// Event listeners for activity
['mousemove', 'click', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, resetInactivityTimer);
});

// Initialize inactivity timer
window.addEventListener('load', resetInactivityTimer);