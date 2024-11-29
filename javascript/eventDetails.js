import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Firebase configuration (use your project's configuration)
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
const storage = getStorage(app);

// Get the event ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('eventId');
console.log('Complete URL:', window.location.href);
console.log("Event ID from URL:", eventId);

// Elements for displaying event details
const eventTitleElement = document.getElementById('event-title');
const eventDateElement = document.getElementById('event-date');
const eventDescriptionElement = document.getElementById('event-description');
const eventLocationElement = document.getElementById('event-location');
const eventHostElement = document.getElementById('event-host');
const eventImageElement = document.getElementById('event-image');
const loadingMessageElement = document.getElementById('loading-message');

// Fetch event details from Firestore
async function fetchEventDetails() {
    
    if (!eventId) {
        eventTitleElement.textContent = "Event Not Found";
        loadingMessageElement.style.display = 'none';
        return;
    }

    try {
        console.log("Fetching event with ID:", eventId);
        const eventDoc = await getDoc(doc(db, 'event', eventId));

        if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            console.log("Fetched event data:", eventData);
            
            // Populate the HTML with event data
            eventTitleElement.textContent = eventData.title || 'No Title';
            eventDateElement.textContent = `Date: ${new Date(eventData.date).toLocaleDateString() || 'Unknown Date'}`;
            eventDescriptionElement.textContent = eventData.description || 'No Description Available';
            eventLocationElement.textContent = `Location: ${eventData.location || 'Unknown Location'}`;
            eventHostElement.textContent = `Hosted by: ${eventData.host || 'Unknown Host'}`;

            // Fetch and display the event image (if available)
            if (eventData.imageUrl) {
                const storageRef = ref(storage, eventData.imageUrl);
                const imageUrl = await getDownloadURL(storageRef);
                eventImageElement.src = imageUrl;
                eventImageElement.style.display = 'block';
            }

        } else {
            eventTitleElement.textContent = "Event Not Found";
        }
    } catch (error) {
        console.error("Error fetching event details:", error);
        eventTitleElement.textContent = "Error loading event";
    }

    // Hide the loading message after data is loaded
    loadingMessageElement.style.display = 'none';
}

// Fetch event details on page load
fetchEventDetails();