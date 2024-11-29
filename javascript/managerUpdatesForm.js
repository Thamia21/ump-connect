import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot, Timestamp, deleteDoc, doc, addDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

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

// Elements
const newsForm = document.getElementById('newsForm');
const newsList = document.getElementById('news-list');

// Handle form submission
newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const user = auth.currentUser;
        if (!user) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'You must be logged in to submit news'
            });
            return;
        }

        // Get form values
        const title = document.getElementById('title').value;
        const intro = document.getElementById('intro').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;
        const imageFile = document.getElementById('image').files[0];

        if (!imageFile) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please select an image'
            });
            return;
        }

        // Show loading state
        Swal.fire({
            title: 'Submitting news...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Upload image to Firebase Storage
        const storageRef = ref(storage, `news-images/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        const imageURL = await getDownloadURL(uploadResult.ref);

        // Add news to Firestore
        const newsData = {
            title,
            intro,
            description,
            date: new Date(date).toISOString(),
            imageURL,
            timestamp: Timestamp.now(),
            managerUid: user.uid,
            status: 'pending',
            approved: false
        };

        await addDoc(collection(db, 'news'), newsData);

        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'News article submitted for approval'
        });

        // Reset form
        newsForm.reset();

    } catch (error) {
        console.error('Error submitting news:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to submit news article. Please try again.'
        });
    }
});

/**
 * Fetch and display all news (for admins) with a check for expired articles
 */
function fetchNews() {
    const q = query(
        collection(db, 'news'),
        where('managerUid', '==', auth.currentUser.uid)
    );

    // Listen for real-time updates
    onSnapshot(q, (snapshot) => {
        newsList.innerHTML = ''; // Clear previous news
        if (snapshot.size > 0) {
            snapshot.forEach((doc) => {
                const news = doc.data();
                const newsElement = document.createElement('div');
                newsElement.classList.add('news-item');
                newsElement.innerHTML = `
                    <h3>${news.title}</h3>
                    <p><strong>Date:</strong> ${news.date}</p>
                    <p><strong>Status:</strong> <span class="news-status ${news.status}">${news.status}</span></p>
                    <img src="${news.imageURL}" alt="News Image" style="max-width: 200px;">
                `;
                newsList.appendChild(newsElement);
            });
        } else {
            newsList.innerHTML = '<p>No news submitted yet.</p>';
        }
    }, (error) => {
        console.error('Error fetching news:', error);
        newsList.innerHTML = '<p>Error loading news. Please try again.</p>';
    });
}

// Check the authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Logged in user:', user.uid);
        fetchNews(); // Fetch news for the current manager
    } else {
        console.log('No user is logged in.');
        window.location.href = 'managerLogin.html';
    }
});

// Inactivity timeout logic
let inactivityTimeout;
const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes in milliseconds

// Function to reset the inactivity timer
function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(logOutOnInactivity, INACTIVITY_LIMIT);
}

// Function to log out the user after inactivity
async function logOutOnInactivity() {
    try {
        await signOut(auth);
        console.log('User has been logged out due to inactivity');
        window.location.href = 'managerLogin.html';
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
