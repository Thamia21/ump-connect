// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBqGYTvpjh5iZmagOrJQj0qYxL7lxlrKyU",
    authDomain: "admin-form-72be8.firebaseapp.com",
    projectId: "admin-form-72be8",
    storageBucket: "admin-form-72be8.appspot.com",
    messagingSenderId: "1062264016941",
    appId: "1:1062264016941:web:b0e7f70cf8df6323f0c43e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global variables
let allUsers = [];
let filteredUsers = [];

// DOM Elements
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const userTableBody = document.getElementById('userTableBody');
const loadingSpinner = document.getElementById('loadingSpinner');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setupEventListeners();
});

function setupEventListeners() {
    searchInput.addEventListener('input', handleSearch);
    statusFilter.addEventListener('change', handleFilter);
}

// Load users from Firestore
async function loadUsers() {
    showLoadingSpinner();
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        allUsers = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        filteredUsers = [...allUsers];
        renderUsers();
    } catch (error) {
        console.error("Error loading users:", error);
        showError("Failed to load users. Please try again.");
    } finally {
        hideLoadingSpinner();
    }
}

// Search and Filter Functions
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    applyFilters(searchTerm, statusFilter.value);
}

function handleFilter() {
    const searchTerm = searchInput.value.toLowerCase();
    applyFilters(searchTerm, statusFilter.value);
}

function applyFilters(searchTerm, statusValue) {
    filteredUsers = allUsers.filter(user => {
        const matchesSearch = 
            (user.studentNumber?.toLowerCase().includes(searchTerm) ||
            user.firstName?.toLowerCase().includes(searchTerm) ||
            user.lastName?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm) ||
            user.phoneNumber?.toLowerCase().includes(searchTerm));

        const matchesStatus = statusValue === 'all' || 
            (statusValue === 'active' && !user.blocked) ||
            (statusValue === 'inactive' && user.blocked);

        return matchesSearch && matchesStatus;
    });

    renderUsers();
}

// Render Functions
function renderUsers() {
    userTableBody.innerHTML = '';
    
    if (filteredUsers.length === 0) {
        userTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center;">No users found</td>
            </tr>`;
        return;
    }

    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.studentNumber || ''}</td>
            <td>${user.firstName || ''}</td>
            <td>${user.lastName || ''}</td>
            <td>${user.email || ''}</td>
            <td>${user.phoneNumber || ''}</td>
            <td>${formatDate(user.registrationDate)}</td>
            <td>
                <span class="status-badge ${user.blocked ? 'status-inactive' : 'status-active'}">
                    ${user.blocked ? 'Inactive' : 'Active'}
                </span>
            </td>
            <td>
                <button class="action-btn ${user.blocked ? 'unblock-btn' : 'block-btn'}" 
                        onclick="window.handleBlockUnblock('${user.id}', ${user.blocked})">
                    <i class="fas fa-${user.blocked ? 'unlock' : 'lock'}"></i>
                    ${user.blocked ? 'Unblock' : 'Block'}
                </button>
            </td>
        `;
        userTableBody.appendChild(row);
    });
}

// Block/Unblock User
window.handleBlockUnblock = async (userId, currentStatus) => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            blocked: !currentStatus
        });

        // Update local data
        const userIndex = allUsers.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            allUsers[userIndex].blocked = !currentStatus;
            handleFilter(); // Reapply filters
        }

        showSuccess(`User successfully ${currentStatus ? 'unblocked' : 'blocked'}`);
    } catch (error) {
        console.error("Error updating user status:", error);
        showError("Failed to update user status. Please try again.");
    }
};

// Utility Functions
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showLoadingSpinner() {
    loadingSpinner.style.display = 'flex';
}

function hideLoadingSpinner() {
    loadingSpinner.style.display = 'none';
}

// Refresh table
window.refreshTable = () => {
    loadUsers();
};

// Export to CSV
window.exportToCSV = () => {
    const headers = ['Student Number', 'First Name', 'Last Name', 'Email', 'Phone Number', 'Registration Date', 'Status'];
    const csvContent = [
        headers.join(','),
        ...filteredUsers.map(user => [
            user.studentNumber || '',
            user.firstName || '',
            user.lastName || '',
            user.email || '',
            user.phoneNumber || '',
            formatDate(user.registrationDate),
            user.blocked ? 'Inactive' : 'Active'
        ].map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'users.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Notification Functions
function showSuccess(message) {
    Swal.fire({
        title: 'Success',
        text: message,
        icon: 'success',
        confirmButtonColor: '#007272'
    });
}

function showError(message) {
    Swal.fire({
        title: 'Error',
        text: message,
        icon: 'error',
        confirmButtonColor: '#007272'
    });
}