// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBiQr7aHxdYxk8sCkHxMebkVyBEgXCnknU",
    authDomain: "admin-form-72be8.firebaseapp.com",
    projectId: "admin-form-72be8",
    storageBucket: "admin-form-72be8.appspot.com",
    messagingSenderId: "551532766399",
    appId: "1:551532766399:web:3df51af7e09f72d8cdc5da"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let adminData = []; // Store all admin data

// DOM Elements
const adminTableBody = document.getElementById('adminTableBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const loadingSpinner = document.getElementById('loadingSpinner');
const exportBtn = document.getElementById('exportBtn');
const refreshBtn = document.getElementById('refreshBtn');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const totalAdminsSpan = document.getElementById('totalAdmins');
const activeAdminsSpan = document.getElementById('activeAdmins');

// Event listeners
searchInput.addEventListener('input', filterData);
statusFilter.addEventListener('change', filterData);

// Fetch admin data
async function fetchAdminData() {
    showLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, "admins"));
        adminData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            status: doc.data().status || 'active' // Default to active if status not set
        }));
        filterData(); // Initial render with all data
    } catch (error) {
        console.error("Error fetching admin data:", error);
        showError("Failed to load admin data. Please try again later.");
    } finally {
        showLoading(false);
    }
}

// Filter data based on search input and status filter
function filterData() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;

    const filteredData = adminData.filter(admin => {
        const matchesSearch = 
            admin.fullName?.toLowerCase().includes(searchTerm) ||
            admin.surname?.toLowerCase().includes(searchTerm) ||
            admin.email?.toLowerCase().includes(searchTerm) ||
            admin.staffNumber?.toLowerCase().includes(searchTerm);

        const matchesStatus = 
            statusValue === 'all' || 
            admin.status === statusValue;

        return matchesSearch && matchesStatus;
    });

    renderAdminTable(filteredData);
}

// Render admin table
function renderAdminTable(data) {
    adminTableBody.innerHTML = '';
    
    if (data.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = '<td colspan="7" class="no-data">No matching records found</td>';
        adminTableBody.appendChild(noDataRow);
        return;
    }

    data.forEach(admin => {
        const row = document.createElement('tr');
        const registrationDate = admin.registrationDate ? 
            admin.registrationDate.toDate().toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }) : 'N/A';
        
        row.innerHTML = `
            <td>${admin.fullName || 'N/A'}</td>
            <td>${admin.surname || 'N/A'}</td>
            <td>${admin.email || 'N/A'}</td>
            <td>${admin.staffNumber || 'N/A'}</td>
            <td>${registrationDate}</td>
            <td>
                <span class="status-badge status-${admin.status}">
                    ${admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}
                </span>
            </td>
            <td>
                ${admin.status === 'active' ? 
                    `<button class="action-btn btn-block" onclick="handleStatusUpdate('${admin.id}', 'inactive')">
                        <i class="fas fa-ban"></i> Block
                    </button>` :
                    `<button class="action-btn btn-unblock" onclick="handleStatusUpdate('${admin.id}', 'active')">
                        <i class="fas fa-check"></i> Unblock
                    </button>`
                }
            </td>
        `;
        adminTableBody.appendChild(row);
    });

    // Update stats
    updateStats();
}

// Update stats
function updateStats() {
    if (totalAdminsSpan) totalAdminsSpan.textContent = adminData.length;
    if (activeAdminsSpan) activeAdminsSpan.textContent = adminData.filter(admin => admin.status === 'active').length;
}

// Refresh table data
window.refreshTable = async function() {
    searchInput.value = '';
    statusFilter.value = 'all';
    await fetchAdminData();
}

// Export to CSV
window.exportToCSV = function() {
    const headers = ['Full Name', 'Surname', 'Email', 'Staff Number', 'Registration Date', 'Status'];
    const filteredData = adminData.filter(admin => {
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;
        
        return (statusValue === 'all' || admin.status === statusValue) &&
               (admin.fullName?.toLowerCase().includes(searchTerm) ||
                admin.surname?.toLowerCase().includes(searchTerm) ||
                admin.email?.toLowerCase().includes(searchTerm) ||
                admin.staffNumber?.toLowerCase().includes(searchTerm));
    });

    const csvContent = [
        headers.join(','),
        ...filteredData.map(admin => [
            admin.fullName || '',
            admin.surname || '',
            admin.email || '',
            admin.staffNumber || '',
            admin.registrationDate ? new Date(admin.registrationDate.toDate()).toLocaleDateString() : '',
            admin.status || ''
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'admin_users.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Show error message
function showError(message) {
    console.error(message);
    // You can implement a more user-friendly error display method here
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
    });
}

// Update admin status
async function updateAdminStatus(adminId, newStatus) {
    try {
        const adminRef = doc(db, 'admins', adminId);
        await updateDoc(adminRef, { status: newStatus });
        
        // Update local data
        const adminIndex = adminData.findIndex(admin => admin.id === adminId);
        if (adminIndex !== -1) {
            adminData[adminIndex].status = newStatus;
            updateStats();
            filterData();
        }

        Swal.fire({
            title: 'Success!',
            text: `Admin status updated to ${newStatus}`,
            icon: 'success',
            confirmButtonText: 'Okay'
        });
    } catch (error) {
        console.error("Error updating admin status: ", error);
        Swal.fire({
            title: 'Error!',
            text: `Failed to update admin status: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'Okay'
        });
    }
}

// Handle status update
window.handleStatusUpdate = async (adminId, newStatus) => {
    const result = await Swal.fire({
        title: 'Confirm Status Update',
        text: `Are you sure you want to ${newStatus === 'active' ? 'unblock' : 'block'} this admin?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#007272',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!'
    });

    if (result.isConfirmed) {
        await updateAdminStatus(adminId, newStatus);
    }
};

// Show/hide loading spinner
function showLoading(show) {
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }
}

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
        window.location.href = 'adminLogin.html';
    } catch (error) {
        console.error('Error logging out due to inactivity: ', error);
    }
}

// Event listeners to reset the timer on user activity
window.addEventListener('mousemove', resetInactivityTimer);
window.addEventListener('click', resetInactivityTimer);
window.addEventListener('keypress', resetInactivityTimer);

// Start the timer on page load
resetInactivityTimer();

// Initialize the page
document.addEventListener('DOMContentLoaded', fetchAdminData);