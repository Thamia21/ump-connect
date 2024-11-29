import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'managerLogin.html';
    }
});

// Load news articles
window.loadNews = async function() {
    try {
        const newsQuery = query(collection(db, 'news'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(newsQuery);
        const tableBody = document.getElementById('newsTableBody');
        tableBody.innerHTML = '';

        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No news articles found</td></tr>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const news = doc.data();
            console.log('News data:', news);

            // Format date using the timestamp field
            const date = news.timestamp ? new Date(news.timestamp.toDate()).toLocaleDateString() : 
                        news.date ? new Date(news.date).toLocaleDateString() : 
                        'No date';
            
            // Get image URL from the correct field (uppercase URL)
            const imageUrl = news.imageURL || news.imageUrl || news.image || '../images/default-news.png';
            
            // Get status with default value
            const status = news.status || 'Pending';
            
            console.log('Formatted date:', date);
            console.log('Image URL:', imageUrl);
            console.log('Status:', status);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${news.title || 'No title'}</td>
                <td>${news.description ? news.description.substring(0, 100) + (news.description.length > 100 ? '...' : '') : 'No description'}</td>
                <td>${date}</td>
                <td><img src="${imageUrl}" alt="News Image" onerror="this.src='../images/default-news.png'"></td>
                <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="editNews('${doc.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteNews('${doc.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading news:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load news articles'
        });
    }
}

// Search news
window.searchNews = function() {
    const searchInput = document.getElementById('searchInput');
    const filter = searchInput.value.toLowerCase();
    const tableBody = document.getElementById('newsTableBody');
    const rows = tableBody.getElementsByTagName('tr');

    for (let row of rows) {
        const title = row.cells[0].textContent.toLowerCase();
        const description = row.cells[1].textContent.toLowerCase();
        const shouldShow = title.includes(filter) || description.includes(filter);
        row.style.display = shouldShow ? '' : 'none';
    }
};

// Delete news
window.deleteNews = async function(newsId) {
    try {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            await deleteDoc(doc(db, 'news', newsId));
            await loadNews(); // Reload the table
            Swal.fire(
                'Deleted!',
                'News article has been deleted.',
                'success'
            );
        }
    } catch (error) {
        console.error('Error deleting news:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete news article'
        });
    }
};

// Edit news
window.editNews = function(newsId) {
    // Store the news ID in session storage and redirect to the edit page
    sessionStorage.setItem('editNewsId', newsId);
    window.location.href = 'managerUpdatesForm.html?edit=' + newsId;
};

// Logout function
window.logout = async function() {
    try {
        await signOut(auth);
        window.location.href = 'managerLogin.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
};

// Load news when the page loads
document.addEventListener('DOMContentLoaded', loadNews);

// Add search input event listener
document.getElementById('searchInput').addEventListener('input', searchNews);
