import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Check authentication and store user ID
onAuthStateChanged(auth, (user) => {
    if (user) {
        sessionStorage.setItem('userId', user.uid);
    }
});

// Elements
const eventForm = document.getElementById('managerEventForm');
const submitButton = document.getElementById('submit-btn');

// Handle form submission
eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = sessionStorage.getItem('userId');
    if (!userId) {
        Swal.fire('Error', 'Please log in to submit events', 'error');
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
        // Get form data
        const title = document.getElementById('event-title').value;
        const date = document.getElementById('date').value;
        const location = document.getElementById('event-location').value;
        const rsvpUrl = document.getElementById('event-rsvp-url').value;
        const imageFile = document.getElementById('event-image').files[0];

        // Upload image
        const imageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(imageRef, imageFile);
        const imageUrl = await getDownloadURL(uploadResult.ref);

        // Create event data
        const eventData = {
            title: title,
            date: date,
            location: location,
            rsvpUrl: rsvpUrl,
            imageUrl: imageUrl,
            status: 'pending',
            createdAt: new Date().toISOString(),
            createdBy: userId,
            managerEmail: auth.currentUser?.email || ''
        };

        // Save to Firestore
        await addDoc(collection(db, 'event'), eventData);

        // Show success message and redirect
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Event has been submitted for approval',
            timer: 2000
        }).then(() => {
            // Redirect to the submitted events page
            window.location.href = 'managerSubmittedEvents.html';
        });

        // Reset form
        eventForm.reset();
        document.getElementById('image-preview').style.display = 'none';

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to submit event. Please try again.'
        });
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Event';
    }
});

// Image preview
document.getElementById('event-image').addEventListener('change', function(e) {
    const preview = document.getElementById('image-preview');
    const file = e.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Inactivity timeout logic
let inactivityTimeout;
const INACTIVITY_LIMIT = 15 * 60 * 1000; // 30 minutes in milliseconds

// Function to reset the inactivity timer
function resetInactivityTimer() {
    clearTimeout(inactivityTimeout); // Clear previous timeout
    inactivityTimeout = setTimeout(logOutOnInactivity, INACTIVITY_LIMIT); // Set a new timeout
}

// Function to log out the user after inactivity
async function logOutOnInactivity() {
    try {
        await signOut(auth); // Logs the user out
        console.log('User has been logged out due to inactivity');
        // Optionally, redirect to login page
        window.location.href = 'managerLogin.html';// or another appropriate URL
    } catch (error) {
        console.error('Error logging out due to inactivity: ', error);
    }
}

// Event listeners to reset the timer on user activity
window.addEventListener('mousemove', resetInactivityTimer);
window.addEventListener('click', resetInactivityTimer);
window.addEventListener('keypress', resetInactivityTimer);

// Start the timer on page load
window.onload = resetInactivityTimer;
