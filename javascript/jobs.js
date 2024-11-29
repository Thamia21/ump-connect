// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs,
    query,
    orderBy,
    where,
    Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

// Function to display user initials
function displayUserInitials(user) {
    const initialsElement = document.getElementById('profileInitials');
    if (user && user.displayName) {
        const names = user.displayName.split(' ');
        if (names.length >= 2) {
            const initials = `${names[0][0]}${names[1][0]}`.toUpperCase();
            initialsElement.textContent = initials;
            initialsElement.style.backgroundColor = '#4CAF50'; // Green background
            initialsElement.style.color = 'white';
            initialsElement.style.padding = '8px';
            initialsElement.style.borderRadius = '50%';
            initialsElement.style.width = '35px';
            initialsElement.style.height = '35px';
            initialsElement.style.display = 'flex';
            initialsElement.style.alignItems = 'center';
            initialsElement.style.justifyContent = 'center';
            initialsElement.style.textDecoration = 'none';
            initialsElement.style.fontWeight = 'bold';
        }
    } else {
        // If no display name, show default icon
        initialsElement.innerHTML = '<i class="fas fa-user"></i>';
        initialsElement.style.backgroundColor = '#ccc';
    }
}

// Check authentication state and display initials
onAuthStateChanged(auth, (user) => {
    if (user) {
        displayUserInitials(user);
    } else {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
    }
});

// Function to format date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    try {
        let date;
        if (timestamp instanceof Timestamp) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else if (timestamp._seconds) {
            date = new Date(timestamp._seconds * 1000);
        } else {
            date = new Date(timestamp);
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error, timestamp);
        return 'Invalid Date';
    }
}

