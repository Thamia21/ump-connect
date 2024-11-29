import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

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

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const newsId = urlParams.get('id');

// DOM Elements
const newsImage = document.getElementById('news-image');
const newsTitle = document.getElementById('news-title');
const newsDate = document.getElementById('news-date');
const newsTime = document.getElementById('news-time');
const newsIntro = document.getElementById('news-intro');
const newsDescription = document.getElementById('news-description');
const newsCategory = document.getElementById('news-category');
const userInitials = document.getElementById('user-initials');

// Load news details
async function loadNewsDetails() {
    try {
        if (!newsId) {
            throw new Error('No news ID provided');
        }

        const newsRef = doc(db, 'news', newsId);
        const newsDoc = await getDoc(newsRef);

        if (newsDoc.exists()) {
            const data = newsDoc.data();
            console.log('News data:', data); // Debug log

            // Update DOM elements with null checks
            if (data.imageURL) {
                newsImage.src = data.imageURL;
            }
            
            newsTitle.textContent = data.title || 'Untitled';
            
            // Format and display timestamp
            if (data.timestamp) {
                const date = new Date(data.timestamp.seconds * 1000);
                newsDate.textContent = date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                newsTime.textContent = date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                newsDate.textContent = 'Date not available';
                newsTime.textContent = 'Time not available';
            }

            // Fetch and display manager details
            if (data.managerUid) {
                const managerRef = doc(db, 'event-manager', data.managerUid);
                const managerDoc = await getDoc(managerRef);
                if (managerDoc.exists()) {
                    const managerData = managerDoc.data();
                    const managerName = document.getElementById('manager-name');
                    if (managerName) {
                        managerName.textContent = `${managerData.firstName} ${managerData.surname}`;
                    }
                }
            }
            
            newsIntro.textContent = data.intro || '';
            newsDescription.textContent = data.description || 'No description available';
            newsCategory.textContent = data.category || 'General';

            // Update reaction counts
            updateReactionCounts(data);
            
            // Check if user has reacted
            checkUserReactions();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'News not found',
                text: 'The requested news article could not be found.'
            }).then(() => {
                window.location.href = 'news.html';
            });
        }
    } catch (error) {
        console.error('Error loading news:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load news details. Please try again.'
        });
    }
}

// Handle user reactions
async function handleReaction(type) {
    const user = auth.currentUser;
    
    if (!user) {
        Swal.fire({
            title: 'Please Log In',
            text: 'You need to be logged in to react to news',
            icon: 'warning',
            confirmButtonColor: '#3085d6'
        });
        return;
    }

    try {
        const newsRef = doc(db, 'news', newsId);
        const newsDoc = await getDoc(newsRef);
        const data = newsDoc.data();
        
        const reactionField = `${type}s`; // likes or bookmarks
        const userReactions = data[reactionField] || [];
        const hasReacted = userReactions.includes(user.uid);

        if (hasReacted) {
            // Remove reaction
            await updateDoc(newsRef, {
                [reactionField]: arrayRemove(user.uid)
            });
            document.querySelector(`[onclick="handleReaction('${type}')"]`).classList.remove('active');
        } else {
            // Add reaction
            await updateDoc(newsRef, {
                [reactionField]: arrayUnion(user.uid)
            });
            document.querySelector(`[onclick="handleReaction('${type}')"]`).classList.add('active');
        }

        // Update counts
        const updatedDoc = await getDoc(newsRef);
        updateReactionCounts(updatedDoc.data());

    } catch (error) {
        console.error('Error handling reaction:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update reaction. Please try again.'
        });
    }
}

// Update reaction counts
function updateReactionCounts(data) {
    const likesCount = document.getElementById('likes-count');
    const bookmarksCount = document.getElementById('bookmarks-count');
    
    if (likesCount) {
        likesCount.textContent = (data.likes || []).length;
    }
    if (bookmarksCount) {
        bookmarksCount.textContent = (data.bookmarks || []).length;
    }
}

// Check user's existing reactions
async function checkUserReactions() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const newsRef = doc(db, 'news', newsId);
        const newsDoc = await getDoc(newsRef);
        const data = newsDoc.data();

        if (data.likes?.includes(user.uid)) {
            const likeButton = document.querySelector('[onclick="handleReaction(\'like\')"]');
            if (likeButton) likeButton.classList.add('active');
        }
        if (data.bookmarks?.includes(user.uid)) {
            const bookmarkButton = document.querySelector('[onclick="handleReaction(\'bookmark\')"]');
            if (bookmarkButton) bookmarkButton.classList.add('active');
        }
    } catch (error) {
        console.error('Error checking reactions:', error);
    }
}

// Share content function
window.shareContent = function() {
    if (navigator.share) {
        navigator.share({
            title: newsTitle.textContent,
            text: newsIntro.textContent,
            url: window.location.href
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
        // Fallback for browsers that don't support native sharing
        const shareUrl = window.location.href;
        Swal.fire({
            title: 'Share this article',
            html: `
                <div class="share-options">
                    <input type="text" value="${shareUrl}" readonly>
                    <button onclick="navigator.clipboard.writeText('${shareUrl}')">
                        Copy Link
                    </button>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true
        });
    }
}

// Display user initials
function displayUserInitials(user) {
    if (user && user.email && userInitials) {
        const initials = user.email
            .split('@')[0]
            .split('.')
            .map(name => name[0].toUpperCase())
            .join('');
        userInitials.textContent = initials;
        userInitials.style.display = 'flex';
    } else if (userInitials) {
        userInitials.style.display = 'none';
    }
}

// Auth state observer
onAuthStateChanged(auth, (user) => {
    displayUserInitials(user);
    checkUserReactions();
});

// Initialize
window.handleReaction = handleReaction;
document.addEventListener('DOMContentLoaded', loadNewsDetails);