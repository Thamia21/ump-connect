import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    where,
    onSnapshot,
    orderBy,
    doc,
    updateDoc,
    addDoc,
    limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

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

// DOM Elements
const logoutBtn = document.getElementById('logout-btn');
const refreshActivityBtn = document.getElementById('refresh-activity');
const profileImageInput = document.getElementById('profile-image-input');
const toggleBtn = document.getElementById('toggle-btn');
const sidebar = document.getElementById('sidebar');

// Event Listeners
logoutBtn.addEventListener('click', handleLogout);
profileImageInput.addEventListener('change', handleProfileImageUpload);
refreshActivityBtn.addEventListener('click', loadRecentActivity);
toggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

// Auth state listener
onAuthStateChanged(auth, handleAuthStateChange);

// Handle auth state changes
async function handleAuthStateChange(user) {
    if (user) {
        try {
            console.log('Current user email:', user.email);
            const adminDoc = await getDocs(query(collection(db, 'admins'), where('email', '==', user.email)));
            
            if (!adminDoc.empty) {
                const adminData = adminDoc.docs[0].data();
                console.log('Admin data:', adminData);
                
                // Use the correct field names from registration
                const fullName = adminData.fullName || '';
                const surname = adminData.surname || '';
                
                const displayName = [fullName, surname].filter(Boolean).join(' ');
                console.log('Display name:', displayName);
                
                document.getElementById('admin-name').textContent = `Welcome, ${displayName || user.email}`;
                
                if (adminData.profileImageUrl) {
                    document.getElementById('profile-pic').src = adminData.profileImageUrl;
                }
            } else {
                console.log('No admin document found for email:', user.email);
            }
            
            await Promise.all([
                loadStatistics(),
                createUserGrowthChart(),
                createContentDistributionChart(),
                loadRecentActivity(),
                updateEventNotificationCounter(),
                updateNewsNotificationCounter()
            ]);
        } catch (error) {
            console.error('Error loading admin data:', error);
            showError('Error loading dashboard data');
        }
    } else {
        window.location.href = 'adminLogin.html';
    }
}

// Handle logout
async function handleLogout() {
    try {
        await Swal.fire({
            title: 'Logging out...',
            text: 'Please wait',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: async () => {
                await signOut(auth);
                window.location.href = 'adminLogin.html';
            }
        });
    } catch (error) {
        console.error('Error during logout:', error);
        showError('Error during logout');
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const [users, jobs, admins, managers, events, news] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'jobs')),
            getDocs(collection(db, 'admins')),
            getDocs(collection(db, 'event-manager')),
            getDocs(query(collection(db, 'event'), where('status', '==', 'approved'))),
            getDocs(query(collection(db, 'news'), where('approved', '==', true)))
        ]);

        updateStatCount('user-count', users.size);
        updateStatCount('job-count', jobs.size);
        updateStatCount('admin-count', admins.size);
        updateStatCount('guest-count', managers.size);
        updateStatCount('event-count', events.size);
        updateStatCount('news-count', news.size);
    } catch (error) {
        console.error('Error loading statistics:', error);
        showError('Error loading statistics');
    }
}

// Update stat count with animation
function updateStatCount(elementId, value) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const start = parseInt(element.textContent) || 0;
    const increment = (value - start) / (duration / 16);
    let current = start;

    const animate = () => {
        current += increment;
        element.textContent = Math.round(current);
        if (increment > 0 ? current < value : current > value) {
            requestAnimationFrame(animate);
        } else {
            element.textContent = value;
        }
    };

    animate();
}

// Handle profile image upload
async function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        await Swal.fire({
            title: 'Uploading...',
            text: 'Please wait',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: async () => {
                const storageRef = ref(storage, `profile-images/${auth.currentUser.uid}.jpg`);
                await uploadBytes(storageRef, file);
                const imageUrl = await getDownloadURL(storageRef);
                document.getElementById('profile-pic').src = imageUrl;
                await updateDoc(doc(db, 'admins', auth.currentUser.uid), { profileImageUrl: imageUrl });
                Swal.fire('Success', 'Profile image updated successfully', 'success');
            }
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        showError('Error uploading profile image');
    }
}

// Create user growth chart
async function createUserGrowthChart() {
    try {
        const usersRef = collection(db, 'users');
        const users = await getDocs(usersRef);
        const userDates = users.docs.map(doc => new Date(doc.data().registrationDate.seconds * 1000));
        
        const monthlyData = getMonthlyData(userDates);
        
        const ctx = document.getElementById('userGrowthChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'New Users',
                    data: monthlyData.data,
                    borderColor: '#007272',
                    backgroundColor: 'rgba(0, 114, 114, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating user growth chart:', error);
        showError('Error creating user growth chart');
    }
}

