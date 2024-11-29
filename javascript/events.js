// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
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
const storage = getStorage(app);
const auth = getAuth(app);

// HTML elements
const eventsList = document.getElementById('events-list');
const profileInitialsElement = document.getElementById('profileInitials');

// Function to extract initials from the user's name
function getInitials(firstName, lastName) {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
}

// Function to update the profile with initials

async function updateProfile() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // Get user data from Firestore
                let userDoc = await getDoc(doc(db, "users", user.uid));
                let userData = userDoc.data();

                // If no data found in the "users" collection, check the "admins" collection
                if (!userData) {
                    userDoc = await getDoc(doc(db, "admins", user.uid));
                    userData = userDoc.data();
                }

                const firstName = userData?.firstName || 'Guest';
                const lastName = userData?.lastName || '';
                const fullName = `${firstName} ${lastName}`;

                // Update the welcome message with the user's full name and waving emoji
                const welcomeLines = document.querySelectorAll('.welcome-line');
                if (welcomeLines.length > 0) {
                    welcomeLines[0].textContent = `Welcome, ${fullName}👋`;  // Added waving emoji
                }

                // Update the profile initials
                const initials = getInitials(firstName, lastName);
                profileInitialsElement.innerText = initials || 'U';

                profileInitialsElement.innerText = initials || 'U';  // Fallback to 'U' for unknown users
                profileInitialsElement.style.display = 'flex';
                profileInitialsElement.style.justifyContent = 'center';
                profileInitialsElement.style.alignItems = 'center';
                profileInitialsElement.style.width = '40px';
                profileInitialsElement.style.height = '40px';
                profileInitialsElement.style.borderRadius = '50%';
                profileInitialsElement.style.backgroundColor = '#3498db';
                profileInitialsElement.style.color = 'white';
                profileInitialsElement.style.fontSize = '20px';
                profileInitialsElement.style.fontWeight = 'bold';

            } catch (error) {
                console.error('Error fetching user/admin data:', error);
                profileInitialsElement.innerText = 'U';
            }
        } else {
            // If no user is logged in, show default message with waving emoji
            const welcomeLines = document.querySelectorAll('.welcome-line');
            if (welcomeLines.length > 0) {
                welcomeLines[0].textContent = 'Welcome, Guest!👋';
            }

            profileInitialsElement.innerText = 'G';
        }
    });
}


// Call this on page load
updateProfile();

