/**
 * Pol_Ski - Main JavaScript
 * Handles authentication, API interactions, and UI functionality
 */

// API base URL - change this if needed
const API_BASE_URL = '';

// ========== Authentication Functions ==========

/**
 * Check if the user is logged in
 * @returns {boolean} True if user is logged in
 */
function isLoggedIn() {
    return localStorage.getItem('access_token') !== null;
}

/**
 * Get the authentication token
 * @returns {string|null} The JWT token or null if not logged in
 */
function getToken() {
    return localStorage.getItem('access_token');
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    // Set default headers
    if (!options.headers) {
        options.headers = {};
    }

    // Add authorization header if token exists
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add content-type if not specified and method is not GET
    if (options.method && options.method !== 'GET' && !options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
    }

    try {
        console.log(`Making API request to: ${endpoint}`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
            console.log('Unauthorized response - clearing token');
            // Clear token and redirect to login
            localStorage.removeItem('access_token');
            window.location.href = '/login';
            return null;
        }

        // Parse JSON response
        if (response.headers.get('content-type')?.includes('application/json')) {
            const data = await response.json();
            console.log(`API response data:`, data);

            if (!response.ok) {
                throw new Error(data.detail || 'API request failed');
            }

            return data;
        }

        // Handle non-JSON responses
        if (!response.ok) {
            throw new Error('API request failed');
        }

        const textResponse = await response.text();
        console.log(`API text response:`, textResponse);
        return textResponse;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

/**
 * Log the user out
 */
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/';
}

// Handle logout button click
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    // Check auth status and update UI
    updateAuthUI();
});



/**
 * Update UI based on authentication status
 */
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');

    if (!authButtons || !userMenu) return;

    if (isLoggedIn()) {
        // User is logged in
        authButtons.classList.add('d-none');
        userMenu.classList.remove('d-none');

        // Get user info and update username
        getUserInfo();
    } else {
        // User is not logged in
        authButtons.classList.remove('d-none');
        userMenu.classList.add('d-none');
    }
}

/**
 * Get the current user's information
 */
