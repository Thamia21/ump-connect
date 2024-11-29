import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs,
    doc,
    getDoc,
    addDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

// Initialize Firebase
let app;
let db;
let auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

// Function to load jobs
async function loadJobs() {
    console.log('Starting to load jobs...'); // Debug log
    
    if (!db) {
        console.error('Firebase not initialized!');
        return;
    }

    const jobsTableBody = document.getElementById('jobsTableBody');
    if (!jobsTableBody) {
        console.error('Jobs table body element not found!');
        return;
    }

    jobsTableBody.innerHTML = '';
    toggleLoading(true);

    try {
        // Get all jobs from the jobs collection
        const jobsRef = collection(db, 'jobs');
        const querySnapshot = await getDocs(jobsRef);
        
        console.log('Found', querySnapshot.size, 'jobs'); // Debug log

        if (querySnapshot.empty) {
            console.log('No jobs found in collection'); // Debug log
            jobsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No jobs available</td></tr>';
            return;
        }

        // Process each job document
        querySnapshot.forEach(doc => {
            const job = doc.data();
            console.log('Job data:', job); // Debug log

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${job.title || 'No Title'}</td>
                <td>${job.location || 'N/A'}</td>
                <td>${job.type || 'N/A'}</td>
                <td>${formatDate(job.timestamp)}</td>
                <td>${createStatusBadge(job.status || 'active')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="view-btn" onclick="viewJob('${doc.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="delete-btn" onclick="deleteJob('${doc.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            jobsTableBody.appendChild(row);
        });

        console.log('Jobs table populated successfully'); // Debug log

    } catch (error) {
        console.error('Error loading jobs:', error);
        jobsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error loading jobs: ' + error.message + '</td></tr>';
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load jobs: ' + error.message
        });
    } finally {
        toggleLoading(false);
    }
}

// Helper function to format date
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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error, timestamp);
        return 'Invalid Date';
    }
}

// Function to create status badge
function createStatusBadge(status) {
    const statusLower = (status || 'active').toLowerCase();
    return `<span class="status-badge ${statusLower}">${statusLower}</span>`;
}

// Function to show/hide loading spinner
function toggleLoading(show) {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
}

// Function to view job details
async function viewJob(jobId) {
    try {
        const jobDoc = await getDoc(doc(db, 'jobs', jobId));
        if (jobDoc.exists()) {
            const job = jobDoc.data();
            Swal.fire({
                title: job.title,
                html: `
                    <div style="text-align: left;">
                        <p><strong>Location:</strong> ${job.location || 'N/A'}</p>
                        <p><strong>Type:</strong> ${job.type || 'N/A'}</p>
                        <p><strong>Posted:</strong> ${formatDate(job.timestamp)}</p>
                        <p><strong>Description:</strong></p>
                        <p>${job.description || 'No description available.'}</p>
                        <p><strong>Requirements:</strong></p>
                        <ul>
                            ${job.requirements ? job.requirements.split('\n').map(req => `<li>${req}</li>`).join('') : '<li>No requirements specified.</li>'}
                        </ul>
                    </div>
                `,
                confirmButtonColor: '#007272'
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Job not found'
            });
        }
    } catch (error) {
        console.error('Error viewing job:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load job details: ' + error.message
        });
    }
}

// Function to delete job
async function deleteJob(jobId) {
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
            await deleteDoc(doc(db, 'jobs', jobId));
            await loadJobs(); // Reload the jobs list
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Job deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting job:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to delete job: ' + error.message
            });
        }
    }
}

// Function to handle job submission
async function handleJobSubmission(event) {
    event.preventDefault();
    console.log('Handling job submission...'); // Debug log

    // Get form values
    const title = document.getElementById('jobTitle').value.trim();
    const location = document.getElementById('location').value.trim();
    const type = document.getElementById('jobType').value;
    const description = document.getElementById('jobDescription').value.trim();
    const requirements = document.getElementById('requirements').value.trim();
    const status = document.getElementById('jobStatus').value;

    // Validate required fields
    if (!title || !location || !type || !description || !requirements) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please fill in all required fields'
        });
        return;
    }

    toggleLoading(true);

    try {
        // Create job object
        const jobData = {
            title,
            location,
            type,
            description,
            requirements,
            status,
            timestamp: serverTimestamp()
        };

        console.log('Job data to submit:', jobData); // Debug log

        // Add to Firestore
        const docRef = await addDoc(collection(db, 'jobs'), jobData);
        console.log('Job added with ID:', docRef.id); // Debug log

        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Job listing added successfully'
        });

        // Reset form
        document.getElementById('jobForm').reset();
        
        // Reload jobs list
        loadJobs();

    } catch (error) {
        console.error('Error adding job:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to add job: ' + error.message
        });
    } finally {
        toggleLoading(false);
    }
}

// Make functions globally accessible
window.loadJobs = loadJobs;
window.viewJob = viewJob;
window.deleteJob = deleteJob;
window.handleJobSubmission = handleJobSubmission;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing admin jobs panel');
    
    // Initialize job form
    const jobForm = document.getElementById('jobForm');
    if (jobForm) {
        jobForm.addEventListener('submit', handleJobSubmission);
    }
    
    // Load initial jobs
    loadJobs();

    // Initialize search functionality
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            console.log('Search input changed:', searchInput.value);
            loadJobs();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            console.log('Status filter changed:', statusFilter.value);
            loadJobs();
        });
    }

    // Check authentication
    if (auth) {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                console.log('No user signed in, redirecting to login');
                window.location.href = 'login.html';
            } else {
                console.log('User is signed in:', user.uid);
            }
        });
    } else {
        console.error('Auth not initialized!');
    }
});