// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore,
    collection, 
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    Timestamp,
    query,
    where,
    orderBy,
    onSnapshot
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

let app;
let db;
let storage;
let auth;

try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    console.log('Firebase initialized successfully in adminNews.js');
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

// Function to get the event manager's displayName by UID
async function getUserDisplayName(uid) {
    if (!uid) return 'Unknown User';
    
    try {
        const managerDoc = await getDoc(doc(db, 'event-manager', uid));
        if (managerDoc.exists()) {
            const managerData = managerDoc.data();
            return `${managerData.firstName} ${managerData.lastName}` || 'Unknown User';
        }
        return 'Unknown User';
    } catch (error) {
        console.error('Error fetching user display name:', error);
        return 'Unknown User';
    }
}

// Function to format date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    try {
        const postDate = new Date(timestamp.seconds * 1000);
        const now = new Date();
        const diffInSeconds = Math.floor((now - postDate) / 1000);

        // If less than a minute
        if (diffInSeconds < 60) {
            return 'Just now';
        }

        // If less than an hour
        if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        }

        // If less than a day
        if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        }

        // If less than a week
        if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} ${days === 1 ? 'day' : 'days'} ago`;
        }

        // If older than a week, show the actual date
        return postDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

// Function to create status badge
function createStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = `status-badge ${status.toLowerCase()}`;
    badge.textContent = status;
    return badge.outerHTML;
}

// Function to show description in modal
window.showDescription = function(description) {
    Swal.fire({
        title: 'Description',
        text: description,
        confirmButtonColor: '#007272'
    });
}

// Show/hide loading spinner
function toggleLoading(show) {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
        console.log(`Loading spinner ${show ? 'shown' : 'hidden'}`);
    }
}

// Load news from Firestore
async function loadNews() {
    console.log('Starting to load news...'); // Debug log
    
    if (!db) {
        console.error('Firebase not initialized!');
        return;
    }
    
    const newsTableBody = document.getElementById('newsTableBody');
    if (!newsTableBody) {
        console.error('News table body element not found!');
        return;
    }
    
    // Get filter values
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : 'all';
    
    console.log('Filter values:', { searchTerm, statusValue }); // Debug log
    
    newsTableBody.innerHTML = '';
    toggleLoading(true);

    try {
        // Get all news ordered by timestamp
        const newsRef = collection(db, 'news');
        const q = query(newsRef, orderBy('timestamp', 'desc'));
        console.log('Fetching news from Firestore...'); // Debug log
        
        const querySnapshot = await getDocs(q);
        console.log('Query snapshot received:', querySnapshot.size, 'documents'); // Debug log

        if (querySnapshot.empty) {
            console.log('No news articles found'); // Debug log
            newsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No news articles available</td></tr>';
            return;
        }

        // Filter news based on search and status
        const filteredDocs = querySnapshot.docs.filter(doc => {
            const news = doc.data();
            const isApproved = news.status === 'approved' || news.approved === true;
            const currentStatus = isApproved ? 'approved' : (news.status || 'pending');
            
            // Match search term
            const matchesSearch = 
                (news.title || '').toLowerCase().includes(searchTerm) ||
                (news.description || '').toLowerCase().includes(searchTerm);
            
            // Match status
            const matchesStatus = statusValue === 'all' || currentStatus === statusValue;
            
            return matchesSearch && matchesStatus;
        });

        console.log('Filtered news count:', filteredDocs.length); // Debug log

        if (filteredDocs.length === 0) {
            newsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No matching news articles found</td></tr>';
            return;
        }

        const newsPromises = filteredDocs.map(async (doc) => {
            const news = doc.data();
            console.log('Processing news article:', doc.id, news); // Debug log
            
            const isApproved = news.status === 'approved' || news.approved === true;
            const status = isApproved ? 'approved' : (news.status || 'pending');
            
            // Get manager name - check both createdBy and managerUid fields
            const managerId = news.createdBy || news.managerUid;
            const managerName = managerId ? await getUserDisplayName(managerId) : 'Unknown User';
            console.log('Manager details:', { managerId, managerName }); // Debug log
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${managerName}</td>
                <td>${news.title || 'No Title'}</td>
                <td>
                    ${news.description ? `
                        <a href="#" class="description-link">Read More</a>
                    ` : 'No description'}
                </td>
                <td>${formatDate(news.timestamp)}</td>
                <td>${createStatusBadge(status)}</td>
                <td>
                    <div class="button-container">
                        ${status !== 'approved' ? `
                            <button class="approve-btn" data-id="${doc.id}">
                                <i class="fas fa-check"></i> Approve
                            </button>
                        ` : ''}
                        ${status === 'pending' ? `
                            <button class="reject-btn" data-id="${doc.id}">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        ` : ''}
                        <button class="delete-btn" data-id="${doc.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;

            // Add event listeners after creating the row
            const descLink = row.querySelector('.description-link');
            if (descLink) {
                descLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    showDescription(news.description);
                });
            }

            const approveBtn = row.querySelector('.approve-btn');
            if (approveBtn) {
                approveBtn.addEventListener('click', () => approveNews(approveBtn.dataset.id));
            }

            const rejectBtn = row.querySelector('.reject-btn');
            if (rejectBtn) {
                rejectBtn.addEventListener('click', () => rejectNews(rejectBtn.dataset.id));
            }

            const deleteBtn = row.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => deleteNews(deleteBtn.dataset.id));
            }

            return row;
        });

        console.log('Waiting for all news processing to complete...'); // Debug log
        const rows = await Promise.all(newsPromises);
        rows.forEach(row => newsTableBody.appendChild(row));
        console.log('News table populated successfully'); // Debug log

    } catch (error) {
        console.error('Error loading news:', error);
        newsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error loading news articles</td></tr>';
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load news articles'
        });
    } finally {
        toggleLoading(false);
    }
}

// Approve news
async function approveNews(id) {
    try {
        await updateDoc(doc(db, 'news', id), {
            status: 'approved',
            approved: true,
            approvedAt: Timestamp.now()
        });
        
        await loadNews(); // Reload the news list
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'News article approved successfully'
        });
    } catch (error) {
        console.error('Error approving news:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to approve news article'
        });
    }
}

// Reject news
async function rejectNews(id) {
    try {
        await updateDoc(doc(db, 'news', id), {
            status: 'rejected',
            approved: false,
            rejectedAt: Timestamp.now()
        });
        
        await loadNews(); // Reload the news list
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'News article rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting news:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to reject news article'
        });
    }
}

// Delete news
async function deleteNews(id) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            await deleteDoc(doc(db, 'news', id));
            await loadNews(); // Reload the news list
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'News article deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting news:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to delete news article'
            });
        }
    }
}

// Function to update the clock
function updateClock() {
    const clockElement = document.getElementById('current-time');
    if (clockElement) {
        const now = new Date();
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        clockElement.textContent = now.toLocaleTimeString('en-US', options);
    }
}

// Update clock every second
setInterval(updateClock, 1000);
updateClock(); // Initial call to display time immediately

// Add news notification counter
async function updateNewsNotificationCounter() {
    try {
        const newsRef = collection(db, "news");
        const q = query(newsRef, where("status", "==", "pending"));
        
        // Real-time listener for pending news
        onSnapshot(q, (snapshot) => {
            const pendingCount = snapshot.docs.length;
            
            if (pendingCount > 0) {
                // Show notification
                Swal.fire({
                    title: 'Pending News',
                    text: `You have ${pendingCount} news article${pendingCount > 1 ? 's' : ''} waiting for review.`,
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

// Make functions globally accessible
window.loadNews = loadNews;
window.approveNews = approveNews;
window.rejectNews = rejectNews;
window.deleteNews = deleteNews;
window.toggleLoading = toggleLoading;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing admin news panel');
    
    // Check authentication
    if (auth) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                loadNews();
                updateNewsNotificationCounter(); // Add notification counter
            } else {
                console.log('No user signed in, redirecting to login');
                window.location.href = 'login.html';
            }
        });
    } else {
        console.error('Auth not initialized!');
    }

    // Load initial news
    // loadNews();

    // Initialize search functionality
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            console.log('Search input changed:', searchInput.value);
            loadNews();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            console.log('Status filter changed:', statusFilter.value);
            loadNews();
        });
    }
});
