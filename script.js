/**
 * Lost and Found Application JavaScript
 * Handles all frontend functionality and API calls to Java backend
 */

// Global application state
let currentView = 'home';
let items = [];
let filteredItems = [];

// API Configuration - Update these URLs to match your Java backend
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api', // Your Java backend URL
    ENDPOINTS: {
        ITEMS: '/items',
        UPLOAD: '/upload',
        CONTACT: '/contact'
    }
};

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize application on load
 */
function initializeApp() {
    loadItems();
    setupEventListeners();
    updateStats();
    loadRecentItems();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Form submission
    document.getElementById('report-form').addEventListener('submit', handleFormSubmit);
    
    // Search input
    document.getElementById('search-input').addEventListener('input', debounce(filterItems, 300));
}

/**
 * Navigation functions
 */
function showHome() {
    switchView('home');
    updateStats();
    loadRecentItems();
}

function showBrowse() {
    switchView('browse');
    loadItems();
    populateCategoryFilter();
}

function showReportForm(type) {
    switchView('report');
    setupReportForm(type);
}

function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
    
    // Show selected view
    document.getElementById(viewName + '-view').classList.remove('hidden');
    currentView = viewName;
}

/**
 * Setup report form for lost or found items
 */
function setupReportForm(type) {
    const formTitle = document.getElementById('form-title');
    const itemTypeInput = document.getElementById('item-type');
    const submitBtn = document.getElementById('submit-btn');
    
    itemTypeInput.value = type;
    
    if (type === 'lost') {
        formTitle.textContent = 'Report Lost Item';
        formTitle.className = 'text-red-600';
        submitBtn.textContent = 'Report Lost Item';
        submitBtn.className = 'btn btn-lost full-width';
    } else {
        formTitle.textContent = 'Report Found Item';
        formTitle.className = 'text-green-600';
        submitBtn.textContent = 'Report Found Item';
        submitBtn.className = 'btn btn-found full-width';
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const itemData = {};
    
    // Extract form data
    for (let [key, value] of formData.entries()) {
        if (key !== 'image') {
            itemData[key] = value;
        }
    }
    
    // Handle image upload
    const imageFile = formData.get('image');
    if (imageFile && imageFile.size > 0) {
        try {
            const imageUrl = await uploadImage(imageFile);
            itemData.imageUrl = imageUrl;
        } catch (error) {
            console.error('Image upload failed:', error);
            alert('Failed to upload image. Please try again.');
            return;
        }
    }
    
    // Add timestamp and status
    itemData.dateReported = new Date().toISOString();
    itemData.status = 'active';
    itemData.id = Date.now().toString(); // Temporary ID for local storage
    
    try {
        showLoading(true);
        await submitItem(itemData);
        
        // Reset form and show success
        document.getElementById('report-form').reset();
        document.getElementById('image-preview').classList.add('hidden');
        
        alert('Item reported successfully!');
        showBrowse();
    } catch (error) {
        console.error('Failed to submit item:', error);
        alert('Failed to submit item. Please try again.');
    } finally {
        showLoading(false);
    }
}

/**
 * API Functions - These will connect to your Java backend
 */

/**
 * Load items from backend
 */
async function loadItems() {
    try {
        showLoading(true);
        
        // For now, using localStorage. Replace with actual API call
        items = JSON.parse(localStorage.getItem('lostFoundItems') || '[]');
        
        // TODO: Replace with actual API call to Java backend
        // const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ITEMS}`);
        // items = await response.json();
        
        filteredItems = items.filter(item => item.status === 'active');
        renderItems();
    } catch (error) {
        console.error('Failed to load items:', error);
        items = [];
        filteredItems = [];
    } finally {
        showLoading(false);
    }
}

/**
 * Submit new item to backend
 */
async function submitItem(itemData) {
    try {
        // For now, using localStorage. Replace with actual API call
        const existingItems = JSON.parse(localStorage.getItem('lostFoundItems') || '[]');
        existingItems.unshift(itemData);
        localStorage.setItem('lostFoundItems', JSON.stringify(existingItems));
        
        // TODO: Replace with actual API call to Java backend
        // const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ITEMS}`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(itemData)
        // });
        // 
        // if (!response.ok) {
        //     throw new Error('Failed to submit item');
        // }
        
        items = JSON.parse(localStorage.getItem('lostFoundItems') || '[]');
    } catch (error) {
        throw error;
    }
}

/**
 * Upload image to backend
 */
async function uploadImage(file) {
    try {
        // For now, converting to base64 for localStorage
        return await convertToBase64(file);
        
        // TODO: Replace with actual API call to Java backend
        // const formData = new FormData();
        // formData.append('image', file);
        // 
        // const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD}`, {
        //     method: 'POST',
        //     body: formData
        // });
        // 
        // if (!response.ok) {
        //     throw new Error('Upload failed');
        // }
        // 
        // const result = await response.json();
        // return result.imageUrl;
    } catch (error) {
        throw error;
    }
}

/**
 * Convert file to base64 for temporary storage
 */
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

/**
 * Image preview functionality
 */
function previewImage(input) {
    const file = input.files[0];
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        preview.classList.add('hidden');
    }
}

/**
 * Filter and search functionality
 */