async function getUserInfo() {
    try {
        const user = await apiRequest('/api/users/me');
        if (user && user.username) {
            const usernameElement = document.getElementById('username');
            if (usernameElement) {
                usernameElement.textContent = user.username;
            }
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

// ========== Learning Related Functions ==========

/**
 * Load lessons from API
 * @param {number} [categoryId] - Optional category ID to filter lessons
 * @returns {Promise<Array>} Lessons array
 */
async function loadLessons(categoryId = null) {
    try {
        let endpoint = isLoggedIn() ? '/api/lessons' : '/api/lessons/public';

        if (categoryId) {
            endpoint += `?category_id=${categoryId}`;
        }

        const response = await apiRequest(endpoint);
        console.log('Raw lessons response:', response);

        // Handle different response formats
        if (Array.isArray(response)) {
            return response;
        } else if (response && typeof response === 'object') {
            // Try to extract lessons from various possible formats
            if (Array.isArray(response.data)) {
                return response.data;
            } else if (Array.isArray(response.lessons)) {
                return response.lessons;
            } else if (Array.isArray(response.items)) {
                return response.items;
            } else {
                // If response is a non-null object, try to convert it to an array
                // This handles cases where the API returns {1: {...}, 2: {...}} instead of [{...}, {...}]
                try {
                    return Object.values(response);
                } catch (e) {
                    console.error('Could not convert lessons response to array:', e);
                    return [];
                }
            }
        }

        // If none of the above apply, return an empty array
        console.warn('Unexpected lessons response format', response);
        return [];
    } catch (error) {
        console.error('Error loading lessons:', error);
        return [];
    }
}

/**
 * Load a specific lesson
 * @param {number} lessonId - The lesson ID to load
 * @returns {Promise<Object>} Lesson object
 */
async function loadLesson(lessonId) {
    try {
        const endpoint = isLoggedIn()
            ? `/lessons/${lessonId}`
            : `/lessons/public/${lessonId}`;

        return await apiRequest(endpoint);
    } catch (error) {
        console.error(`Error loading lesson ${lessonId}:`, error);
        throw error;
    }
}

/**
 * Load words for a specific lesson
 * @param {number} lessonId - The lesson ID
 * @returns {Promise<Array>} Words array
 */
async function loadLessonWords(lessonId) {
    try {
        // We need to fetch all lesson words through custom endpoint
        const endpoint = `/api/lessons/${lessonId}/words`;
        const response = await apiRequest(endpoint);

        // Handle different response formats (similar to loadLessons)
        if (Array.isArray(response)) {
            return response;
        } else if (response && typeof response === 'object') {
            if (Array.isArray(response.data)) {
                return response.data;
            } else if (Array.isArray(response.words)) {
                return response.words;
            } else if (Array.isArray(response.items)) {
                return response.items;
            } else {
                try {
                    return Object.values(response);
                } catch (e) {
                    console.error('Could not convert words response to array:', e);
                    return [];
                }
            }
        }

        console.warn('Unexpected words response format', response);
        return [];
    } catch (error) {
        console.error(`Error loading words for lesson ${lessonId}:`, error);
        return [];
    }
}

/**
 * Get practice exercises
 * @param {string} [exerciseType='multiple_choice'] - The type of exercise
 * @returns {Promise<Array>} Array of exercises
 */
async function getPracticeExercises(exerciseType = 'multiple_choice') {
    try {
        if (!isLoggedIn()) {
            throw new Error('User must be logged in to access practice exercises');
        }

        const endpoint = `/api/words/practice/next?exercise_type=${exerciseType}`;
        const response = await apiRequest(endpoint);

        // Handle response format
        if (Array.isArray(response)) {
            return response;
        } else if (response && typeof response === 'object') {
            if (Array.isArray(response.data)) {
                return response.data;
            } else if (Array.isArray(response.exercises)) {
                return response.exercises;
            } else if (Array.isArray(response.items)) {
                return response.items;
            } else {
                try {
                    return Object.values(response);
                } catch (e) {
                    console.error('Could not convert exercises response to array:', e);
                    return [];
                }
            }
        }

        console.warn('Unexpected exercises response format', response);
        return [];
    } catch (error) {
        console.error('Error getting practice exercises:', error);
        throw error;
    }
}

/**
 * Update word mastery level
 * @param {number} wordId - The word ID
 * @param {number} masteryLevel - The new mastery level (0-5)
 * @returns {Promise<Object>} Updated word mastery object
 */
async function updateWordMastery(wordId, masteryLevel) {
    try {
        if (!isLoggedIn()) {
            throw new Error('User must be logged in to update word mastery');
        }

        return await apiRequest('/api/words/mastery', {  // Changed from /words/mastery to /api/words/mastery
            method: 'POST',
            body: JSON.stringify({
                word_id: wordId,
                mastery_level: masteryLevel
            })
        });
    } catch (error) {
        console.error(`Error updating mastery for word ${wordId}:`, error);
        throw error;
    }
}

/**
 * Update user's progress for a lesson
 * @param {number} lessonId - The lesson ID
 * @param {boolean} completed - Whether the lesson is completed
 * @param {number} score - The score (0-100)
 * @returns {Promise<Object>} Updated progress object
 */
async function updateLessonProgress(lessonId, completed, score) {
    try {
        if (!isLoggedIn()) {
            throw new Error('User must be logged in to update progress');
        }

        return await apiRequest(`/api/lessons/${lessonId}/progress`, {
            method: 'POST',
            body: JSON.stringify({
                lesson_id: lessonId,
                completed: completed,
                score: score
            })
        });
    } catch (error) {
        console.error(`Error updating progress for lesson ${lessonId}:`, error);
        throw error;
    }
}

/**
 * Get user's progress for all lessons
 * @returns {Promise<Array>} Array of progress objects
 */
async function getUserProgress() {
    try {
        if (!isLoggedIn()) {
            throw new Error('User must be logged in to view progress');
        }

        const response = await apiRequest('/api/lessons/progress/me');

        // Handle response format
        if (Array.isArray(response)) {
            return response;
        } else if (response && typeof response === 'object') {
            if (Array.isArray(response.data)) {
                return response.data;
            } else if (Array.isArray(response.progress)) {
                return response.progress;
            } else if (Array.isArray(response.items)) {
                return response.items;
            } else {
                try {
                    return Object.values(response);
                } catch (e) {
                    console.error('Could not convert progress response to array:', e);
                    return [];
                }
            }
        }

        console.warn('Unexpected progress response format', response);
        return [];
    } catch (error) {
        console.error('Error getting user progress:', error);
        return [];
    }
}

/**
 * Get words due for review (spaced repetition)
 * @param {number} [limit=10] - Maximum number of words to get
 * @returns {Promise<Array>} Array of words
 */
async function getWordsForReview(limit = 10) {
    try {
        if (!isLoggedIn()) {
            throw new Error('User must be logged in to get review words');
        }

        const endpoint = `/words/review/due?limit=${limit}`;
        const response = await apiRequest(endpoint);

        // Handle response format
        if (Array.isArray(response)) {
            return response;
        } else if (response && typeof response === 'object') {
            if (Array.isArray(response.data)) {
                return response.data;
            } else if (Array.isArray(response.words)) {
                return response.words;
            } else if (Array.isArray(response.items)) {
                return response.items;
            } else {
                try {
                    return Object.values(response);
                } catch (e) {
                    console.error('Could not convert review words response to array:', e);
                    return [];
                }
            }
        }

        console.warn('Unexpected review words response format', response);
        return [];
    } catch (error) {
        console.error('Error getting words for review:', error);
        return [];
    }
}

/**
 * Get next words to learn
 * @param {number} [limit=5] - Maximum number of words to get
 * @returns {Promise<Array>} Array of words
 */
async function getNextWordsToLearn(limit = 5) {
    try {
        if (!isLoggedIn()) {
            throw new Error('User must be logged in to get next words');
        }

        const endpoint = `/api/words/learn/next?limit=${limit}`;
        const response = await apiRequest(endpoint);

        // Handle response format
        if (Array.isArray(response)) {
            return response;
        } else if (response && typeof response === 'object') {
            if (Array.isArray(response.data)) {
                return response.data;
            } else if (Array.isArray(response.words)) {
                return response.words;
            } else if (Array.isArray(response.items)) {
                return response.items;
            } else {
                try {
                    return Object.values(response);
                } catch (e) {
                    console.error('Could not convert next words response to array:', e);
                    return [];
                }
            }
        }

        console.warn('Unexpected next words response format', response);
        return [];
    } catch (error) {
        console.error('Error getting next words to learn:', error);
        return [];
    }
}

// ========== UI Helper Functions ==========

/**
 * Display an alert message
 * @param {string} message - The message to display
 * @param {string} type - Alert type (success, danger, warning, info)
 * @param {string} containerId - ID of the container element
 * @param {number} [timeout=5000] - Time in ms before the alert disappears (0 for no timeout)
 */
function showAlert(message, type, containerId, timeout = 5000) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Alert container not found: ${containerId}`);
        return;
    }

    // Create alert element
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type} alert-dismissible fade show`;
    alertEl.role = 'alert';

    // Add message and close button
    alertEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Add to container
    container.prepend(alertEl);

    // Set timeout to remove
    if (timeout > 0) {
        setTimeout(() => {
            alertEl.classList.remove('show');
            setTimeout(() => alertEl.remove(), 150);
        }, timeout);
    }
}

/**
 * Create a word card element
 * @param {Object} word - The word object
 * @param {boolean} [showEnglish=true] - Whether to show English translation
 * @returns {HTMLElement} The word card element
 */
function createWordCard(word, showEnglish = true) {
    if (!word || typeof word !== 'object') {
        console.error('Invalid word object:', word);
        return document.createElement('div');
    }

    const card = document.createElement('div');
    card.className = 'card word-card mb-3';
    card.dataset.wordId = word.id || '';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body text-center';

    // Polish word
    const polishEl = document.createElement('div');
    polishEl.className = 'polish-word';
    polishEl.textContent = word.polish || 'Unknown';

    // English translation (optional)
    const englishEl = document.createElement('div');
    englishEl.className = 'english-translation';
    englishEl.textContent = showEnglish ? (word.english || 'Unknown') : '?';

    // Pronunciation
    const pronEl = document.createElement('div');
    pronEl.className = 'pronunciation';
    pronEl.textContent = `Pronunciation: ${word.pronunciation || 'Not available'}`;

    // Add audio button if we had audio files
    // const audioBtn = document.createElement('button');
    // audioBtn.className = 'btn btn-sm btn-outline-primary mt-2';
    // audioBtn.innerHTML = '<i class="bi bi-volume-up"></i> Listen';
    // audioBtn.onclick = () => playWordAudio(word.id);

    // Assemble card
    cardBody.appendChild(polishEl);
    cardBody.appendChild(englishEl);
    cardBody.appendChild(pronEl);
    // cardBody.appendChild(audioBtn);
    card.appendChild(cardBody);

    return card;
}

/**
 * Create a quiz question from a word
 * @param {Object} exercise - The exercise object
 * @param {Function} onAnswer - Callback when answer is selected
 * @returns {HTMLElement} The quiz question element
 */
function createQuizQuestion(exercise, onAnswer) {
    if (!exercise || typeof exercise !== 'object') {
        console.error('Invalid exercise object:', exercise);
        return document.createElement('div');
    }

    const container = document.createElement('div');
    container.className = 'quiz-question mb-4';
    container.dataset.wordId = exercise.word_id || '';
    container.dataset.correctId = exercise.correct_id || '';

    // Question
    const questionEl = document.createElement('h4');
    questionEl.className = 'mb-3';
    questionEl.textContent = `What does "${exercise.polish || '?'}" mean?`;

    // Options container
    const optionsEl = document.createElement('div');
    optionsEl.className = 'quiz-options';

    // Create option buttons
    if (Array.isArray(exercise.options)) {
        exercise.options.forEach(option => {
            if (!option || typeof option !== 'object') return;

            const optionBtn = document.createElement('button');
            optionBtn.className = 'quiz-option';
            optionBtn.dataset.optionId = option.id || '';
            optionBtn.textContent = option.text || '';

            // Add click handler
            optionBtn.addEventListener('click', () => {
                const isCorrect = option.id === exercise.correct_id;

                // Mark this option as correct/incorrect
                if (isCorrect) {
                    optionBtn.classList.add('correct');
                } else {
                    optionBtn.classList.add('incorrect');

                    // Also highlight the correct answer
                    const correctBtn = optionsEl.querySelector(`[data-option-id="${exercise.correct_id}"]`);
                    if (correctBtn) correctBtn.classList.add('correct');
                }

                // Disable all options
                const allOptions = optionsEl.querySelectorAll('.quiz-option');
                allOptions.forEach(btn => btn.disabled = true);

                // Call callback
                if (onAnswer) onAnswer(exercise.word_id, isCorrect);
            });

            optionsEl.appendChild(optionBtn);
        });
    } else {
        console.error('Exercise options is not an array:', exercise.options);
    }

    container.appendChild(questionEl);
    container.appendChild(optionsEl);

    return container;
}

/**
 * Render a progress chart for user learning
 * @param {string} containerId - ID of the container element
 * @param {Array} progressData - Array of progress data
 */
function renderProgressChart(containerId, progressData) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Progress chart container not found: ${containerId}`);
        return;
    }

    // Clear container
    container.innerHTML = '';

    if (!progressData || !Array.isArray(progressData) || progressData.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No progress data available yet. Start learning to see your progress!</div>';
        return;
    }

    // Group progress by date
    const progressByDate = {};
    progressData.forEach(progress => {
        if (!progress || typeof progress !== 'object') return;

        const date = new Date(progress.last_studied || Date.now()).toLocaleDateString();
        if (!progressByDate[date]) {
            progressByDate[date] = {
                completedLessons: 0,
                totalScore: 0,
                count: 0
            };
        }

        progressByDate[date].count++;
        if (progress.completed) {
            progressByDate[date].completedLessons++;
        }
        progressByDate[date].totalScore += progress.score || 0;
    });

    // Convert to array for chart
    const chartData = Object.keys(progressByDate).map(date => {
        const data = progressByDate[date];
        return {
            date,
            completedLessons: data.completedLessons,
            averageScore: data.count > 0 ? data.totalScore / data.count : 0
        };
    });

    // Sort by date
    chartData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Create canvas for chart
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    // Create chart using Chart.js (would need to include the library)
    // This is just a placeholder - would need actual Chart.js implementation
    canvas.style.height = '300px';
    canvas.style.width = '100%';
    canvas.innerHTML = 'Chart would be rendered here...';

    // Create a summary table as fallback
    const table = document.createElement('table');
    table.className = 'table table-striped mt-4';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Completed Lessons</th>
                <th>Average Score</th>
            </tr>
        </thead>
        <tbody>
            ${chartData.map(data => `
                <tr>
                    <td>${data.date}</td>
                    <td>${data.completedLessons}</td>
                    <td>${Math.round(data.averageScore)}%</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    container.appendChild(table);
}

// ========== Page Specific Initialization ==========

// Initialize lessons page
function initLessonsPage() {
    const lessonsContainer = document.getElementById('lessonsContainer');
    const categorySelect = document.getElementById('categorySelect');

    if (!lessonsContainer) {
        console.error('Lessons container not found');
        return;
    }

    // Load categories for filter dropdown
    if (categorySelect) {
        apiRequest('/categories')
            .then(categories => {
                // Process categories to ensure it's an array
                let categoryArray = [];

                if (Array.isArray(categories)) {
                    categoryArray = categories;
                } else if (categories && typeof categories === 'object') {
                    if (Array.isArray(categories.data)) {
                        categoryArray = categories.data;
                    } else if (Array.isArray(categories.categories)) {
                        categoryArray = categories.categories;
                    } else if (Array.isArray(categories.items)) {
                        categoryArray = categories.items;
                    } else {
                        try {
                            categoryArray = Object.values(categories);
                        } catch (e) {
                            console.error('Could not convert categories to array:', e);
                        }
                    }
                }

                console.log('Processed categories:', categoryArray);

                // Add "All Categories" option
                categorySelect.innerHTML = '<option value="">All Categories</option>';

                // Add each category
                categoryArray.forEach(category => {
                    if (!category || typeof category !== 'object') return;

                    const option = document.createElement('option');
                    option.value = category.id || '';
                    option.textContent = category.name || 'Unknown';
                    categorySelect.appendChild(option);
                });

                // Add change listener
                categorySelect.addEventListener('change', () => {
                    loadLessonsIntoContainer(lessonsContainer, categorySelect.value);
                });
            })
            .catch(error => {
                console.error('Error loading categories:', error);
            });
    }

    // Load initial lessons
    loadLessonsIntoContainer(lessonsContainer);
}

// Load lessons into container with robust error handling
function loadLessonsIntoContainer(container, categoryId = null) {
    // Show loading
    container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div><p class="mt-3">Loading lessons...</p></div>';

    // Load lessons
    loadLessons(categoryId)
        .then(lessons => {
            console.log('Processed lessons for container:', lessons);

            if (!Array.isArray(lessons) || lessons.length === 0) {
                container.innerHTML = '<div class="alert alert-info">No lessons found. Check back later!</div>';
                return;
            }

            // Clear container
            container.innerHTML = '';

            // Add each lesson
            lessons.forEach(lesson => {
                // Skip invalid lessons
                if (!lesson || typeof lesson !== 'object') return;

                console.log('Creating card for lesson:', lesson);

                const lessonCard = document.createElement('div');
                lessonCard.className = 'card mb-4';

                const cardBody = document.createElement('div');
                cardBody.className = 'card-body';

                // Title
                const title = document.createElement('h3');
                title.className = 'card-title';
                title.textContent = lesson.title || 'Untitled Lesson';

                // Description
                const description = document.createElement('p');
                description.className = 'card-text';
                description.textContent = lesson.description || 'No description available';

                // Difficulty
                const difficulty = document.createElement('p');
                difficulty.className = 'card-text';
                difficulty.innerHTML = `<small class="text-muted">Difficulty: ${'★'.repeat(lesson.difficulty_level || 1)}</small>`;

                // Start button
                const startBtn = document.createElement('a');
                startBtn.className = 'btn btn-primary';
                startBtn.href = `/lessons/${lesson.id || 0}`;
                startBtn.textContent = 'Start Lesson';

                // Assemble card
                cardBody.appendChild(title);
                cardBody.appendChild(description);
                cardBody.appendChild(difficulty);
                cardBody.appendChild(startBtn);
                lessonCard.appendChild(cardBody);

                container.appendChild(lessonCard);
            });
        })
        .catch(error => {
            console.error('Detailed error loading lessons:', error);
            container.innerHTML = `<div class="alert alert-danger">Error loading lessons: ${error.message}</div>`;
        });
}

function initLessonDetailPage(lessonId) {
    console.log('Initializing lesson detail page for lesson:', lessonId);

    let lessonWords = [];
    let showTranslations = true;
    let quizResults = {
        correct: 0,
        total: 0
    };

    // Updated loadLessonData function in initLessonDetailPage
    async function loadLessonData() {
        try {
            console.log("Loading lesson data for lesson ID:", lessonId);

            // Get lesson details
            const lesson = await loadLesson(lessonId);
            console.log("Loaded lesson:", lesson);

            const lessonTitle = document.getElementById('lessonTitle');
            const lessonDescription = document.getElementById('lessonDescription');

            if (lessonTitle) lessonTitle.textContent = lesson.title || 'Lesson';
            if (lessonDescription) lessonDescription.textContent = lesson.description || 'No description available';

            document.title = `${lesson.title || 'Lesson'} - Pol_Ski`;

            // Load words for this lesson
            lessonWords = await loadLessonWords(lessonId);
            console.log("Loaded lesson words:", lessonWords);

            renderWords(lessonWords);

            // Load user progress if logged in
            if (isLoggedIn()) {
                loadUserProgress();
            }

            // Initialize drag and drop
            setTimeout(initializeDragAndDrop, 500); // Add a small delay to ensure DOM is ready

        } catch (error) {
            console.error("Error loading lesson data:", error);
            const alertContainer = document.getElementById('alertContainer');
            if (alertContainer) {
                showAlert(`Error loading lesson: ${error.message}`, 'danger', 'alertContainer');
            }
        }
    }

//    // Load lesson data
//    async function loadLessonData() {
//        try {
//            // Get lesson details
//            const lesson = await loadLesson(lessonId);
//            document.getElementById('lessonTitle').textContent = lesson.title || 'Lesson';
//            document.getElementById('lessonDescription').textContent = lesson.description || 'No description available';
//            document.title = `${lesson.title || 'Lesson'} - Pol_Ski`;
//
//            // Load words for this lesson
//            lessonWords = await loadLessonWords(lessonId);
//            renderWords(lessonWords);
//
//            // Load user progress if logged in
//            if (isLoggedIn()) {
//                loadUserProgress();
//            }
//
//            // Initialize drag and drop
//            initializeDragAndDrop();
//
//        } catch (error) {
//            showAlert(`Error loading lesson: ${error.message}`, 'danger', 'alertContainer');
//        }
//    }

    // Render words in the learning section
    function renderWords(words) {
        const container = document.getElementById('wordsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (!words || !Array.isArray(words) || words.length === 0) {
            container.innerHTML = '<div class="col-12"><div class="alert alert-info">No words found in this lesson.</div></div>';
            return;
        }

        words.forEach(word => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-3';

            const wordCard = createWordCard(word, showTranslations);
            col.appendChild(wordCard);
            container.appendChild(col);
        });
    }

// Add this to the initializeDragAndDrop function in initLessonDetailPage
function initializeDragAndDrop() {
    // Get all draggable words
    const dragWords = document.querySelectorAll('.drag-word');
    const sentenceBuilders = document.querySelectorAll('.sentence-builder');


        console.log('Found drag words:', dragWords.length);
        console.log('Found sentence builders:', sentenceBuilders.length);

        // Make words draggable
        dragWords.forEach(word => {
            word.setAttribute('draggable', 'true');

            // Add drag start event
            word.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', word.textContent);
                e.dataTransfer.setData('sourceId', word.parentElement.id);
                word.classList.add('dragging');
            });

            // Add drag end event
            word.addEventListener('dragend', function() {
                word.classList.remove('dragging');
            });

            // Add click event as an alternative to dragging
            word.addEventListener('click', function() {
                // Find the corresponding sentence builder
                const builderId = word.parentElement.id.replace('wordBank', 'sentenceBuilder');
                const builder = document.getElementById(builderId);

                if (builder) {
                    // Remove the placeholder if it exists
                    const placeholder = builder.querySelector('.text-muted');
                    if (placeholder) {
                        builder.innerHTML = '';
                    }

                    // Create a copy of the word
                    const wordCopy = document.createElement('span');
                    wordCopy.className = 'badge bg-primary m-1 p-2';
                    wordCopy.textContent = word.textContent;

                    // Add remove functionality
                    wordCopy.addEventListener('click', function() {
                        wordCopy.remove();

                        // Add placeholder back if no words left
                        if (builder.children.length === 0) {
                            builder.innerHTML = '<p class="text-muted mb-0">Drag words here to build a sentence</p>';
                        }
                    });

                    builder.appendChild(wordCopy);

                    // Hide the original word
                    word.style.display = 'none';
                }
            });
        });

        // Make sentence builders droppable
        sentenceBuilders.forEach(builder => {
            // Add dragover event
            builder.addEventListener('dragover', function(e) {
                e.preventDefault();
                builder.classList.add('drag-over');
            });

            // Add dragleave event
            builder.addEventListener('dragleave', function() {
                builder.classList.remove('drag-over');
            });

            // Add drop event
            builder.addEventListener('drop', function(e) {
                e.preventDefault();
                builder.classList.remove('drag-over');

                const text = e.dataTransfer.getData('text/plain');
                const sourceId = e.dataTransfer.getData('sourceId');

                // Remove the placeholder if it exists
                const placeholder = builder.querySelector('.text-muted');
                if (placeholder) {
                    builder.innerHTML = '';
                }

                // Create a badge for the dropped word
                const wordBadge = document.createElement('span');
                wordBadge.className = 'badge bg-primary m-1 p-2';
                wordBadge.textContent = text;

                // Add remove functionality
                wordBadge.addEventListener('click', function() {
                    wordBadge.remove();

                    // Add placeholder back if no words left
                    if (builder.children.length === 0) {
                        builder.innerHTML = '<p class="text-muted mb-0">Drag words here to build a sentence</p>';
                    }

                    // Make the original word visible again
                    const sourceBank = document.getElementById(sourceId);
                    if (sourceBank) {
                        const originalWords = sourceBank.querySelectorAll('.drag-word');
                        originalWords.forEach(word => {
                            if (word.textContent === text && word.style.display === 'none') {
                                word.style.display = '';
                                return;
                            }
                        });
                    }
                });

                builder.appendChild(wordBadge);

                // Hide the original word
                const sourceBank = document.getElementById(sourceId);
                if (sourceBank) {
                    const originalWords = sourceBank.querySelectorAll('.drag-word');
                    originalWords.forEach(word => {
                        if (word.textContent === text && word.style.display !== 'none') {
                            word.style.display = 'none';
                            return;
                        }
                    });
                }
            });
        });

        // Add functionality to check sentence buttons
        const checkButtons = document.querySelectorAll('.check-sentence-btn');
        checkButtons.forEach(button => {
            button.addEventListener('click', function() {
                const correctSentence = button.getAttribute('data-correct');
                const builderId = button.parentElement.querySelector('.sentence-builder').id;
                const builder = document.getElementById(builderId);

                // Get the user's sentence
                let userSentence = '';
                const wordBadges = builder.querySelectorAll('.badge');
                wordBadges.forEach(badge => {
                    userSentence += badge.textContent + ' ';
                });
                userSentence = userSentence.trim();

                // Check if the sentence is correct
                if (userSentence === correctSentence) {
                    // Show success message
                    const resultDiv = document.createElement('div');
                    resultDiv.className = 'alert alert-success mt-2';
                    resultDiv.textContent = 'Correct! Well done!';
                    button.parentElement.appendChild(resultDiv);

                    // Disable the button
                    button.disabled = true;

                    // Remove the result after 3 seconds
                    setTimeout(() => {
                        resultDiv.remove();
                    }, 3000);
                } else {
                    // Show error message
                    const resultDiv = document.createElement('div');
                    resultDiv.className = 'alert alert-danger mt-2';
                    resultDiv.textContent = 'Not quite right. Try again!';
                    button.parentElement.appendChild(resultDiv);

                    // Remove the result after 3 seconds
                    setTimeout(() => {
                        resultDiv.remove();
                    }, 3000);
                }
            });
        });
        // Add reset functionality
    const sentenceExercises = document.querySelectorAll('#sentenceExercises .card');
    sentenceExercises.forEach(exercise => {
        // Create a reset button for each exercise
        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-sm btn-outline-secondary mt-2 me-2';
        resetBtn.textContent = 'Reset';
        resetBtn.addEventListener('click', function() {
            // Get the word bank and sentence builder for this exercise
            const cardBody = exercise.querySelector('.card-body');
            const wordBankId = cardBody.querySelector('.d-flex').id;
            const builderId = cardBody.querySelector('.sentence-builder').id;

            const wordBank = document.getElementById(wordBankId);
            const builder = document.getElementById(builderId);

            // Reset the sentence builder
            builder.innerHTML = '<p class="text-muted mb-0">Drag words here to build a sentence</p>';

            // Show all words in the word bank
            const words = wordBank.querySelectorAll('.drag-word');
            words.forEach(word => {
                word.style.display = '';
            });
        });

        // Find the check button and insert the reset button before it
        const checkBtn = exercise.querySelector('.check-sentence-btn');
        if (checkBtn) {
            checkBtn.parentElement.insertBefore(resetBtn, checkBtn);
        }
    });
}
//    }

    // Toggle showing/hiding translations
    const toggleTranslationBtn = document.getElementById('toggleTranslation');
    if (toggleTranslationBtn) {
        toggleTranslationBtn.addEventListener('click', function() {
            showTranslations = !showTranslations;
            this.textContent = showTranslations ? 'Hide English' : 'Show English';
            renderWords(lessonWords);
        });
    }

    // Load user progress
    async function loadUserProgress() {
        try {
            const progressList = await getUserProgress();
            const lessonProgress = progressList.find(p => p.lesson_id === parseInt(lessonId));

            if (lessonProgress) {
                const progressBar = document.getElementById('lessonProgress');
                if (!progressBar) return;

                const progressValue = lessonProgress.completed ? 100 : Math.round(lessonProgress.score);

                progressBar.style.width = `${progressValue}%`;
                progressBar.textContent = `${progressValue}%`;
                progressBar.setAttribute('aria-valuenow', progressValue);

                // If lesson is completed, show a completed badge
                if (lessonProgress.completed) {
                    const badgeContainer = document.createElement('div');
                    badgeContainer.className = 'mt-2';
                    badgeContainer.innerHTML = '<span class="badge bg-success">Completed</span>';
                    const lessonTitle = document.getElementById('lessonTitle');
                    if (lessonTitle) {
                        lessonTitle.after(badgeContainer);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading user progress:', error);
        }
    }

    // Start quiz buttons
    const startQuizBtn = document.getElementById('startQuizBtn');
    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', function() {
            startQuiz();
        });
    }

    const retryQuizBtn = document.getElementById('retryQuizBtn');
    if (retryQuizBtn) {
        retryQuizBtn.addEventListener('click', function() {
            startQuiz();
        });
    }

    // Complete lesson button
    const completeBtn = document.getElementById('completeBtn');
    if (completeBtn) {
        completeBtn.addEventListener('click', function() {
            if (isLoggedIn()) {
                updateLessonProgress(lessonId, true, 100)
                    .then(() => {
                        window.location.href = '/lessons';
                    })
                    .catch(error => {
                        showAlert(`Error updating progress: ${error.message}`, 'danger', 'alertContainer');
                    });
            } else {
                showAlert('Please log in to save your progress', 'warning', 'alertContainer');
            }
        });
    }

    // Updated startQuiz function in initLessonDetailPage
