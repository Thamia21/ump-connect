// Utility functions for UMP CONNECT WEBSITE

// Firebase initialization
export const initializeFirebase = (config) => {
    try {
        const app = initializeApp(config);
        const db = getFirestore(app);
        const storage = getStorage(app);
        return { app, db, storage };
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        throw error;
    }
};

// Show notification using SweetAlert2
export const showNotification = (message, type = 'success') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: type,
        title: message
    });
};

// Format date to local string
export const formatDate = (date, locale = 'en-GB') => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(locale);
};

// Escape HTML to prevent XSS
export const escapeHtml = (unsafe) => {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Validate email format
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
export const isStrongPassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return (
        password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar
    );
};

// Create loading spinner
export const createLoadingSpinner = () => {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    return spinner;
};

// Show loading state
export const showLoading = (element, message = 'Loading...') => {
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading-container';
    loadingContainer.style.textAlign = 'center';
    
    const spinner = createLoadingSpinner();
    const text = document.createElement('div');
    text.textContent = message;
    text.style.marginTop = '10px';
    
    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(text);
    
    element.innerHTML = '';
    element.appendChild(loadingContainer);
    
    return loadingContainer;
};

// Hide loading state
export const hideLoading = (element, loadingContainer) => {
    if (loadingContainer && element.contains(loadingContainer)) {
        element.removeChild(loadingContainer);
    }
};

// Debounce function for search inputs
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Handle fetch errors
export const handleFetchError = (error) => {
    console.error('Fetch error:', error);
    showNotification(
        error.message || 'An error occurred while fetching data',
        'error'
    );
    throw error;
};

// Parse URL parameters
export const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
};

// Format file size
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate file type
export const isValidFileType = (file, allowedTypes) => {
    return allowedTypes.includes(file.type);
};

// Create modal
export const createModal = (title, content) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${escapeHtml(title)}</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.onclick = () => modal.remove();
    
    document.body.appendChild(modal);
    return modal;
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard!', 'success');
    } catch (error) {
        console.error('Failed to copy:', error);
        showNotification('Failed to copy to clipboard', 'error');
    }
};

// Download file
export const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Form validation
export const validateForm = (form, rules) => {
    const errors = {};
    
    for (const [field, rule] of Object.entries(rules)) {
        const value = form[field]?.value;
        
        if (rule.required && !value) {
            errors[field] = `${field} is required`;
        } else if (rule.minLength && value.length < rule.minLength) {
            errors[field] = `${field} must be at least ${rule.minLength} characters`;
        } else if (rule.maxLength && value.length > rule.maxLength) {
            errors[field] = `${field} must be less than ${rule.maxLength} characters`;
        } else if (rule.pattern && !rule.pattern.test(value)) {
            errors[field] = `${field} format is invalid`;
        }
    }
    
    return errors;
};