function filterItems() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const typeFilter = document.getElementById('type-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    
    filteredItems = items.filter(item => {
        if (item.status !== 'active') return false;
        
        const matchesSearch = !searchTerm || 
            item.title.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.location.toLowerCase().includes(searchTerm);
        
        const matchesType = typeFilter === 'all' || item.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        
        return matchesSearch && matchesType && matchesCategory;
    });
    
    renderItems();
}

/**
 * Populate category filter dropdown
 */
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    const categories = ['all', ...new Set(items.map(item => item.category))];
    
    categoryFilter.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category === 'all' ? 'All Categories' : category;
        categoryFilter.appendChild(option);
    });
}

/**
 * Render items in the grid
 */
function renderItems() {
    const itemsGrid = document.getElementById('items-grid');
    const noResults = document.getElementById('no-results');
    const resultsCount = document.getElementById('results-count');
    
    resultsCount.textContent = `${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''} found`;
    
    if (filteredItems.length === 0) {
        itemsGrid.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    
    itemsGrid.innerHTML = filteredItems.map(item => `
        <div class="item-card">
            <div class="item-card-header">
                <div class="item-card-title">
                    <h3>${escapeHtml(item.title)}</h3>
                    <span class="item-badge ${item.type}">${item.type.toUpperCase()}</span>
                </div>
                <span class="item-category">${escapeHtml(item.category)}</span>
            </div>
            <div class="item-card-content">
                ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" class="item-image">` : ''}
                <p class="item-description">${escapeHtml(item.description)}</p>
                <div class="item-details">
                    <div class="item-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${escapeHtml(item.location)}</span>
                    </div>
                    <div class="item-detail">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(item.dateReported)}</span>
                    </div>
                    <div class="item-detail">
                        <i class="fas fa-user"></i>
                        <span>${escapeHtml(item.contactName)}</span>
                    </div>
                </div>
                <button class="btn item-contact-btn ${item.type}" onclick="showContactModal('${item.id}')">
                    <i class="fas fa-envelope"></i>
                    Contact ${item.type === 'lost' ? 'Owner' : 'Finder'}
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Load and display recent items on home page
 */
function loadRecentItems() {
    const recentItemsContainer = document.getElementById('recent-items');
    const recentItems = items.slice(0, 5);
    
    if (recentItems.length === 0) {
        recentItemsContainer.innerHTML = '<p class="text-center text-gray-500">No items reported yet</p>';
        return;
    }
    
    recentItemsContainer.innerHTML = recentItems.map(item => `
        <div class="recent-item">
            <div class="recent-item-info">
                <span class="recent-item-badge ${item.type}">${item.type.toUpperCase()}</span>
                <div class="recent-item-details">
                    <h4>${escapeHtml(item.title)}</h4>
                    <p>${escapeHtml(item.location)}</p>
                </div>
            </div>
            <div class="recent-item-date">
                ${formatDate(item.dateReported)}
            </div>
        </div>
    `).join('');
}

/**
 * Update statistics on home page
 */
function updateStats() {
    const stats = {
        total: items.length,
        lost: items.filter(item => item.type === 'lost' && item.status === 'active').length,
        found: items.filter(item => item.type === 'found' && item.status === 'active').length,
        resolved: items.filter(item => item.status === 'resolved').length
    };
    
    document.getElementById('total-items').textContent = stats.total;
    document.getElementById('lost-items').textContent = stats.lost;
    document.getElementById('found-items').textContent = stats.found;
    document.getElementById('resolved-items').textContent = stats.resolved;
}

/**
 * Show contact modal
 */
function showContactModal(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const modal = document.getElementById('contact-modal');
    const itemTitle = document.getElementById('contact-item-title');
    const contactName = document.getElementById('contact-name-display');
    const emailLink = document.getElementById('contact-email-link');
    const phoneLink = document.getElementById('contact-phone-link');
    const phoneSection = document.getElementById('phone-section');
    const sendEmailBtn = document.getElementById('send-email-btn');
    
    // Populate modal content
    itemTitle.textContent = `Get in touch about "${item.title}"`;
    contactName.textContent = item.contactName;
    
    // Email
    const emailSubject = encodeURIComponent(`${item.type === 'lost' ? 'Found' : 'About'} your ${item.title}`);
    const emailHref = `mailto:${item.contactEmail}?subject=${emailSubject}`;
    emailLink.href = emailHref;
    emailLink.textContent = item.contactEmail;
    
    // Phone (optional)
    if (item.contactPhone) {
        phoneLink.href = `tel:${item.contactPhone}`;
        phoneLink.textContent = item.contactPhone;
        phoneSection.classList.remove('hidden');
    } else {
        phoneSection.classList.add('hidden');
    }
    
    // Send email button
    sendEmailBtn.onclick = () => {
        window.location.href = emailHref;
    };
    
    modal.classList.remove('hidden');
}

/**
 * Close contact modal
 */
function closeContactModal() {
    document.getElementById('contact-modal').classList.add('hidden');
}

/**
 * Show/hide loading spinner
 */
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

/**
 * Utility functions
 */

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('contact-modal');
    if (e.target === modal) {
        closeContactModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeContactModal();
    }
});