function startQuiz() {
    const quizContainer = document.getElementById('quizContainer');
    if (!quizContainer) {
        console.error('Quiz container not found');
        return;
    }

    quizContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-success"></div><p class="mt-2">Generating quiz...</p></div>';

    // Reset quiz results
    quizResults.correct = 0;
    quizResults.total = 0;

    // Hide quiz results
    const resultsPanel = document.getElementById('quizResults');
    if (resultsPanel) resultsPanel.classList.add('d-none');

    // Generate random exercises from the lesson words
    console.log("Lesson words for quiz:", lessonWords);

    if (!Array.isArray(lessonWords) || lessonWords.length === 0) {
        quizContainer.innerHTML = '<div class="alert alert-warning">No words available for quiz. Please try again later.</div>';
        return;
    }

    // Create a temporary deep copy of lessonWords to avoid modifying the original
    const shuffledWords = JSON.parse(JSON.stringify(lessonWords)).sort(() => Math.random() - 0.5);
    const quizWords = shuffledWords.slice(0, Math.min(5, shuffledWords.length));
    quizResults.total = quizWords.length;

    console.log("Selected quiz words:", quizWords);

    // Create quiz questions
    quizContainer.innerHTML = '';

    quizWords.forEach(word => {
        // Create a pool of potential incorrect options (all words except current)
        const otherWords = lessonWords.filter(w => w.id !== word.id);

        // Ensure we have at least 3 incorrect options
        let incorrectOptions = [];
        if (otherWords.length >= 3) {
            // Get 3 random words for incorrect options
            incorrectOptions = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 3);
        } else {
            // If not enough words, just use what we have
            incorrectOptions = [...otherWords];

            // If still not enough, add duplicates to reach 3 options
            while (incorrectOptions.length < 3) {
                incorrectOptions.push(otherWords[0] || word);
            }
        }

        console.log("Creating exercise for word:", word);
        console.log("Incorrect options:", incorrectOptions);

        // Create exercise object
        const exercise = {
            word_id: word.id,
            polish: word.polish,
            options: [
                { id: word.id, text: word.english },
                ...incorrectOptions.map(w => ({ id: w.id, text: w.english }))
            ],
            correct_id: word.id
        };

        // Shuffle options
        exercise.options.sort(() => Math.random() - 0.5);

        console.log("Final exercise:", exercise);

        // Create quiz question
        const questionElement = createQuizQuestion(exercise, handleQuizAnswer);
        quizContainer.appendChild(questionElement);
    });
}

