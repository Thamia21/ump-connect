// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

// Get user data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const displayName = user.displayName;
        const email = user.email;

        if (displayName) {
            const [firstName, lastName] = displayName.split(' ');
            const userInitials = `${firstName[0].toUpperCase()}.${lastName[0].toUpperCase()}`;
            document.getElementById('userInitials').textContent = userInitials;
        }
        document.getElementById('email').textContent = email;

        // Retrieve and display user profile information
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();

            // Display data in the profile page
            document.getElementById('firstName').textContent = userData.firstName || 'N/A';
            document.getElementById('lastName').textContent = userData.lastName || 'N/A';
            document.getElementById('studentNumber').textContent = userData.studentNumber || 'N/A';
            document.getElementById('email').textContent = userData.email || 'N/A';
            document.getElementById('phoneNumber').textContent = userData.phoneNumber || 'N/A';

            // Format registration date
            const registrationDate = userData.registrationDate?.toDate();
            document.getElementById('registrationDate').textContent = registrationDate
                ? registrationDate.toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric"
                })
                : 'N/A';
        } else {
            console.error("No such user profile in Firestore!");
        }
    } else {
        // User is not logged in, redirect to login page or display error
        window.location.href = 'login.html';
    }
});

// Toggle password visibility
function togglePasswordVisibility(fieldId, toggleIconId) {
    const field = document.getElementById(fieldId);
    const toggleIcon = document.getElementById(toggleIconId);
    if (field && toggleIcon) {
        const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
        field.setAttribute('type', type);
        toggleIcon.classList.toggle('fa-eye-slash');
        toggleIcon.classList.toggle('fa-eye');
    }
}

document.getElementById('toggleCurrentPassword').addEventListener('click', () => {
    togglePasswordVisibility('currentPassword', 'toggleCurrentPassword');
});
document.getElementById('toggleNewPassword').addEventListener('click', () => {
    togglePasswordVisibility('newPassword', 'toggleNewPassword');
});

// Password update functionality
document.getElementById('updatePasswordForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const user = auth.currentUser;

    if (user && currentPassword && newPassword) {
        try {
            // Reauthenticate user with the current password
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update the user's password
            await updatePassword(user, newPassword);

            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Password updated',
                text: 'Your password has been successfully updated.',
            });

            // Clear form fields
            document.getElementById('updatePasswordForm').reset();
        } catch (error) {
            // Show error if reauthentication or password update fails
            Swal.fire({
                icon: 'error',
                title: 'Update failed',
                text: error.message,
            });
            console.error("Error updating password:", error);
        }
    } else {
        console.log("User is not authenticated or password fields are empty.");
    }
});
