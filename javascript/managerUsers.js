// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

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

let managerData = []; // Store all manager data

// DOM Elements
const managerTableBody = document.getElementById('managerTableBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');

// Event listeners
searchInput.addEventListener('input', filterData);
statusFilter.addEventListener('change', filterData);

// Fetch manager data
async function fetchManagerData() {
    showLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, "event-manager"));
        managerData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                staffNumber: data.staffNumber || 'N/A',
                firstName: data.firstName || 'N/A',
                lastName: data.lastName || 'N/A',
                email: data.email || 'N/A',
                createdAt: data.createdAt || null,
                status: data.status || 'active'
            };
        });
        filterData(); // Initial render with all data
    } catch (error) {
        console.error("Error fetching manager data:", error);
        showError("Failed to load manager data. Please try again later.");
    } finally {
        showLoading(false);
    }
}

// Filter data based on search input and status filter
function filterData() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;

    const filteredData = managerData.filter(manager => {
        const matchesSearch = 
            manager.firstName?.toLowerCase().includes(searchTerm) ||
            manager.lastName?.toLowerCase().includes(searchTerm) ||
            manager.email?.toLowerCase().includes(searchTerm) ||
            manager.staffNumber?.toLowerCase().includes(searchTerm);

        const matchesStatus = 
            statusValue === 'all' || 
            manager.status === statusValue;

        return matchesSearch && matchesStatus;
    });

    renderManagerTable(filteredData);
}

// Render manager table
function renderManagerTable(data) {
    managerTableBody.innerHTML = '';
    
    if (data.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = '<td colspan="7" class="no-data">No matching records found</td>';
        managerTableBody.appendChild(noDataRow);
        return;
    }

    data.forEach(manager => {
        const row = document.createElement('tr');
        const registrationDate = manager.createdAt ? new Date(manager.createdAt).toLocaleDateString() : 'N/A';
        
        row.innerHTML = `
            <td>${manager.staffNumber}</td>
            <td>${manager.firstName}</td>
            <td>${manager.lastName}</td>
            <td>${manager.email}</td>
            <td>${registrationDate}</td>
            <td>
                <span class="status-badge ${manager.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${manager.status === 'active' ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                ${manager.status === 'active' ? 
                    `<button class="action-btn block-btn" onclick="handleStatusUpdate('${manager.id}', 'inactive')">
                        <i class="fas fa-ban"></i> Block
                    </button>` :
                    `<button class="action-btn unblock-btn" onclick="handleStatusUpdate('${manager.id}', 'active')">
                        <i class="fas fa-check"></i> Unblock
                    </button>`
                }
            </td>
        `;
        managerTableBody.appendChild(row);
    });
}

// Refresh table data
window.refreshTable = async function() {
    searchInput.value = '';
    statusFilter.value = 'all';
    await fetchManagerData();
}

// Export to CSV
window.exportToCSV = function() {
    const headers = ['Staff Number', 'Full Name', 'Surname', 'Email', 'Registration Date', 'Status'];
    const filteredData = managerData.filter(manager => {
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;
        
        return (statusValue === 'all' || manager.status === statusValue) &&
               (manager.firstName?.toLowerCase().includes(searchTerm) ||
                manager.lastName?.toLowerCase().includes(searchTerm) ||
                manager.email?.toLowerCase().includes(searchTerm) ||
                manager.staffNumber?.toLowerCase().includes(searchTerm));
    });

    const csvContent = [
        headers.join(','),
        ...filteredData.map(manager => [
            manager.staffNumber || '',
            manager.firstName || '',
            manager.lastName || '',
            manager.email || '',
            manager.createdAt ? new Date(manager.createdAt).toLocaleDateString() : '',
            manager.status || ''
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'manager_users.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Show error message
function showError(message) {
    console.error(message);
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
    });
}

// Update manager status
async function updateManagerStatus(managerId, newStatus) {
    try {
        const managerRef = doc(db, 'event-manager', managerId);
        await updateDoc(managerRef, { status: newStatus });
        
        // Update local data
        const managerIndex = managerData.findIndex(manager => manager.id === managerId);
        if (managerIndex !== -1) {
            managerData[managerIndex].status = newStatus;
            filterData();
        }

        Swal.fire({
            title: 'Success!',
            text: `Manager status updated to ${newStatus}`,
            icon: 'success',
            confirmButtonText: 'Okay'
        });
    } catch (error) {
        console.error("Error updating manager status: ", error);
        Swal.fire({
            title: 'Error!',
            text: `Failed to update manager status: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'Okay'
        });
    }
}

// Handle status update
window.handleStatusUpdate = async (managerId, newStatus) => {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to ${newStatus === 'active' ? 'unblock' : 'block'} this manager?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: `Yes, ${newStatus === 'active' ? 'unblock' : 'block'} it!`,
        cancelButtonText: 'No, cancel!'
    });

    if (result.isConfirmed) {
        await updateManagerStatus(managerId, newStatus);
    }
};

// Show/hide loading spinner
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', fetchManagerData);