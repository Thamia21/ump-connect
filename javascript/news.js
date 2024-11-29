import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// HTML elements
const profileInitialsElement = document.getElementById('profileInitials');

// Function to get user initials
function getInitials(firstName, lastName) {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
}

// Function to update profile initials
async function updateProfileInitials() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                let userData = userDoc.exists() ? userDoc.data() : null;

                if (!userData) {
                    const adminDoc = await getDoc(doc(db, "admins", user.uid));
                    userData = adminDoc.exists() ? adminDoc.data() : null;
                }

                if (userData) {
                    const initials = getInitials(userData.firstName, userData.lastName);
                    profileInitialsElement.innerText = initials;
                } else {
                    profileInitialsElement.innerText = 'U';
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                profileInitialsElement.innerText = 'U';
            }
        } else {
            profileInitialsElement.innerText = 'G';
        }
    });
}

// Call updateProfileInitials on page load
updateProfileInitials();

// Function to load news
async function loadNews() {
    const eventContainer = document.getElementById('eventContainer');
    if (!eventContainer) {
        console.error('Event container not found');
        return;
    }

    try {
        const newsRef = collection(db, 'news');
        const q = query(newsRef, where('approved', '==', true));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            eventContainer.innerHTML = '<p>No news available at this time.</p>';
            return;
        }

        let newsHTML = '';
        querySnapshot.forEach((doc) => {
            const news = doc.data();
            // Use timestamp for time calculation
            const timestamp = news.timestamp?.seconds ? news.timestamp.seconds * 1000 : new Date(news.date).getTime();
            const formattedDate = timeSince(timestamp);

            newsHTML += `
                <article class="news-item">
                    <h2>${news.title}</h2>
                    ${news.imageURL ? `<img src="${news.imageURL}" alt="${news.title}">` : ''}
                    <p class="intro">${news.intro}</p>
                    <div class="news-date">
                        <i class="far fa-clock"></i> <span class="time-since" data-timestamp="${timestamp}">${formattedDate}</span>
                    </div>
                    <p class="summary" style="display:none;">${news.description || ''}</p>
                    <div class="read-more">
                        <a href="moreDetails.html?id=${doc.id}">Read More</a>
                    </div>
                </article>
            `;
        });

        eventContainer.innerHTML = newsHTML;
    } catch (error) {
        console.error('Error loading news:', error);
        eventContainer.innerHTML = '<p>Error loading news. Please try again later.</p>';
    }
}

// Function to calculate time since a date
function timeSince(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 0) {
        return "just now";
    }

    let interval = Math.floor(seconds / 31536000);

    if (interval >= 1) {
        return interval + " year" + (interval === 1 ? "" : "s") + " ago";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval + " month" + (interval === 1 ? "" : "s") + " ago";
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval + " day" + (interval === 1 ? "" : "s") + " ago";
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
    }
    return "just now";
}

// Search functionality
const searchForm = document.getElementById('searchForm');
if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput.value.toLowerCase();

        const eventContainer = document.getElementById('eventContainer');
        if (!eventContainer) return;

        try {
            const newsRef = collection(db, 'news');
            const q = query(newsRef, where('approved', '==', true));
            const querySnapshot = await getDocs(q);

            let newsHTML = '';
            querySnapshot.forEach((doc) => {
                const news = doc.data();
                if (news.title.toLowerCase().includes(searchTerm) || 
                    news.intro.toLowerCase().includes(searchTerm) || 
                    news.description.toLowerCase().includes(searchTerm)) {
                    
                    const timestamp = news.timestamp?.seconds ? news.timestamp.seconds * 1000 : new Date(news.date).getTime();
                    const formattedDate = timeSince(timestamp);

                    newsHTML += `
                        <article class="news-item">
                            <h2>${news.title}</h2>
                            ${news.imageURL ? `<img src="${news.imageURL}" alt="${news.title}">` : ''}
                            <p class="intro">${news.intro}</p>
                            <div class="news-date">
                                <i class="far fa-clock"></i> <span class="time-since" data-timestamp="${timestamp}">${formattedDate}</span>
                            </div>
                            <p class="summary" style="display:none;">${news.description || ''}</p>
                            <div class="read-more">
                                <a href="moreDetails.html?id=${doc.id}">Read More</a>
                            </div>
                        </article>
                    `;
                }
            });

            eventContainer.innerHTML = newsHTML || '<p>No matching news found.</p>';
        } catch (error) {
            console.error('Error searching news:', error);
            eventContainer.innerHTML = '<p>Error searching news. Please try again later.</p>';
        }
    });
}

// Load news when the page loads
document.addEventListener('DOMContentLoaded', loadNews);

// Update times periodically
setInterval(() => {
    const timeElements = document.querySelectorAll('.time-since');
    timeElements.forEach(element => {
        const timestamp = parseInt(element.getAttribute('data-timestamp'));
        if (!isNaN(timestamp)) {
            element.textContent = timeSince(timestamp);
        }
    });
}, 60000); // Update every minute

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
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

// Event listeners for user activity
window.addEventListener('mousemove', resetInactivityTimer);
window.addEventListener('click', resetInactivityTimer);
window.addEventListener('keypress', resetInactivityTimer);

// Start the inactivity timer
resetInactivityTimer();