//    // Initialize the quiz
//    function startQuiz() {
//        const quizContainer = document.getElementById('quizContainer');
//        if (!quizContainer) return;
//
//        quizContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-success"></div><p class="mt-2">Generating quiz...</p></div>';
//
//        // Reset quiz results
//        quizResults.correct = 0;
//        quizResults.total = 0;
//
//        // Hide quiz results
//        const quizResults = document.getElementById('quizResults');
//        if (quizResults) {
//            quizResults.classList.add('d-none');
//        }
//
//        // Generate random exercises from the lesson words
//        if (!Array.isArray(lessonWords) || lessonWords.length === 0) {
//            quizContainer.innerHTML = '<div class="alert alert-warning">No words available for quiz. Please try again later.</div>';
//            return;
//        }
//
//        const shuffledWords = [...lessonWords].sort(() => Math.random() - 0.5);
//        const quizWords = shuffledWords.slice(0, Math.min(5, shuffledWords.length));
//        quizResults.total = quizWords.length;
//
//        // Create quiz questions
//        quizContainer.innerHTML = '';
//
//        quizWords.forEach(word => {
//            // Generate 3 random incorrect options
//            const incorrectOptions = lessonWords
//                .filter(w => w.id !== word.id)
//                .sort(() => Math.random() - 0.5)
//                .slice(0, Math.min(3, lessonWords.length - 1));
//
//            if (incorrectOptions.length < 3) {
//                // If not enough incorrect options, just duplicate some words
//                while (incorrectOptions.length < 3) {
//                    incorrectOptions.push(incorrectOptions[0] || word);
//                }
//            }
//
//            // Create exercise object
//            const exercise = {
//                word_id: word.id,
//                polish: word.polish,
//                options: [
//                    { id: word.id, text: word.english },
//                    ...incorrectOptions.map(w => ({ id: w.id, text: w.english }))
//                ],
//                correct_id: word.id
//            };
//
//            // Shuffle options
//            exercise.options.sort(() => Math.random() - 0.5);
//
//            // Create quiz question
//            const questionElement = createQuizQuestion(exercise, handleQuizAnswer);
//            quizContainer.appendChild(questionElement);
//        });
//    }

    // Handle quiz answer
    function handleQuizAnswer(wordId, isCorrect) {
        if (isCorrect) {
            quizResults.correct++;
        }

        // Check if all questions have been answered
        const quizContainer = document.getElementById('quizContainer');
        if (!quizContainer) return;

        const answeredQuestions = quizContainer.querySelectorAll('.quiz-option:disabled').length / 4; // 4 options per question

        if (answeredQuestions >= quizResults.total) {
            // Show results
            const score = Math.round((quizResults.correct / quizResults.total) * 100);
            const resultPanel = document.getElementById('quizResults');
            if (!resultPanel) return;

            const correctAnswersEl = document.getElementById('correctAnswers');
            const totalQuestionsEl = document.getElementById('totalQuestions');
            const progressBar = document.getElementById('quizProgressBar');

            if (correctAnswersEl) correctAnswersEl.textContent = quizResults.correct;
            if (totalQuestionsEl) totalQuestionsEl.textContent = quizResults.total;

            if (progressBar) {
                progressBar.style.width = `${score}%`;
                progressBar.textContent = `${score}%`;
                progressBar.setAttribute('aria-valuenow', score);
            }

            resultPanel.classList.remove('d-none');

            // Update lesson progress if logged in
            if (isLoggedIn()) {
                updateLessonProgress(lessonId, score === 100, score)
                    .catch(error => {
                        console.error('Error updating lesson progress:', error);
                    });
            }
        }
    }

    // Initialize lesson
    loadLessonData();
}

