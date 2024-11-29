// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    getDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDRo0-7uMM7wvNC5zGF3nXTbjJgw56YBeE",
    authDomain: "admin-form-72be8.firebaseapp.com",
    projectId: "admin-form-72be8",
    storageBucket: "admin-form-72be8.appspot.com",
    messagingSenderId: "955286780881",
    appId: "1:955286780881:web:b6c93cecf4f727774ebef0"
};

console.log('Initializing Firebase...'); // Debug log

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

console.log('Firebase initialized successfully'); // Debug log

// DOM Elements
const loadingSpinner = document.getElementById('loading-spinner');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const eventsList = document.getElementById('events-list');

// Global state
let currentEvents = [];

// Show/hide loading spinner
const toggleLoading = (show) => {
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
        console.log(`Loading spinner ${show ? 'shown' : 'hidden'}`); // Fixed template literal syntax
    }
};

// Error handler
const handleError = (error, customMessage = 'An error occurred') => {
    console.error('Error details:', error); // Debug log
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: customMessage,
        footer: error.message
    });
};

// Get image URL with error handling
async function getImageUrl(imagePath) {
    console.log('Getting image URL for:', imagePath); // Debug log
    try {
        if (!imagePath) return '../assets/placeholder-image.jpg';
        const imageRef = ref(storage, imagePath);
        const url = await getDownloadURL(imageRef);
        console.log('Image URL retrieved:', url); // Debug log
        return url;
    } catch (error) {
        console.error('Error getting image URL:', error);
        return '../assets/placeholder-image.jpg';
    }
}

// Get manager details
async function getManagerDetails(managerId) {
    try {
        if (!managerId) {
            console.log('No managerId provided');
            return 'Unknown Manager';
        }
        
        console.log('Fetching manager details for ID:', managerId);
        
        // Get manager document from event-manager collection
        const managerDoc = await getDoc(doc(db, 'event-manager', managerId));
        
        if (managerDoc.exists()) {
            const managerData = managerDoc.data();
            console.log('Manager data retrieved:', managerData);
            
            // Check the exact field names in the document
            console.log('Available fields:', Object.keys(managerData));
            
            // Try different possible field names
            const name = managerData.name || managerData.firstName || managerData.Name || '';
            const surname = managerData.surname || managerData.lastName || managerData.Surname || '';
            
            console.log('Extracted name:', name);
            console.log('Extracted surname:', surname);
            
            if (name && surname) {
                const fullName = `${name} ${surname}`;
                console.log('Returning full name:', fullName);
                return fullName;
            } else if (name) {
                console.log('Returning only name:', name);
                return name;
            } else if (surname) {
                console.log('Returning only surname:', surname);
                return surname;
            }
        } else {
            console.log('No manager document found for ID:', managerId);
        }
        
        return 'Unknown Manager';
    } catch (error) {
        console.error('Error fetching manager details:', error);
        return 'Unknown Manager';
    }
}