// Create content distribution chart
async function createContentDistributionChart() {
    try {
        const [events, news, jobs] = await Promise.all([
            getDocs(collection(db, 'event')),
            getDocs(collection(db, 'news')),
            getDocs(collection(db, 'jobs'))
        ]);

        const ctx = document.getElementById('contentDistributionChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Events', 'News', 'Jobs'],
                datasets: [{
                    data: [events.size, news.size, jobs.size],
                    backgroundColor: [
                        'rgba(0, 114, 114, 0.8)',
                        'rgba(0, 153, 153, 0.8)',
                        'rgba(0, 198, 198, 0.8)'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating content distribution chart:', error);
        showError('Error creating content distribution chart');
    }
}

// Activity logging function
async function logActivity(type, message, userId = null) {
    try {
        const activityRef = collection(db, 'recentActivity');
        const activityData = {
            type: type, // 'user', 'event', 'news', 'job'
            message: message,
            timestamp: new Date(),
            userId: userId || (auth.currentUser ? auth.currentUser.uid : null)
        };
        await addDoc(activityRef, activityData);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const activityList = document.getElementById('activity-list');
        activityList.innerHTML = '<div class="activity-item loading">Loading activities...</div>';

        const recentActivityRef = collection(db, 'recentActivity');
        const q = query(recentActivityRef, orderBy('timestamp', 'desc'), limit(10));
        
        onSnapshot(q, (snapshot) => {
            activityList.innerHTML = '';
            snapshot.docs.forEach(doc => {
                const activity = doc.data();
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                
                const icon = getActivityIcon(activity.type);
                const time = formatTimestamp(activity.timestamp);
                
                activityItem.innerHTML = `
                    <div class="activity-content">
                        <i class="${icon}"></i>
                        <div class="activity-details">
                            <span class="activity-message">${activity.message}</span>
                            <span class="activity-time">${time}</span>
                        </div>
                    </div>
                `;
                
                activityList.appendChild(activityItem);
            });
            
            if (snapshot.empty) {
                activityList.innerHTML = '<div class="activity-item">No recent activity</div>';
            }
        });
    } catch (error) {
        console.error('Error loading recent activity:', error);
        showError('Error loading recent activity');
    }
}

// Add event notification counter
async function updateEventNotificationCounter() {
    try {
        const eventsRef = collection(db, "event");
        const q = query(eventsRef, where("status", "==", "pending"));
        
        // Real-time listener for pending events
        onSnapshot(q, (snapshot) => {
            const pendingCount = snapshot.docs.length;
            const eventsNavLink = document.querySelector('a[href="adminEvents.html"]');
            
            if (!eventsNavLink) {
                console.error('Events nav link not found');
                return;
            }

            let countBadge = eventsNavLink.querySelector('.pending-count');
            
            if (!countBadge) {
                countBadge = document.createElement('span');
                countBadge.classList.add('pending-count');
                eventsNavLink.appendChild(countBadge);
            }
            
            if (pendingCount > 0) {
                countBadge.textContent = pendingCount;
                countBadge.style.display = 'inline';
                eventsNavLink.classList.add('has-pending');
                
                // Show notification if not already shown
                if (!sessionStorage.getItem('notificationShown')) {
                    Swal.fire({
                        title: 'New Pending Events!',
                        text: `You have ${pendingCount} event${pendingCount > 1 ? 's' : ''} waiting for review.`,
                        icon: 'info',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000
                    });
                    sessionStorage.setItem('notificationShown', 'true');
                }
            } else {
                countBadge.style.display = 'none';
                eventsNavLink.classList.remove('has-pending');
            }
        }, error => {
            console.error("Error in event notification listener:", error);
        });
    } catch (error) {
        console.error("Error setting up notification counter:", error);
    }
}

// Add news notification counter
async function updateNewsNotificationCounter() {
    try {
        const newsRef = collection(db, "news");
        const q = query(newsRef, where("status", "==", "pending"));
        
        // Real-time listener for pending news
        onSnapshot(q, (snapshot) => {
            const pendingCount = snapshot.docs.length;
            const newsNavLink = document.querySelector('a[href="adminNews.html"]');
            
            if (!newsNavLink) {
                console.error('News nav link not found');
                return;
            }

            let countBadge = newsNavLink.querySelector('.pending-count');
            
            if (!countBadge) {
                countBadge = document.createElement('span');
                countBadge.classList.add('pending-count');
                newsNavLink.appendChild(countBadge);
            }
            
            if (pendingCount > 0) {
                countBadge.textContent = pendingCount;
                countBadge.style.display = 'inline';
                newsNavLink.classList.add('has-pending');
                
                // Show notification if not already shown
                if (!sessionStorage.getItem('newsNotificationShown')) {
                    Swal.fire({
                        title: 'New Pending News!',
                        text: `You have ${pendingCount} news article${pendingCount > 1 ? 's' : ''} waiting for review.`,
                        icon: 'info',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000
                    });
                    sessionStorage.setItem('newsNotificationShown', 'true');
                }
            } else {
                countBadge.style.display = 'none';
                newsNavLink.classList.remove('has-pending');
            }
        }, error => {
            console.error("Error in news notification listener:", error);
        });
    } catch (error) {
        console.error("Error setting up news notification counter:", error);
    }
}

// Helper Functions
function getMonthlyData(dates) {
    const months = {};
    const sortedDates = dates.sort((a, b) => a - b);
    
    sortedDates.forEach(date => {
        const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        months[key] = (months[key] || 0) + 1;
    });
    
    return {
        labels: Object.keys(months),
        data: Object.values(months)
    };
}

function getActivityIcon(type) {
    const icons = {
        'user': 'fas fa-user',
        'event': 'fas fa-calendar-alt',
        'news': 'fas fa-newspaper',
        'job': 'fas fa-briefcase',
        'default': 'fas fa-info-circle'
    };
    return icons[type] || icons.default;
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString();
}

function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: message,
        confirmButtonColor: '#007272'
    });
}

// Inactivity timeout
let inactivityTimeout;
const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(logOutOnInactivity, INACTIVITY_LIMIT);
}

async function logOutOnInactivity() {
    try {
        await signOut(auth);
        window.location.href = 'adminLogin.html';
    } catch (error) {
        console.error('Error logging out due to inactivity:', error);
        showError('Error during automatic logout');
    }
}

// Activity event listeners
['mousemove', 'click', 'keypress'].forEach(event => {
    window.addEventListener(event, resetInactivityTimer);
});

// Initialize inactivity timer
window.onload = resetInactivityTimer;