function initPracticePage() {
    console.log('Initializing practice page');

    // Initialize review words section
    async function initReviewWords() {
        const container = document.getElementById('reviewWordsContent');
        const loading = document.getElementById('reviewWordsLoading');

        if (!container || !loading) return;

        if (!isLoggedIn()) {
            loading.classList.add('d-none');
            container.classList.remove('d-none');

            const loginRequired = document.createElement('div');
            loginRequired.className = 'text-center p-3';
            loginRequired.innerHTML = `
                <div class="alert alert-warning">
                    <p>You need to <a href="/login">log in</a> to access personalized practice.</p>
                    <p>New to Pol_Ski? <a href="/register">Create an account</a> to track your progress.</p>
                </div>
            `;

            container.appendChild(loginRequired);
            return;
        }

        try {
            const words = await getWordsForReview(5);

            loading.classList.add('d-none');
            container.classList.remove('d-none');

            if (!words || !Array.isArray(words) || words.length === 0) {
                container.innerHTML = '<div class="alert alert-info">No words due for review. Great job staying on top of your vocabulary!</div>';
                const startReviewBtn = document.getElementById('startReviewBtn');
                if (startReviewBtn) startReviewBtn.disabled = true;
                return;
            }

            container.innerHTML = `<p>You have <strong>${words.length}</strong> words to review:</p>`;

            const wordsList = document.createElement('ul');
            words.slice(0, 3).forEach(word => {
                const li = document.createElement('li');
                li.textContent = word.polish;
                wordsList.appendChild(li);
            });

            if (words.length > 3) {
                const li = document.createElement('li');
                li.textContent = `...and ${words.length - 3} more`;
                wordsList.appendChild(li);
            }

            container.appendChild(wordsList);
        } catch (error) {
            loading.classList.add('d-none');
            container.classList.remove('d-none');
            container.innerHTML = `<div class="alert alert-danger">Error loading review words: ${error.message}</div>`;

            const startReviewBtn = document.getElementById('startReviewBtn');
            if (startReviewBtn) startReviewBtn.disabled = true;
        }
    }

    // Initialize new words section
    async function initNewWords() {
        const container = document.getElementById('newWordsContent');
        const loading = document.getElementById('newWordsLoading');

        if (!container || !loading) return;

        if (!isLoggedIn()) {
            loading.classList.add('d-none');
            container.classList.remove('d-none');

            const loginRequired = document.createElement('div');
            loginRequired.className = 'text-center p-3';
            loginRequired.innerHTML = `
                <div class="alert alert-warning">
                    <p>You need to <a href="/login">log in</a> to access personalized practice.</p>
                    <p>New to Pol_Ski? <a href="/register">Create an account</a> to track your progress.</p>
                </div>
            `;

            container.appendChild(loginRequired);
            return;
        }

        try {
            const words = await getNextWordsToLearn(5);

            loading.classList.add('d-none');
            container.classList.remove('d-none');

            if (!words || !Array.isArray(words) || words.length === 0) {
                container.innerHTML = '<div class="alert alert-info">You\'ve learned all available words! Check back later for more content.</div>';
                const startLearningBtn = document.getElementById('startLearningBtn');
                if (startLearningBtn) startLearningBtn.disabled = true;
                return;
            }

            container.innerHTML = `<p>Ready to learn <strong>${words.length}</strong> new words:</p>`;

            const wordsList = document.createElement('ul');
            words.forEach(word => {
                const li = document.createElement('li');
                li.textContent = `${word.polish} (${word.part_of_speech})`;
                wordsList.appendChild(li);
            });

            container.appendChild(wordsList);
        } catch (error) {
            loading.classList.add('d-none');
            container.classList.remove('d-none');
            container.innerHTML = `<div class="alert alert-danger">Error loading new words: ${error.message}</div>`;

            const startLearningBtn = document.getElementById('startLearningBtn');
            if (startLearningBtn) startLearningBtn.disabled = true;
        }
    }

    // Initialize practice page
    initReviewWords();
    initNewWords();

    // Practice area functionality
    function closePracticeArea() {
        const practiceArea = document.getElementById('practiceArea');
        if (practiceArea) practiceArea.classList.add('d-none');
    }

    const closePracticeBtn = document.getElementById('closePracticeBtn');
    if (closePracticeBtn) {
        closePracticeBtn.addEventListener('click', closePracticeArea);
    }

    // Review button click
    const startReviewBtn = document.getElementById('startReviewBtn');
    if (startReviewBtn) {
        startReviewBtn.addEventListener('click', async function() {
            if (!isLoggedIn()) {
                showAlert('Please log in to access this feature', 'warning', 'alertContainer');
                return;
            }

            try {
                const words = await getWordsForReview(10);

                if (!words || !Array.isArray(words) || words.length === 0) {
                    showAlert('No words due for review!', 'info', 'alertContainer');
                    return;
                }

                // Show practice area
                const practiceArea = document.getElementById('practiceArea');
                const practiceContent = document.getElementById('practiceContent');
                const practiceHeader = document.getElementById('practiceHeader');

                if (!practiceArea || !practiceContent || !practiceHeader) {
                    showAlert('Practice area not found', 'danger', 'alertContainer');
                    return;
                }

                practiceHeader.querySelector('h3').textContent = 'Review Words';
                practiceHeader.className = 'card-header bg-primary text-white d-flex justify-content-between align-items-center';

                practiceContent.innerHTML = '';

                // Create flashcard interface
                let currentWordIndex = 0;
                const reviewContainer = document.createElement('div');
                reviewContainer.className = 'review-container text-center';

                function showCurrentWord() {
                    if (currentWordIndex >= words.length) {
                        // Review complete
                        reviewContainer.innerHTML = `
                            <div class="alert alert-success">
                                <h4>Review Complete!</h4>
                                <p>You've reviewed all ${words.length} words.</p>
                            </div>
                            <button id="finishReviewBtn" class="btn btn-primary">Finish</button>
                        `;

                        const finishReviewBtn = reviewContainer.querySelector('#finishReviewBtn');
                        if (finishReviewBtn) {
                            finishReviewBtn.addEventListener('click', closePracticeArea);
                        }
                        return;
                    }

                    const word = words[currentWordIndex];

                    reviewContainer.innerHTML = `
                        <div class="flashcard mb-4">
                            <div class="flashcard-content">
                                <div class="polish-word mb-3">${word.polish || ''}</div>
                                <div class="english-translation mb-2 d-none" id="translation">${word.english || ''}</div>
                                <div class="pronunciation d-none" id="pronunciation">Pronunciation: ${word.pronunciation || ''}</div>
                            </div>
                            <button id="showAnswerBtn" class="btn btn-outline-primary mb-3">Show Translation</button>
                        </div>

                        <div class="d-none" id="masteryControls">
                            <p>How well did you remember this word?</p>
                            <div class="btn-group w-100 mb-3">
                                <button class="btn btn-outline-danger mastery-btn" data-level="1">Not at all</button>
                                <button class="btn btn-outline-warning mastery-btn" data-level="2">Barely</button>
                                <button class="btn btn-outline-info mastery-btn" data-level="3">Somewhat</button>
                                <button class="btn btn-outline-primary mastery-btn" data-level="4">Well</button>
                                <button class="btn btn-outline-success mastery-btn" data-level="5">Perfectly</button>
                            </div>
                        </div>

                        <div class="progress mb-2">
                            <div class="progress-bar" role="progressbar" style="width: ${(currentWordIndex / words.length) * 100}%"></div>
                        </div>
                        <small class="text-muted">Word ${currentWordIndex + 1} of ${words.length}</small>
                    `;

                    // Show answer button
                    const showAnswerBtn = reviewContainer.querySelector('#showAnswerBtn');
                    if (showAnswerBtn) {
                        showAnswerBtn.addEventListener('click', function() {
                            const translation = reviewContainer.querySelector('#translation');
                            const pronunciation = reviewContainer.querySelector('#pronunciation');
                            const masteryControls = reviewContainer.querySelector('#masteryControls');

                            if (translation) translation.classList.remove('d-none');
                            if (pronunciation) pronunciation.classList.remove('d-none');
                            if (masteryControls) masteryControls.classList.remove('d-none');

                            this.classList.add('d-none');
                        });
                    }

                    // Mastery buttons
                    const masteryBtns = reviewContainer.querySelectorAll('.mastery-btn');
                    masteryBtns.forEach(btn => {
                        btn.addEventListener('click', async function() {
                            const masteryLevel = parseInt(this.dataset.level);

                            try {
                                // Update word mastery
                                await updateWordMastery(word.id, masteryLevel);

                                // Move to next word
                                currentWordIndex++;
                                showCurrentWord();
                            } catch (error) {
                                showAlert(`Error updating word mastery: ${error.message}`, 'danger', 'alertContainer');
                            }
                        });
                    });
                }

                // Show first word
                practiceContent.appendChild(reviewContainer);
                showCurrentWord();

                // Show practice area
                practiceArea.classList.remove('d-none');

                // Scroll to practice area
                practiceArea.scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                showAlert(`Error starting review: ${error.message}`, 'danger', 'alertContainer');
            }
        });
    }

    // Quiz button click
    const startQuizBtn = document.getElementById('startQuizBtn');
    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', async function() {
            if (!isLoggedIn()) {
                showAlert('Please log in to access this feature', 'warning', 'alertContainer');
                return;
            }

            try {
                const exercises = await getPracticeExercises('multiple_choice');

                if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
                    showAlert('No practice exercises available!', 'info', 'alertContainer');
                    return;
                }

                // Show practice area
                const practiceArea = document.getElementById('practiceArea');
                const practiceContent = document.getElementById('practiceContent');
                const practiceHeader = document.getElementById('practiceHeader');

                if (!practiceArea || !practiceContent || !practiceHeader) {
                    showAlert('Practice area not found', 'danger', 'alertContainer');
                    return;
                }

                practiceHeader.querySelector('h3').textContent = 'Polish Quiz';
                practiceHeader.className = 'card-header bg-success text-white d-flex justify-content-between align-items-center';

                // Create quiz container
                const quizContainer = document.createElement('div');
                quizContainer.className = 'quiz-container';

                // Quiz results tracking
                let correctAnswers = 0;

                // Create questions
                exercises.forEach((exercise, index) => {
                    const questionElement = createQuizQuestion(exercise, (wordId, isCorrect) => {
                        if (isCorrect) correctAnswers++;

                        // Check if all questions are answered
                        const answeredCount = quizContainer.querySelectorAll('.quiz-option:disabled').length / 4; // 4 options per question

                        if (answeredCount >= exercises.length) {
                            // Show results
                            const score = Math.round((correctAnswers / exercises.length) * 100);

                            const resultsElement = document.createElement('div');
                            resultsElement.className = 'quiz-results mt-4';
                            resultsElement.innerHTML = `
                                <div class="alert alert-${score >= 70 ? 'success' : 'warning'}">
                                    <h4>Quiz Complete!</h4>
                                    <p>You got ${correctAnswers} out of ${exercises.length} correct (${score}%).</p>
                                    <div class="progress mb-3" style="height: 20px;">
                                        <div class="progress-bar ${score >= 70 ? 'bg-success' : 'bg-warning'}" style="width: ${score}%;">${score}%</div>
                                    </div>
                                </div>
                                <button id="finishQuizBtn" class="btn btn-primary">Finish</button>
                            `;

                            quizContainer.appendChild(resultsElement);

                            const finishQuizBtn = resultsElement.querySelector('#finishQuizBtn');
                            if (finishQuizBtn) {
                                finishQuizBtn.addEventListener('click', closePracticeArea);
                            }
                        }
                    });

                    // Add question number
                    const questionHeader = document.createElement('div');
                    questionHeader.className = 'mb-2 text-muted';
                    questionHeader.textContent = `Question ${index + 1} of ${exercises.length}`;

                    questionElement.prepend(questionHeader);
                    quizContainer.appendChild(questionElement);
                });

                // Show quiz in practice area
                practiceContent.innerHTML = '';
                practiceContent.appendChild(quizContainer);
                practiceArea.classList.remove('d-none');

                // Scroll to practice area
                practiceArea.scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                showAlert(`Error starting quiz: ${error.message}`, 'danger', 'alertContainer');
            }
        });
    }

    // Learn new words button click
    const startLearningBtn = document.getElementById('startLearningBtn');
    if (startLearningBtn) {
        startLearningBtn.addEventListener('click', async function() {
            if (!isLoggedIn()) {
                showAlert('Please log in to access this feature', 'warning', 'alertContainer');
                return;
            }

            try {
                const words = await getNextWordsToLearn(5);

                if (!words || !Array.isArray(words) || words.length === 0) {
                    showAlert('No new words available to learn!', 'info', 'alertContainer');
                    return;
                }

                // Show practice area
                const practiceArea = document.getElementById('practiceArea');
                const practiceContent = document.getElementById('practiceContent');
                const practiceHeader = document.getElementById('practiceHeader');

                if (!practiceArea || !practiceContent || !practiceHeader) {
                    showAlert('Practice area not found', 'danger', 'alertContainer');
                    return;
                }

                practiceHeader.querySelector('h3').textContent = 'Learn New Words';
                practiceHeader.className = 'card-header bg-info text-white d-flex justify-content-between align-items-center';

                // Create learning container
                const learningContainer = document.createElement('div');
                learningContainer.className = 'learning-container';

                // Introduction
                const intro = document.createElement('div');
                intro.className = 'alert alert-info mb-4';
                intro.innerHTML = `
                    <p>You'll learn ${words.length} new Polish words. For each word:</p>
                    <ol>
                        <li>Study the word and its pronunciation</li>
                        <li>Try to memorize it</li>
                        <li>Test yourself by covering the English translation</li>
                        <li>Mark the word as learned when you're ready to move on</li>
                    </ol>
                `;
                learningContainer.appendChild(intro);

                // Word cards
                const wordsContainer = document.createElement('div');
                wordsContainer.className = 'row';

                words.forEach(word => {
                    const col = document.createElement('div');
                    col.className = 'col-md-6 mb-4';

                    const card = document.createElement('div');
                    card.className = 'card h-100';
                    card.dataset.wordId = word.id;

                    card.innerHTML = `
                        <div class="card-body text-center">
                            <h3 class="polish-word mb-3">${word.polish || ''}</h3>
                            <h5 class="english-translation mb-2">${word.english || ''}</h5>
                            <p class="pronunciation text-muted">${word.pronunciation || ''}</p>
                            <p class="part-of-speech badge bg-secondary">${word.part_of_speech || ''}</p>
                        </div>
                        <div class="card-footer bg-white text-center">
                            <button class="btn btn-success word-learned-btn" data-word-id="${word.id}">Mark as Learned</button>
                        </div>
                    `;

                    col.appendChild(card);
                    wordsContainer.appendChild(col);
                });

                learningContainer.appendChild(wordsContainer);

                // Completion button - initially hidden
                const completionDiv = document.createElement('div');
                completionDiv.className = 'text-center mt-4 d-none';
                completionDiv.id = 'completionDiv';
                completionDiv.innerHTML = `
                    <div class="alert alert-success">
                        <h4>Well done!</h4>
                        <p>You've learned all the new words. Practice them regularly to move them to long-term memory.</p>
                    </div>
                    <button id="finishLearningBtn" class="btn btn-primary">Finish</button>
                `;
                learningContainer.appendChild(completionDiv);

                // Show learning content in practice area
                practiceContent.innerHTML = '';
                practiceContent.appendChild(learningContainer);
                practiceArea.classList.remove('d-none');

                // Add event listeners to "Mark as Learned" buttons
                const learnedBtns = document.querySelectorAll('.word-learned-btn');
                let learnedCount = 0;

                learnedBtns.forEach(btn => {
                    btn.addEventListener('click', async function() {
                        const wordId = parseInt(this.dataset.wordId);

                        try {
                            // Update word mastery to level 1 (just learned)
                            await updateWordMastery(wordId, 1);

                            // Update UI
                            const card = document.querySelector(`.card[data-word-id="${wordId}"]`);
                            if (card) card.classList.add('bg-light');

                            this.textContent = 'Learned!';
                            this.disabled = true;

                            // Increment count and check if all words are learned
                            learnedCount++;
                            if (learnedCount === words.length) {
                                // Show completion message
                                const completionDiv = document.getElementById('completionDiv');
                                if (completionDiv) completionDiv.classList.remove('d-none');
                            }
                        } catch (error) {
                            showAlert(`Error marking word as learned: ${error.message}`, 'danger', 'alertContainer');
                        }
                    });
                });

                // Add event listener to finish button
                const finishBtn = document.getElementById('finishLearningBtn');
                if (finishBtn) {
                    finishBtn.addEventListener('click', closePracticeArea);
                }

                // Scroll to practice area
                practiceArea.scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                showAlert(`Error loading new words: ${error.message}`, 'danger', 'alertContainer');
            }
        });
    }
}