document.addEventListener('DOMContentLoaded', async function () {
    const calendarEl = document.getElementById('calendar');
    const modal = document.getElementById('eventModal');
    const closeBtn = document.getElementById('closeEventModal');

    // Function to close the modal
    function closeEventModal() {
        modal.classList.remove('show');
    }

    // Close modal when clicking the close button
    closeBtn.addEventListener('click', closeEventModal);

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeEventModal();
        }
    });

    // Close modal on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.classList.contains('show')) {
            closeEventModal();
        }
    });

    // Show event modal
    function showEventModal(eventData) {
        // Set modal content
        document.getElementById('modalEventTitle').textContent = eventData.title;
        document.getElementById('modalEventDate').textContent = formatDate(eventData.date);
        document.getElementById('modalEventTime').textContent = eventData.time || 'Time not specified';
        document.getElementById('modalEventLocation').textContent = eventData.location || 'Location not specified';
        document.getElementById('modalEventDescription').textContent = eventData.description || 'No description available';
        
        // Setup reaction buttons
        setupReactionButtons(eventData);
        
        // Show modal
        modal.classList.add('show');
    }

    // Initialize calendar
    function initializeCalendar(events) {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
            },
            events: events.map(event => ({
                title: event.title,
                start: event.date,
                description: event.description,
                location: event.location,
                time: event.time,
                extendedProps: {
                    eventId: event.id,
                    eventData: event
                }
            })),
            eventClick: function(info) {
                showEventModal(info.event.extendedProps.eventData);
            },
            dayMaxEvents: true,
            weekNumbers: true,
            weekNumberCalculation: 'ISO',
            selectable: true,
            selectMirror: true,
            nowIndicator: true,
            height: 'auto'
        });

        calendar.render();
        return calendar;
    }

    // Show event modal
    function showEventModal(eventData) {
        const modal = document.getElementById('eventModal');
        const closeBtn = document.getElementById('closeEventModal');
        
        // Set modal content
        document.getElementById('modalEventTitle').textContent = eventData.title;
        document.getElementById('modalEventDate').textContent = formatDate(eventData.date);
        document.getElementById('modalEventTime').textContent = eventData.time || 'Time not specified';
        document.getElementById('modalEventLocation').textContent = eventData.location || 'Location not specified';
        document.getElementById('modalEventDescription').textContent = eventData.description || 'No description available';
        
        // Setup reaction buttons in modal
        const reactionButtons = document.getElementById('modalReactionButtons');
        reactionButtons.innerHTML = `
            <button class="reaction-button" data-reaction="like" data-event-id="${eventData.id}">
                <i class="far fa-thumbs-up"></i>
                <span class="reaction-count">${eventData.likes ? eventData.likes.length : 0}</span>
            </button>
            <button class="reaction-button" data-reaction="heart" data-event-id="${eventData.id}">
                <i class="far fa-heart"></i>
                <span class="reaction-count">${eventData.hearts ? eventData.hearts.length : 0}</span>
            </button>
            <button class="reaction-button" data-reaction="celebrate" data-event-id="${eventData.id}">
                <i class="far fa-star"></i>
                <span class="reaction-count">${eventData.celebrates ? eventData.celebrates.length : 0}</span>
            </button>
        `;
        
        // Add reaction button event listeners
        const buttons = reactionButtons.querySelectorAll('.reaction-button');
        buttons.forEach(button => {
            button.addEventListener('click', handleReaction);
            
            // Check if user has reacted
            const reactionType = button.dataset.reaction;
            const reactions = eventData[`${reactionType}s`] || [];
            if (reactions.includes(auth.currentUser?.uid)) {
                button.classList.add('active');
            }
        });
        
        // Show RSVP link if available
        const rsvpLink = document.getElementById('modalEventRSVP');
        if (eventData.rsvpLink) {
            rsvpLink.href = eventData.rsvpLink;
            rsvpLink.style.display = 'block';
        } else {
            rsvpLink.style.display = 'none';
        }
        
        // Show modal
        modal.style.display = 'flex';
        
        // Close modal when clicking close button
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
        
        // Close on escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }

    // Function to close the modal
    function closeEventModal() {
        const modal = document.getElementById('eventModal');
        modal.style.display = 'none';
    }

    // Show event modal
    function showEventModal(eventData) {
        const modal = document.getElementById('eventModal');
        const closeBtn = document.getElementById('closeEventModal');
        
        // Set modal content
        document.getElementById('modalEventTitle').textContent = eventData.title;
        document.getElementById('modalEventDate').textContent = formatDate(eventData.date);
        document.getElementById('modalEventTime').textContent = eventData.time || 'Time not specified';
        document.getElementById('modalEventLocation').textContent = eventData.location || 'Location not specified';
        document.getElementById('modalEventDescription').textContent = eventData.description || 'No description available';
        
        // Setup reaction buttons
        setupReactionButtons(eventData);
        
        // Show modal
        modal.classList.add('show');
        
        // Close modal handlers
        closeBtn.addEventListener('click', closeEventModal);
        
        // Close on outside click
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeEventModal();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal.classList.contains('show')) {
                closeEventModal();
            }
        });
    }

    // Format date for display
    function formatDate(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }

    async function loadEvents() {
        try {
            const eventsRef = collection(db, "events");
            const querySnapshot = await getDocs(eventsRef);
            const events = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            querySnapshot.forEach((doc) => {
                const event = doc.data();
                const eventDate = event.date.toDate();
                if (eventDate >= today) {
                    events.push({
                        id: doc.id,
                        ...event,
                        date: eventDate
                    });
                }
            });

            // Sort events by date
            events.sort((a, b) => a.date - b.date);

            // Initialize calendar with events
            initializeCalendar(events);

            // Display event cards
            displayEvents(events);
            
            // Add highlight animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes highlight {
                    0% { transform: scale(1); box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); }
                    50% { transform: scale(1.05); box-shadow: 0 5px 15px rgba(0, 128, 128, 0.3); }
                    100% { transform: scale(1); box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); }
                }
            `;
            document.head.appendChild(style);

        } catch (error) {
            console.error("Error loading events: ", error);
        }
    }

    loadEvents();

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: async function (fetchInfo, successCallback, failureCallback) {
            try {
                const eventQuery = query(collection(db, 'event'), where('status', '==', 'approved'));
                const querySnapshot = await getDocs(eventQuery);
                const events = querySnapshot.docs.map(doc => {
                    const event = doc.data();
                    const eventDate = new Date(event.date);
                    eventDate.setHours(0, 0, 0, 0);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (eventDate >= today) {
                        return {
                            title: event.title,
                            start: event.date,
                            url: event.rsvpUrl,
                            extendedProps: {
                                location: event.location,
                                description: event.description
                            }
                        };
                    } else {
                        return null;
                    }
                }).filter(Boolean);
                successCallback(events);
            } catch (error) {
                console.error("Error fetching events: ", error);
                failureCallback(error);
            }
        },
        eventClick: function (info) {
            info.jsEvent.preventDefault();
            alert(`Event: ${info.event.title}\nLocation: ${info.event.extendedProps.location}`);
        }
    });

    calendar.render();
});

// HTML elements

const searchForm = document.getElementById('search-form'); // Form element for search
const searchInput = document.getElementById('search-input'); // Input field for search



async function searchEvents(searchTerm) {
    eventsList.innerHTML = ''; // Clear previous results
    let foundEvents = false; // Initialize flag to track matching events

    try {
        const eventQuery = query(collection(db, 'event'), where('status', '==', 'approved'));
        const querySnapshot = await getDocs(eventQuery);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Use a for...of loop to handle asynchronous operations reliably
        for (const doc of querySnapshot.docs) {
            const event = doc.data();
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);

            try {
                const imageUrl = await getImageUrl(event.imageUrl);
                if (event.title.toLowerCase().includes(searchTerm.toLowerCase()) && eventDate >= today) {
                    const eventHtml = `
                        <div class="event">
                            <img src="${imageUrl}" alt="${event.title}" onerror="this.src='/path/to/placeholder.jpg';">
                            <div class="event-title">${event.title}</div>
                            <div class="event-location"><p>${event.location}</p></div>
                            <div class="event-date"><p>${eventDate.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p></div>
                            ${event.rsvpUrl ? `<a href="${event.rsvpUrl}" class="event-rsvp">RSVP</a>` : ''}
                        </div>`;
                    eventsList.innerHTML += eventHtml;
                    foundEvents = true; // Matching event found
                }
            } catch (innerError) {
                console.error('Error processing event: ', innerError);
            }
        }

        // After processing all events, check if any matches were found
        if (!foundEvents) {
            eventsList.innerHTML = '<div class="no-results">No matching events found.</div>';
        }
    } catch (error) {
        console.error('Error searching events: ', error);
        eventsList.innerHTML = '<div class="error">Failed to search events. Please try again later.</div>';
    }
}

// Attach event listener to the search form
searchForm.addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent page refresh
    const searchTerm = searchInput.value.trim(); // Get the search term
    if (searchTerm) {
        searchEvents(searchTerm); // Call searchEvents with the term
    }
});

// Attach event listener to the search form
searchForm.addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the page from refreshing
    const searchTerm = searchInput.value.trim(); // Get the search term from input
    if (searchTerm) {
        searchEvents(searchTerm); // Call searchEvents with the term
    }
});

// Load events 
async function loadEvents() {
    eventsList.innerHTML = '';

    try {
        const approvedEventsQuery = query(collection(db, 'event'), where('status', '==', 'approved'));
        const querySnapshot = await getDocs(approvedEventsQuery);

        if (querySnapshot.empty) {
            eventsList.innerHTML = '<div class="event no-events"><p>No approved events available at the moment.</p></div>';
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Ensure time is reset for accurate comparison

            const upcomingEvents = querySnapshot.docs.filter(doc => {
                const event = doc.data();
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0); // Reset time for accurate comparison
                return eventDate >= today; // Include only events happening today or later
            });

            displayEvents(upcomingEvents, true);
        }
    } catch (error) {
        console.error('Error fetching events: ', error);
    }
}



// Display events 
async function displayEvents(upcomingEventDocs) {
    eventsList.innerHTML = ''; // Clear the current list
    const currentUser = auth.currentUser;

    for (const doc of upcomingEventDocs) {
        const event = doc.data();
        const imageUrl = await getImageUrl(event.imageUrl);
        const userId = currentUser ? currentUser.uid : null;

        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Initialize reaction arrays if they don't exist
        const likes = event.likes || [];
        const hearts = event.hearts || [];
        const celebrates = event.celebrates || [];

        // Check if user has reacted
        const hasLiked = userId ? likes.includes(userId) : false;
        const hasHearted = userId ? hearts.includes(userId) : false;
        const hasCelebrated = userId ? celebrates.includes(userId) : false;

        if (eventDate >= today) { // Render only upcoming events
            const eventHtml = `
                <div class="event">
                    <img src="${imageUrl}" alt="${event.title}" onerror="this.src='../images/placeholder.jpg'">
                    <div class="event-title">${event.title}</div>
                    <div class="event-location">
                        <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                    </div>
                    <div class="event-date">
                        <p><i class="far fa-calendar-alt"></i> ${eventDate.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div class="reaction-buttons">
                        <button class="reaction-btn ${hasLiked ? 'active' : ''}" data-reaction="like" data-event-id="${doc.id}">
                            <i class="fas fa-thumbs-up"></i>
                            <span class="reaction-count">${likes.length}</span>
                        </button>
                        <button class="reaction-btn ${hasHearted ? 'active' : ''}" data-reaction="heart" data-event-id="${doc.id}">
                            <i class="fas fa-heart"></i>
                            <span class="reaction-count">${hearts.length}</span>
                        </button>
                        <button class="reaction-btn ${hasCelebrated ? 'active' : ''}" data-reaction="celebrate" data-event-id="${doc.id}">
                            <i class="fas fa-star"></i>
                            <span class="reaction-count">${celebrates.length}</span>
                        </button>
                    </div>
                    ${event.rsvpUrl ? `<a href="${event.rsvpUrl}" class="event-rsvp"><i class="fas fa-external-link-alt"></i> RSVP</a>` : ''}
                </div>
            `;
            eventsList.innerHTML += eventHtml;
        }
    }

    // Add event listeners for reaction buttons
    const reactionButtons = document.querySelectorAll('.reaction-btn');
    reactionButtons.forEach(button => {
        button.addEventListener('click', handleReaction);
    });

    addImageClickEvent(); // Reattach click events after updating DOM
}

// Handle reactions
async function handleReaction(event) {
    event.preventDefault();
    const currentUser = auth.currentUser;

    if (!currentUser) {
        alert('Please login to react to events');
        window.location.href = 'login.html';
        return;
    }

    const button = event.currentTarget;
    const eventId = button.dataset.eventId;
    const reactionType = button.dataset.reaction;
    const userId = currentUser.uid;

    try {
        const eventRef = doc(db, 'event', eventId);
        const eventDoc = await getDoc(eventRef);

        if (!eventDoc.exists()) {
            console.error('Event not found');
            return;
        }

        const eventData = eventDoc.data();
        const reactionArray = `${reactionType}s`; // likes, hearts, celebrates
        
        // Initialize arrays if they don't exist
        const reactionTypes = ['like', 'heart', 'celebrate'];
        reactionTypes.forEach(type => {
            if (!eventData[`${type}s`]) {
                eventData[`${type}s`] = [];
            }
        });

        const hasReacted = eventData[reactionArray].includes(userId);
        const updates = {};

        // Check if user has any other reactions
        let otherReactions = [];
        reactionTypes.forEach(type => {
            if (type !== reactionType && eventData[`${type}s`].includes(userId)) {
                otherReactions.push(type);
                updates[`${type}s`] = arrayRemove(userId);
                // Remove active class from other buttons
                const otherButton = document.querySelector(`button[data-reaction="${type}"][data-event-id="${eventId}"]`);
                if (otherButton) {
                    otherButton.classList.remove('active');
                    const countElement = otherButton.querySelector('.reaction-count');
                    const newCount = parseInt(countElement.textContent) - 1;
                    countElement.textContent = newCount;
                }
            }
        });

        if (hasReacted) {
            // Remove current reaction
            updates[reactionArray] = arrayRemove(userId);
            button.classList.remove('active');
            const countElement = button.querySelector('.reaction-count');
            const newCount = parseInt(countElement.textContent) - 1;
            countElement.textContent = newCount;
        } else {
            // Add new reaction
            updates[reactionArray] = arrayUnion(userId);
            button.classList.add('active');
            const countElement = button.querySelector('.reaction-count');
            const newCount = parseInt(countElement.textContent) + 1;
            countElement.textContent = newCount;
        }

        // Update all changes in one batch
        await updateDoc(eventRef, updates);

        // Show feedback to user
        let feedbackMessage;
        if (hasReacted) {
            feedbackMessage = `${reactionType.charAt(0).toUpperCase() + reactionType.slice(1)} removed`;
        } else {
            if (otherReactions.length > 0) {
                const oldReaction = otherReactions[0].charAt(0).toUpperCase() + otherReactions[0].slice(1);
                feedbackMessage = `Changed from ${oldReaction} to ${reactionType.charAt(0).toUpperCase() + reactionType.slice(1)}!`;
            } else {
                feedbackMessage = reactionType === 'like' ? 'Liked!' : 
                                reactionType === 'heart' ? 'Loved!' : 'Interested!';
            }
        }

        // Create and show a temporary feedback message
        const feedback = document.createElement('div');
        feedback.textContent = feedbackMessage;
        feedback.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #333;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(feedback);
        
        // Animate the feedback
        setTimeout(() => feedback.style.opacity = '1', 0);
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => feedback.remove(), 300);
        }, 1500);

    } catch (error) {
        console.error('Error handling reaction:', error);
        alert('An error occurred. Please try again.');
    }
}

// Get image URL from Firebase Storage
async function getImageUrl(imagePath) {
    try {
        const imageRef = ref(storage, imagePath);
        const url = await getDownloadURL(imageRef);
        return url;
    } catch (error) {
        console.error('Error getting image URL: ', error);
        return '';
    }
}

// Function to open the modal
function openModal(imageSrc) {
    const modal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    modal.style.display = "block";
    modalImage.src = imageSrc;
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById("imageModal");
    modal.style.display = "none";
}

// Add event listeners to event images
function addImageClickEvent() {
    const eventImages = document.querySelectorAll('.event img');
    eventImages.forEach(img => {
        img.addEventListener('click', function () {
            openModal(this.src);
        });
    });

    const closeBtn = document.querySelector(".modal .close");
    closeBtn.addEventListener('click', closeModal);

    window.addEventListener('click', function (event) {
        const modal = document.getElementById("imageModal");
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Fetch and display events on window load
window.onload = loadEvents;