// Function to show loading spinner
function showLoading() {
    const jobsContainer = document.getElementById('jobsContainer');
    if (jobsContainer) {
        jobsContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading jobs...</p>
            </div>
        `;
    }
}

// Function to create job card
function createJobCard(job, jobId) {
    return `
        <div class="job-card">
            <div class="job-header">
                <h3>${job.title || 'No Title'}</h3>
                <span class="company">${job.company || 'N/A'}</span>
            </div>
            <div class="job-details">
                <p><i class="fas fa-map-marker-alt"></i> ${job.location || 'N/A'}</p>
                <p><i class="fas fa-briefcase"></i> ${job.type || 'N/A'}</p>
                <p><i class="fas fa-calendar-alt"></i> Posted: ${formatDate(job.timestamp)}</p>
            </div>
            <div class="job-description">
                ${job.description ? job.description.substring(0, 150) + '...' : 'No description available.'}
            </div>
            <div class="job-footer">
                <div class="action-buttons">
                    <button class="view-details-btn" onclick="viewJobDetails('${jobId}')">
                        View Details
                    </button>
                    <button class="apply-now-btn" onclick="applyForJob('${jobId}')">
                        Apply Now
                    </button>
                </div>
                <div class="interaction-buttons">
                    <button class="btn-interact btn-share" onclick="shareJob('${jobId}')">
                        <i class="fas fa-share"></i>
                        Share
                    </button>
                    <button class="btn-interact btn-like" onclick="toggleLike('${jobId}')">
                        <i class="fas fa-heart"></i>
                        <span class="interaction-count">${job.likes || 0}</span>
                    </button>
                    <button class="btn-interact btn-interest" onclick="toggleInterest('${jobId}')">
                        <i class="fas fa-bookmark"></i>
                        <span class="interaction-count">${job.interests || 0}</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Function to share job
window.shareJob = async function(jobId) {
    try {
        const jobData = document.querySelector(`[data-job-id="${jobId}"]`);
        const title = jobData?.querySelector('h3')?.textContent || 'Job Opening';
        const url = window.location.href;
        
        if (navigator.share) {
            await navigator.share({
                title: title,
                text: 'Check out this job opportunity!',
                url: url
            });
        } else {
            // Fallback to copying to clipboard
            await navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    } catch (error) {
        console.error('Error sharing:', error);
    }
};

// Function to toggle like
window.toggleLike = async function(jobId) {
    const button = document.querySelector(`button.btn-like[onclick="toggleLike('${jobId}')"]`);
    button.classList.toggle('active');
    const countSpan = button.querySelector('.interaction-count');
    let count = parseInt(countSpan.textContent);
    countSpan.textContent = button.classList.contains('active') ? count + 1 : count - 1;
};

// Function to toggle interest
window.toggleInterest = async function(jobId) {
    const button = document.querySelector(`button.btn-interest[onclick="toggleInterest('${jobId}')"]`);
    button.classList.toggle('active');
    const countSpan = button.querySelector('.interaction-count');
    let count = parseInt(countSpan.textContent);
    countSpan.textContent = button.classList.contains('active') ? count + 1 : count - 1;
};

// Function to load jobs
async function loadJobs() {
    console.log('Starting to load jobs...'); // Debug log
    
    if (!db) {
        console.error('Firebase not initialized!');
        return;
    }

    const jobsContainer = document.getElementById('jobsContainer');
    if (!jobsContainer) {
        console.error('Jobs container not found!');
        return;
    }

    showLoading();

    try {
        // Get active jobs only
        const jobsRef = collection(db, 'jobs');
        const q = query(
            jobsRef,
            where('status', '==', 'active'),
            orderBy('timestamp', 'desc')
        );

        console.log('Fetching jobs from Firestore...'); // Debug log
        const querySnapshot = await getDocs(q);
        console.log('Found', querySnapshot.size, 'active jobs'); // Debug log

        if (querySnapshot.empty) {
            jobsContainer.innerHTML = `
                <div class="no-jobs">
                    <i class="fas fa-info-circle"></i>
                    <p>No jobs available at the moment.</p>
                </div>
            `;
            return;
        }

        // Clear container and add jobs
        jobsContainer.innerHTML = '';
        querySnapshot.forEach(doc => {
            const job = doc.data();
            console.log('Processing job:', doc.id, job); // Debug log
            const jobCard = createJobCard(job, doc.id);
            jobsContainer.innerHTML += jobCard;
        });

        console.log('Jobs loaded successfully'); // Debug log

    } catch (error) {
        console.error('Error loading jobs:', error);
        jobsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading jobs. Please try again later.</p>
            </div>
        `;
    }
}

// Function to view job details
function viewJobDetails(jobId) {
    // Store the job ID in session storage
    sessionStorage.setItem('selectedJobId', jobId);
    // Redirect to the job details page
    window.location.href = 'jobDetails.html';
}

// Function to handle job application
function applyForJob(jobId) {
    // Store the job ID in session storage
    sessionStorage.setItem('applyJobId', jobId);
    // Redirect to the application form
    window.location.href = 'jobApplication.html';
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const locationFilter = document.getElementById('locationFilter');
    const typeFilter = document.getElementById('typeFilter');

    const handleSearch = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const location = locationFilter.value.toLowerCase();
        const type = typeFilter.value.toLowerCase();

        const jobCards = document.querySelectorAll('.job-card');
        jobCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const jobLocation = card.querySelector('.job-details p:nth-child(1)').textContent.toLowerCase();
            const jobType = card.querySelector('.job-details p:nth-child(2)').textContent.toLowerCase();

            const matchesSearch = title.includes(searchTerm);
            const matchesLocation = location === '' || jobLocation.includes(location);
            const matchesType = type === '' || jobType.includes(type);

            card.style.display = matchesSearch && matchesLocation && matchesType ? 'block' : 'none';
        });
    };

    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (locationFilter) locationFilter.addEventListener('change', handleSearch);
    if (typeFilter) typeFilter.addEventListener('change', handleSearch);
}

// Make functions globally accessible
window.viewJobDetails = viewJobDetails;
window.applyForJob = applyForJob;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing jobs page');
    loadJobs();
    initializeSearch();
});
