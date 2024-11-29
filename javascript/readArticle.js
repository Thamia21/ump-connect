// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Your web app's Firebase configuration
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

// Existing code (no changes required, but ensure it matches the earlier provided logic)

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (articleId) {
        const articleRef = doc(db, 'news', articleId); // Fetch from 'news' collection
        const docSnap = await getDoc(articleRef);

        if (docSnap.exists()) {
            const article = docSnap.data();
            document.getElementById('articleTitle').innerText = article.title;
            document.getElementById('managerName').innerText = article.managerName || "Unknown Manager";
            document.getElementById('articleDate').innerText = article.date;
            document.getElementById('articleImage').src = article.imageURL;
            document.getElementById('articleIntro').innerText = article.intro;
            document.getElementById('articleSummary').innerText = article.summary;
            document.getElementById('articleDescription').innerText = article.description;
        } else {
            console.error("No such document!");
        }
    } else {
        console.error("No article ID provided in the URL.");
    }
});

