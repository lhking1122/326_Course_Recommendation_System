// Database configuration
const DB_NAME = 'CourseRecommenderDB';
const DB_VERSION = 1;
const STORE_NAME = 'userProfile';

// Check for IndexedDB support
if (!window.indexedDB) {
    console.warn("IndexedDB is not supported in this browser. Profile data won't be saved.");
}

// Open or create the database
function openDatabase() {
    if (!window.indexedDB) {
        return Promise.reject("IndexedDB not supported");
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

// Save profile data to IndexedDB
function saveProfileData(data) {
    return openDatabase().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            // Use fixed ID since we're only storing one profile
            const request = store.put({ id: 1, ...data });
            
            request.onerror = (event) => {
                console.error('Save error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = () => {
                resolve();
            };
        });
    });
}

// Load profile data from IndexedDB
function loadProfileData() {
    return openDatabase().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(1); // Get the profile with ID 1
            
            request.onerror = (event) => {
                console.error('Load error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                resolve(event.target.result || {});
            };
        });
    });
}

// Main profile page setup function
function setupProfilePage() {
    const selectBox = document.getElementById('my-profile-page-interestsSelect');
    const optionsContainer = document.getElementById('my-profile-page-interestsOptions');
    if (!selectBox || !optionsContainer) return;

    const options = document.querySelectorAll('.my-profile-page-option');
    const selectedTagsContainer = document.getElementById('my-profile-page-selectedTags');
    const hiddenInput = document.getElementById('my-profile-page-interests');
    const saveButton = document.querySelector('button[type="submit"]');

    let selectedInterests = [];

    // Toggle dropdown visibility
    selectBox.addEventListener('click', function() {
        optionsContainer.classList.toggle('show');
    });

    // Handle option selection
    options.forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');

            if (selectedInterests.includes(value)) {
                // Remove if already selected
                selectedInterests = selectedInterests.filter(item => item !== value);
                this.classList.remove('selected');
            } else {
                // Add if not selected
                selectedInterests.push(value);
                this.classList.add('selected');
            }

            updateSelectedTags();
            updateHiddenInput();
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!selectBox.contains(e.target) && !optionsContainer.contains(e.target)) {
            optionsContainer.classList.remove('show');
        }
    });

    // Update displayed tags
    function updateSelectedTags() {
        selectedTagsContainer.innerHTML = '';

        if (selectedInterests.length === 0) {
            selectedTagsContainer.innerHTML = '<span style="color: #999;">Select interests...</span>';
            return;
        }

        selectedInterests.forEach(interest => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `${interest}<span class="tag-remove" data-value="${interest}">×</span>`;
            selectedTagsContainer.appendChild(tag);
        });

        // Add remove tag functionality
        document.querySelectorAll('.tag-remove').forEach(removeBtn => {
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const value = this.getAttribute('data-value');
                selectedInterests = selectedInterests.filter(item => item !== value);

                // Update option states
                options.forEach(option => {
                    if (option.getAttribute('data-value') === value) {
                        option.classList.remove('selected');
                    }
                });

                updateSelectedTags();
                updateHiddenInput();
            });
        });
    }

    // Update hidden input with selected interests
    function updateHiddenInput() {
        hiddenInput.value = selectedInterests.join(',');
    }

    // Load saved profile data when page loads
    loadProfileData().then(savedData => {
        if (savedData) {
            // Fill form fields with saved data
            if (savedData.name) document.getElementById('my-profile-page-name').value = savedData.name;
            if (savedData.email) document.getElementById('my-profile-page-email').value = savedData.email;
            if (savedData.phone) document.getElementById('my-profile-page-phone').value = savedData.phone;
            if (savedData.gradYear) document.getElementById('my-profile-page-grad_year').value = savedData.gradYear;
            if (savedData.contact) document.getElementById('my-profile-page-contact').value = savedData.contact;
            
            // Handle interests
            if (savedData.interests) {
                selectedInterests = savedData.interests.split(',');
                // Mark options as selected
                options.forEach(option => {
                    const value = option.getAttribute('data-value');
                    if (selectedInterests.includes(value)) {
                        option.classList.add('selected');
                    }
                });
                updateSelectedTags();
                updateHiddenInput();
            }
            
            // Update summary with saved data
            updateProfileSummary(savedData);
        }
    }).catch(error => {
        console.error('Failed to load profile data:', error);
    });

    // Update profile summary display
    function updateProfileSummary(data) {
        document.getElementById('summary-name').textContent = data.name || 'X';
        document.getElementById('summary-email').textContent = data.email || 'X@example.com';
        document.getElementById('summary-phone').textContent = data.phone || '123';
        document.getElementById('summary-grad-year').textContent = data.gradYear || '202X';
        document.getElementById('summary-interests').textContent = 
            (data.interests && data.interests.split(',').join(', ')) || 'None';
        document.getElementById('summary-contact').textContent = data.contact || 'None';
    }

    // Save button click handler
    saveButton.addEventListener('click', function(e) {
        e.preventDefault();

        // Get form values
        const name = document.getElementById('my-profile-page-name').value;
        const email = document.getElementById('my-profile-page-email').value;
        const phone = document.getElementById('my-profile-page-phone').value;
        const gradYear = document.getElementById('my-profile-page-grad_year').value;
        const contact = document.getElementById('my-profile-page-contact').value;
        const interests = hiddenInput.value;

        // Prepare data to save
        const profileData = {
            name,
            email,
            phone,
            gradYear,
            contact,
            interests
        };

        // Save to IndexedDB
        saveProfileData(profileData).then(() => {
            // Update summary display
            updateProfileSummary(profileData);
            alert('Profile updated successfully!');
        }).catch(error => {
            console.error('Failed to save profile:', error);
            alert('Failed to save profile. Please try again.');
        });
    });

    // Initialize
    updateSelectedTags();
}