// Format date helper
function formatDate(date) {
    if (!date) return 'N/A';
    try {
        return new Date(date).toLocaleDateString('en-GB', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

// Load events
async function loadEvents() {
    console.log('Starting to load events...'); // Debug log
    toggleLoading(true);
    
    try {
        console.log('Getting events collection reference...'); // Debug log
        const eventsRef = collection(db, 'event');
        
        console.log('Fetching events from Firestore...'); // Debug log
        const querySnapshot = await getDocs(eventsRef);
        console.log('Events fetched:', querySnapshot.size, 'documents'); // Debug log
        
        if (querySnapshot.empty) {
            console.log('No events found in database'); // Debug log
            const tbody = eventsList.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" class="no-events">No events available</td></tr>';
            }
            return;
        }

        const events = [];
        console.log('Processing events...'); // Debug log
        
        for (const doc of querySnapshot.docs) {
            const event = doc.data();
            console.log('Processing event:', event.title); // Debug log
            const imageUrl = await getImageUrl(event.imageUrl);
            
            // Get manager name
            const managerName = await getManagerDetails(event.createdBy);
            
            events.push({
                id: doc.id,
                ...event,
                imageUrl,
                managerName,
                status: event.status || 'pending' // Ensure status is set
            });
        }
        
        console.log('Events processed successfully:', events.length, 'events'); // Debug log
        currentEvents = events; // Store events in global state
        filterAndRenderEvents();

    } catch (error) {
        console.error('Error in loadEvents:', error);
        handleError(error, 'Error loading events');
        const tbody = eventsList.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="error-message">Error loading events. Please try again.</td></tr>';
        }
    } finally {
        toggleLoading(false);
    }
}

// Filter and render events based on search and status
function filterAndRenderEvents() {
    console.log('Filtering events...'); // Debug log
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : 'all';
    
    console.log('Search term:', searchTerm, 'Status:', statusValue); // Debug log
    console.log('Total events before filtering:', currentEvents.length); // Debug log
    
    const filteredEvents = currentEvents.filter(event => {
        const title = (event.title || '').toLowerCase();
        const description = (event.description || '').toLowerCase();
        const matchesSearch = title.includes(searchTerm) || 
                            description.includes(searchTerm);
        const matchesStatus = statusValue === 'all' || event.status === statusValue;
        return matchesSearch && matchesStatus;
    });
    
    console.log('Filtered events count:', filteredEvents.length); // Debug log

    const tbody = eventsList.querySelector('tbody');
    if (!tbody) return;

    if (filteredEvents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No matching events found</td></tr>';
        return;
    }
    
    renderEvents(filteredEvents);
}

// Render events to table
function renderEvents(events) {
    const tbody = eventsList.querySelector('tbody');
    if (!tbody) return;

    if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No events available</td></tr>';
        return;
    }

    console.log('Building table HTML...'); // Debug log
    tbody.innerHTML = events.map(event => `
        <tr>
            <td>${event.managerName || 'N/A'}</td>
            <td>
                <img src="${event.imageUrl}" 
                    alt="${event.title}" 
                    class="event-image" 
                    onclick="openModal('${event.imageUrl}')" 
                    onerror="this.src='../assets/placeholder-image.jpg'"
                    style="max-width: 100px; height: auto;">
            </td>
            <td>${event.title || 'N/A'}</td>
            <td>${event.location || 'N/A'}</td>
            <td>${formatDate(event.createdAt)}</td>
            <td>${formatDate(event.date)}</td>
            <td>
                <span class="status-badge ${(event.status || 'pending').toLowerCase()}">
                    ${event.status || 'Pending'}
                </span>
            </td>
            <td>
                <button class="approve-button" onclick="approveEvent('${event.id}')" title="Approve">
                    <i class="fas fa-check"></i>
                </button>
                <button class="reject-button" onclick="rejectEvent('${event.id}')" title="Reject">
                    <i class="fas fa-times"></i>
                </button>
                <button class="delete-button" onclick="deleteEvent('${event.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    console.log('Table HTML built and inserted'); // Debug log
}

// Event actions
window.approveEvent = async (eventId) => {
    try {
        const eventRef = doc(db, 'event', eventId);
        await updateDoc(eventRef, {
            status: 'approved'
        });
        Swal.fire('Success', 'Event approved successfully', 'success');
        loadEvents();
    } catch (error) {
        handleError(error, 'Error approving event');
    }
};

window.rejectEvent = async (eventId) => {
    try {
        const { value: reason } = await Swal.fire({
            title: 'Reject Event',
            input: 'textarea',
            inputLabel: 'Reason for rejection',
            inputPlaceholder: 'Enter the reason for rejection...',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'Please enter a reason for rejection';
                }
            }
        });

        if (reason) {
            const eventRef = doc(db, 'event', eventId);
            await updateDoc(eventRef, {
                status: 'rejected',
                rejectionReason: reason
            });
            Swal.fire('Success', 'Event rejected successfully', 'success');
            loadEvents();
        }
    } catch (error) {
        handleError(error, 'Error rejecting event');
    }
};

window.deleteEvent = async (eventId) => {
    try {
        const result = await Swal.fire({
            title: 'Delete Event?',
            text: 'This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            const eventRef = doc(db, 'event', eventId);
            await deleteDoc(eventRef);
            Swal.fire('Deleted!', 'Event has been deleted.', 'success');
            loadEvents();
        }
    } catch (error) {
        handleError(error, 'Error deleting event');
    }
};

// Modal functions
window.openModal = (imageSrc) => {
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modalImage');
    if (modal && modalImg) {
        modal.style.display = 'block';
        modalImg.src = imageSrc;
    }
};

window.closeModal = () => {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Add event notification counter
async function updateEventNotificationCounter() {
    try {
        const eventsRef = collection(db, "event");
        const q = query(eventsRef, where("status", "==", "pending"));
        
        // Real-time listener for pending events
        onSnapshot(q, (snapshot) => {
            const pendingCount = snapshot.docs.length;
            
            if (pendingCount > 0) {
                // Show notification
                Swal.fire({
                    title: 'Pending Events',
                    text: `You have ${pendingCount} event${pendingCount > 1 ? 's' : ''} waiting for review.`,
                    icon: 'info',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
        });
    } catch (error) {
        console.error("Error setting up notification counter:", error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded'); // Debug log
    
    // Initialize search and filter listeners
    if (searchInput) {
        console.log('Setting up search input listener'); // Debug log
        searchInput.addEventListener('input', filterAndRenderEvents);
    } else {
        console.warn('Search input element not found'); // Debug log
    }
    
    if (statusFilter) {
        console.log('Setting up status filter listener'); // Debug log
        statusFilter.addEventListener('change', filterAndRenderEvents);
    } else {
        console.warn('Status filter element not found'); // Debug log
    }
    
    // Initialize modal close functionality
    const modal = document.getElementById('imageModal');
    const closeBtn = document.getElementsByClassName('close')[0];
    
    if (modal && closeBtn) {
        closeBtn.onclick = closeModal;
    }
});

// Check authentication and load events only once
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? 'User logged in' : 'No user'); // Debug log
    if (!user) {
        window.location.href = 'adminLogin.html';
        return;
    }
    loadEvents(); // Load events only if user is authenticated
    updateEventNotificationCounter(); // Add notification counter
});