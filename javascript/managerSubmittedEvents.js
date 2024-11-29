// Import Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

// DOM Elements
const eventList = document.getElementById('event-list');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');

let allEvents = [];

// Load events for the current user
function loadEvents() {
    const eventsRef = collection(db, 'event'); // Changed from 'events' to 'event'
    
    // Get the current user's ID from session storage
    const currentUserId = sessionStorage.getItem('userId');
    
    console.log('Current User ID:', currentUserId); // Debug log
    
    if (!currentUserId) {
        console.log('No user ID found in session storage');
        return;
    }

    const q = query(eventsRef, where("createdBy", "==", currentUserId));
    console.log('Querying events for user:', currentUserId); // Debug log

    // Real-time listener for events
    onSnapshot(q, (snapshot) => {
        console.log('Snapshot size:', snapshot.size); // Debug log
        console.log('Snapshot empty:', snapshot.empty); // Debug log
        
        allEvents = [];
        snapshot.forEach((doc) => {
            console.log('Event data:', doc.data()); // Debug log
            allEvents.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('All events:', allEvents); // Debug log
        filterAndDisplayEvents();
    }, (error) => {
        console.error('Error fetching events:', error);
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="error-message">Error loading events. Please try again.</td>';
        eventList.innerHTML = '';
        eventList.appendChild(row);
    });
}

// Filter and display events based on search and status filter
function filterAndDisplayEvents() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;

    console.log('Filtering events...'); // Debug log
    console.log('Search term:', searchTerm); // Debug log
    console.log('Status filter:', statusValue); // Debug log

    const filteredEvents = allEvents.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm);
        const matchesStatus = statusValue === 'all' || event.status === statusValue;
        return matchesSearch && matchesStatus;
    });

    console.log('Filtered events:', filteredEvents); // Debug log
    renderEvents(filteredEvents);
}

// Format date helper function
function formatDate(dateString) {
    if (!dateString) return 'No date';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Render events in the table
function renderEvents(events) {
    eventList.innerHTML = '';

    if (events.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="no-events">No events found.</td>';
        eventList.appendChild(row);
        return;
    }

    events.forEach(event => {
        console.log('Event data:', event); // Debug log
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${event.title || 'No title'}</td>
            <td>${formatDate(event.date) || 'No date'}</td>
            <td>${event.location || 'No location'}</td>
            <td><span class="status-badge ${event.status || 'pending'}">${event.status || 'pending'}</span></td>
            <td>
                ${event.imageUrl ? `<img src="${event.imageUrl}" alt="Event" class="event-image">` : 'No image'}
            </td>
            <td>
                <div class="event-reactions">
                    <div class="reaction-item">
                        <i class="fas fa-thumbs-up"></i>
                        <span>${(event.likes || []).length}</span>
                    </div>
                    <div class="reaction-item">
                        <i class="fas fa-heart"></i>
                        <span>${(event.hearts || []).length}</span>
                    </div>
                    <div class="reaction-item">
                        <i class="fas fa-star"></i>
                        <span>${(event.celebrates || []).length}</span>
                    </div>
                </div>
            </td>
        `;
        eventList.appendChild(row);
    });
}

// Event listeners for search and filter
searchInput.addEventListener('input', filterAndDisplayEvents);
statusFilter.addEventListener('change', filterAndDisplayEvents);

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, checking auth...');
    // Check for user ID in session storage and load events
    const userId = sessionStorage.getItem('userId');
    console.log('Initial user ID from session:', userId);

    if (userId) {
        console.log('Loading events for user:', userId);
        loadEvents();
    } else {
        // If no user ID in session storage, check auth state
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('User authenticated:', user.uid);
                sessionStorage.setItem('userId', user.uid);
                loadEvents();
            } else {
                console.log('No authenticated user found');
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="6" class="error-message">Please log in to view your events.</td>';
                eventList.innerHTML = '';
                eventList.appendChild(row);
            }
        });
    }
});