//// Initialize page specific functionality
//document.addEventListener('DOMContentLoaded', function() {
//    console.log('DOM loaded, initializing page-specific functionality');
//
//    // Check what page we're on and initialize accordingly
//    const path = window.location.pathname;
//    console.log('Current path:', path);
//
//    if (path === '/lessons' || path === '/lessons/') {
//        console.log('Initializing lessons page');
//        initLessonsPage();
//    } else if (path.match(/^\/lessons\/\d+$/)) {
//        // Extract lesson ID from URL
//        const lessonId = path.split('/').pop();
//        console.log('Initializing lesson detail page for lesson ID:', lessonId);
//        // initLessonDetailPage(lessonId); // This function needs to be implemented
//    } else if (path === '/practice' || path === '/practice/') {
//        console.log('Initializing practice page');
//        // initPracticePage(); // This function needs to be implemented
//    } else if (path === '/progress' || path === '/progress/') {
//        console.log('Initializing progress page');
//        // initProgressPage(); // This function needs to be implemented
//    } else if (path === '/profile' || path === '/profile/') {
//        console.log('Initializing profile page');
//        // initProfilePage(); // This function needs to be implemented
//    }
//});

// Initialize page specific functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing page-specific functionality');

    // Check what page we're on and initialize accordingly
    const path = window.location.pathname;
    console.log('Current path:', path);

    if (path === '/lessons' || path === '/lessons/') {
        console.log('Initializing lessons page');
        initLessonsPage();
    } else if (path.match(/^\/lessons\/\d+$/)) {
        // Extract lesson ID from URL
        const lessonId = path.split('/').pop();
        console.log('Initializing lesson detail page for lesson ID:', lessonId);
        initLessonDetailPage(lessonId); // Now implemented
    } else if (path === '/practice' || path === '/practice/') {
        console.log('Initializing practice page');
        initPracticePage(); // Now implemented
    } else if (path === '/progress' || path === '/progress/') {
        console.log('Initializing progress page');
        // initProgressPage(); // This function still needs to be implemented
    } else if (path === '/profile' || path === '/profile/') {
        console.log('Initializing profile page');
        // initProfilePage(); // This function still needs to be implemented
    }
});