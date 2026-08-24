
// ============================================================================
// GLOBAL TOAST NOTIFICATION ENGINE
// ============================================================================
window.showToast = function(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => {
            if (toast.parentElement) toast.parentElement.removeChild(toast);
        }, 300);
    }, 3200);
};

// Safe localStorage wrappers to prevent security origin exceptions on file:// protocol
function safeGetStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

function safeSetStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {}
}

// Unified JavaScript Controller for Course Reviewer

document.addEventListener('DOMContentLoaded', () => {
        if (window.SupabaseSync) window.SupabaseSync.updateNavUI();
    initTheme();
    initGlobalNavigation();
    initStudyLayout();
});

// ==========================================
// 1. Theme Management (Light / Dark Mode)
// ==========================================
function initTheme() {
    const savedTheme = safeGetStorage('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }

    // Bind to the theme toggle button if it exists
    const themeBtn = document.querySelector('.theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
        updateThemeToggleIcon(themeBtn);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    safeSetStorage('theme', isDark ? 'dark' : 'light');
    
    const themeBtn = document.querySelector('.theme-toggle-btn');
    if (themeBtn) {
        updateThemeToggleIcon(themeBtn);
    }
}

function updateThemeToggleIcon(btn) {
    const isDark = document.body.classList.contains('dark');
    // Sun icon for dark mode (to toggle back to light), Moon icon for light mode
    btn.innerHTML = isDark 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
}

// Helper to get current page topic key
function getPageTopicKey() {
    const pathParts = window.location.pathname.split('/');
    const file = pathParts[pathParts.length - 1];
    return file ? file.replace('.html', '') : 'home';
}

// ==========================================
// 2. Global Tab Navigation & Scroll Persistence
// ==========================================
window.tabScrollPositions = {};
window.lastActiveTabId = 'reviewer';

function initGlobalNavigation() {
    // Auto-inject Whiteboard quick link into study page navbars if not already present
    const navRight = document.querySelector('nav.sticky-nav > div:last-child');
    if (navRight && !navRight.querySelector('.nav-wb-btn') && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && !window.location.pathname.endsWith('whiteboard.html')) {
        const wbLink = document.createElement('a');
        wbLink.href = '/whiteboard.html';
        wbLink.target = '_blank';
        wbLink.className = 'topbar-action-pill whiteboard-pill nav-wb-btn';
        wbLink.innerHTML = '<span class="pill-icon">📝</span><span class="pill-label">Whiteboard</span>';
        wbLink.style.marginRight = '0.35rem';
        navRight.insertBefore(wbLink, navRight.firstChild);
    }
    const pageKey = getPageTopicKey();

    // 1. Continuous real-time scroll recording for the active tab
    let scrollRafId = null;
    window.addEventListener('scroll', () => {
        if (scrollRafId) cancelAnimationFrame(scrollRafId);
        scrollRafId = requestAnimationFrame(() => {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab && activeTab.id) {
                const pos = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
                window.tabScrollPositions[activeTab.id] = pos;
                safeSetStorage(`scroll_pos_${pageKey}_${activeTab.id}`, pos);
            }
        });
    }, { passive: true });

    // Save scroll on tab visibility change or unload
    const saveCurrentTabScroll = () => {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id) {
            const pos = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
            window.tabScrollPositions[activeTab.id] = pos;
            safeSetStorage(`scroll_pos_${pageKey}_${activeTab.id}`, pos);
            safeSetStorage(`active_tab_${pageKey}`, activeTab.id);
        }
    };
    window.addEventListener('beforeunload', saveCurrentTabScroll);
    window.addEventListener('pagehide', saveCurrentTabScroll);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') saveCurrentTabScroll();
    });

    window.switchTab = function(tabId, updateHash = true) {
        // Step A: Save scroll position of currently visible tab before hiding it
        const currentActiveTab = document.querySelector('.tab-content.active');
        if (currentActiveTab && currentActiveTab.id) {
            const currentId = currentActiveTab.id;
            const currentPos = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
            window.tabScrollPositions[currentId] = currentPos;
            safeSetStorage(`scroll_pos_${pageKey}_${currentId}`, currentPos);
        }

        // Step B: Update DOM tab visibility & navigation buttons
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.classList.remove('active');
            const clickAttr = btn.getAttribute('onclick');
            if (clickAttr && clickAttr.includes(tabId)) {
                btn.classList.add('active');
            }
        });

        const activeTab = document.getElementById(tabId);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        window.lastActiveTabId = tabId;
        safeSetStorage(`active_tab_${pageKey}`, tabId);

        if (updateHash && window.history && window.history.replaceState) {
            window.history.replaceState(null, '', `#${tabId}`);
        }

        // Step C: Restore exact saved scroll position for target tab after DOM layout reflow
        const savedScroll = window.tabScrollPositions[tabId] !== undefined 
            ? window.tabScrollPositions[tabId] 
            : safeGetStorage(`scroll_pos_${pageKey}_${tabId}`);

        const targetY = (savedScroll !== null && savedScroll !== undefined) ? parseInt(savedScroll, 10) : 0;

        // Double-pass layout-settled scroll restoration
        requestAnimationFrame(() => {
            window.scrollTo({ top: targetY, behavior: 'instant' });
            setTimeout(() => {
                window.scrollTo({ top: targetY, behavior: 'instant' });
            }, 30);
        });
    };

    // Auto-restore active tab and its exact scroll position on initial page load / reload
    let initialTab = 'reviewer';
    const validTabs = ['reviewer', 'quiz', 'formulas', 'summary', 'quick-ref'];

    if (window.location.hash) {
        const hashVal = window.location.hash.replace('#', '');
        if (validTabs.includes(hashVal) && document.getElementById(hashVal) && document.getElementById(hashVal).classList.contains('tab-content')) {
            initialTab = hashVal;
        } else {
            // Anchor section heading (e.g. #section-3)
            initialTab = 'reviewer';
            setTimeout(() => {
                const targetElement = document.getElementById(hashVal);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 120);
        }
    } else {
        const savedTab = safeGetStorage(`active_tab_${pageKey}`);
        if (savedTab && validTabs.includes(savedTab) && document.getElementById(savedTab)) {
            initialTab = savedTab;
        }
    }

    if (initialTab && document.getElementById(initialTab)) {
        window.switchTab(initialTab, false);
    }
}

// ==========================================
// 3. Dynamic Study Layout (Sidebar & TOC Scrollspy)
// ==========================================
function initStudyLayout() {
    const reviewerTab = document.getElementById('reviewer');
    if (!reviewerTab) return;

    // Check if we already have study layout structure
    if (reviewerTab.querySelector('.study-layout')) return;

    // Gather all children elements of reviewer tab
    const children = Array.from(reviewerTab.children);
    
    // Create new elements: study-layout, study-sidebar, study-main
    const studyLayout = document.createElement('div');
    studyLayout.className = 'study-layout';

    const studySidebar = document.createElement('div');
    studySidebar.className = 'study-sidebar';

    const studyMain = document.createElement('div');
    studyMain.className = 'study-main';

    // Move all original elements inside studyMain
    children.forEach(child => {
        studyMain.appendChild(child);
    });

    // Build the TOC inside the sidebar (details element for mobile accordion toggle)
    const tocCard = document.createElement('details');
    tocCard.className = 'toc-card';
    if (window.innerWidth >= 1024) {
        tocCard.setAttribute('open', '');
    }
    
    const tocSummary = document.createElement('summary');
    tocSummary.className = 'toc-summary';
    tocSummary.innerText = 'On This Page';
    tocCard.appendChild(tocSummary);

    const tocContent = document.createElement('div');
    tocContent.className = 'toc-content';
    tocCard.appendChild(tocContent);

    const tocList = document.createElement('ul');
    tocList.className = 'toc-list';
    tocContent.appendChild(tocList);

    // Find all h2 and h3 elements inside cards
    const headings = studyMain.querySelectorAll('h2, h3');
    let tocItems = [];

    headings.forEach((heading, idx) => {
        // Exclude headings inside elements we don't want (like subheadings of subheadings, or custom banners)
        if (heading.closest('.formula-card') || heading.closest('.definition-card')) return;

        // Generate ID if missing
        if (!heading.id) {
            heading.id = 'sec-' + idx + '-' + heading.innerText.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }

        const li = document.createElement('li');
        li.className = 'toc-item ' + (heading.tagName === 'H3' ? 'h3-item' : 'h2-item');

        const link = document.createElement('a');
        link.className = 'toc-link';
        link.href = '#' + heading.id;
        
        // Clean text (remove section numbers for TOC display if desired, or keep them)
        link.innerText = heading.innerText;
        
        li.appendChild(link);
        tocList.appendChild(li);

        tocItems.push({ heading, linkElement: li });
    });

    studySidebar.appendChild(tocCard);
    studyLayout.appendChild(studySidebar);
    studyLayout.appendChild(studyMain);
    reviewerTab.appendChild(studyLayout);

    // If no headings found, hide sidebar
    if (tocItems.length === 0) {
        studySidebar.style.display = 'none';
        studyLayout.style.display = 'block';
    }

    // Scrollspy setup using IntersectionObserver
    if (tocItems.length > 0 && 'IntersectionObserver' in window) {
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -60% 0px', // Trigger when section occupies the upper part of the viewport
            threshold: 0
        };

        let currentActiveItem = null;

        const observer = new IntersectionObserver(entries => {
            // Find entries that are intersecting
            const visibleEntries = entries.filter(e => e.isIntersecting);
            if (visibleEntries.length > 0) {
                // Find target ID
                const targetId = visibleEntries[0].target.id;
                
                // Remove active class from all
                tocItems.forEach(item => item.linkElement.classList.remove('active'));
                
                // Add to active
                const activeItem = tocItems.find(item => item.heading.id === targetId);
                if (activeItem) {
                    activeItem.linkElement.classList.add('active');
                    currentActiveItem = activeItem;
                }
            }
        }, observerOptions);

        headings.forEach(heading => {
            observer.observe(heading);
        });
    }
}

// ==========================================
// 4. Subject & Lesson Metadata Mapping
// ==========================================
window.SUBJECT_LESSON_MAP = {
    'accessControl': {
        subject: 'Information Assurance & Security',
        courseCode: 'IAS 101',
        term: 'Prelim Term',
        lesson: 'Access Control Models & Principles',
        lessonSubtitle: 'IAAA, 5 Authentication Factors, Least Privilege & Security Models'
    },
    'week1And2': {
        subject: 'Information Assurance & Security',
        courseCode: 'IAS 101',
        term: 'Prelim Term',
        lesson: 'Foundations & Threat Landscape (Weeks 1–2)',
        lessonSubtitle: 'CIA Triad, Parkerian Hexad, Attack Vectors & Defense-in-Depth'
    },
    'week3And4': {
        subject: 'Information Assurance & Security',
        courseCode: 'IAS 101',
        term: 'Prelim Term',
        lesson: 'Governance & Risk Management (Weeks 3–4)',
        lessonSubtitle: 'Security Policies, ISO 27001 ISMS & Quantitative Risk Analysis'
    },
    'probabilityDistribution': {
        subject: 'Data Mining & Warehousing',
        courseCode: 'Data Mining',
        term: 'Prelim Term',
        lesson: 'Probability Distributions',
        lessonSubtitle: 'Discrete & Continuous Distributions, Moments & Z-Scores'
    },
    'setsEventsBayesianInference': {
        subject: 'Data Mining & Warehousing',
        courseCode: 'Data Mining',
        term: 'Prelim Term',
        lesson: 'Sets, Events & Bayesian Inference',
        lessonSubtitle: 'Set Operations, Conditional Probability & Bayes\' Theorem'
    },
    'introductionToAutomataTheoryFormalLanguages': {
        subject: 'Automata Theory & Formal Languages',
        courseCode: 'Automata Theory',
        term: 'Prelim Term',
        lesson: 'Introduction to Automata & Formal Languages',
        lessonSubtitle: 'Chomsky Hierarchy, Language Operations & Formal Grammars'
    },
    'automataComputabilityAndComplexity': {
        subject: 'Automata Theory & Formal Languages',
        courseCode: 'CS 311',
        term: 'Prelim Term',
        lesson: 'Automata, Computability & Complexity',
        lessonSubtitle: 'Limitations of CS, Decision Problems, Turing Machines & Halting Problem'
    },
    'introductiontoAutomataTheoryFormalLanguages': {
        subject: 'Automata Theory & Formal Languages',
        courseCode: 'CS 311',
        term: 'Prelim Term',
        lesson: 'Intro to Automata & Formal Languages',
        lessonSubtitle: 'Pioneers of Computation, Formal Languages & Chomsky Hierarchy'
    },
    'theCentralConceptsOfAutomata': {
        subject: 'Automata Theory & Formal Languages',
        courseCode: 'CS 311',
        term: 'Prelim Term',
        lesson: 'The Central Concepts of Automata',
        lessonSubtitle: 'Alphabets, Strings, Powers, Languages, Grammars & Finite Automata'
    },

    'introductionToOperatingSystems': {
        subject: 'Operating System Configuration',
        courseCode: 'OSC 101',
        term: 'Prelim Term',
        lesson: 'Introduction to Operating Systems',
        lessonSubtitle: 'Evolution, Core Functions, Typology & Desktop Ecosystems'
    },
    'networkConfigurationInWindowsOS': {
        subject: 'Operating System Configuration',
        courseCode: 'OSC 101',
        term: 'Prelim Term',
        lesson: 'Network Configuration in Windows OS',
        lessonSubtitle: 'TCP/IP, DHCP, Subnetting, Network Components & CLI Diagnostics'
    },
    'osStructuresAndSystemCalls': {
        subject: 'Operating System Configuration',
        courseCode: 'OSC 101',
        term: 'Prelim Term',
        lesson: 'OS Structures & System Calls',
        lessonSubtitle: 'Monolithic vs Microkernel, Dual-Mode Execution & POSIX System Calls'
    },

    'probabilities': {
        subject: 'Data Mining & Warehousing',
        courseCode: 'Data Mining',
        term: 'Prelim Term',
        lesson: 'Probabilities & Fundamentals',
        lessonSubtitle: 'Measuring Event Likelihoods, Sample Spaces & Combinatorics'
    },
    'probabilitydistribution': {
        subject: 'Data Mining & Warehousing',
        courseCode: 'Data Mining',
        term: 'Prelim Term',
        lesson: 'Probability Distributions',
        lessonSubtitle: 'Discrete & Continuous Distributions, Moments & Z-Scores'
    },
    'sets-events-bayesianinference': {
        subject: 'Data Mining & Warehousing',
        courseCode: 'Data Mining',
        term: 'Prelim Term',
        lesson: 'Sets, Events & Bayesian Inference',
        lessonSubtitle: 'Set Operations, Conditional Probability & Bayes\' Theorem'
    },
    'traditionalDataTechniques': {
        subject: 'Data Mining & Warehousing',
        courseCode: 'Data Mining',
        term: 'Prelim Term',
        lesson: 'Traditional Data Techniques',
        lessonSubtitle: 'Data Pipelines, Cleansing, BI Metrics & Regression'
    },
    'introductionToDataScience': {
        subject: 'Data Mining & Warehousing',
        courseCode: 'Data Mining',
        term: 'Prelim Term',
        lesson: 'Introduction to Data Science',
        lessonSubtitle: 'Data Analysis vs Analytics, Big Data 5 Vs & ML Foundations'
    },
    'week1-2': {
        subject: 'Information Assurance & Security',
        courseCode: 'IAS 101',
        term: 'Prelim Term',
        lesson: 'Foundations & Threat Landscape (Weeks 1–2)',
        lessonSubtitle: 'CIA Triad, Parkerian Hexad, Attack Vectors & Defense-in-Depth'
    },
    'week3-4': {
        subject: 'Information Assurance & Security',
        courseCode: 'IAS 101',
        term: 'Prelim Term',
        lesson: 'Governance & Risk Management (Weeks 3–4)',
        lessonSubtitle: 'Security Policies, ISO 27001 ISMS & Quantitative Risk Analysis'
    },
    'accesscontrol': {
        subject: 'Information Assurance & Security',
        courseCode: 'IAS 101',
        term: 'Prelim Term',
        lesson: 'Access Control Models & Principles',
        lessonSubtitle: 'IAAA, 5 Authentication Factors, Least Privilege & Security Models'
    }
};

window.getSubjectLessonDetails = function(key) {
    if (!key) return {
        subject: 'Academic Reviewer',
        courseCode: 'Course Reviewer',
        term: 'Prelim Term',
        lesson: 'Interactive Practice Quiz',
        lessonSubtitle: 'Study Guide Comprehensive Review'
    };
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9-]/g, '');
    for (const [k, val] of Object.entries(window.SUBJECT_LESSON_MAP)) {
        if (cleanKey.includes(k.toLowerCase()) || k.toLowerCase().includes(cleanKey)) {
            return val;
        }
    }
    return {
        subject: 'Academic Reviewer',
        courseCode: 'Course Reviewer',
        term: 'Prelim Term',
        lesson: key,
        lessonSubtitle: 'Study Guide Comprehensive Review'
    };
};

// ==========================================
// 5. Dynamic Shuffling Quiz Engine
// ==========================================
class QuizManager {
    constructor(quizData, containerId, scoreDisplayId) {
        this.originalQuizData = quizData;
        this.container = document.getElementById(containerId);
        this.scoreDisplay = document.getElementById(scoreDisplayId);
        this.shuffledQuizData = [];
        this.userAnswers = [];
        this.answeredCount = 0;
        this.correctCount = 0;
        this.currentFilter = 'all'; // 'all', 'incorrect', 'correct'
        this.currentSectionFilter = 'all'; // 'all' or specific section title
        this.allAnswersRevealed = false;
        
        // Extract a clean storage key from filename
        const pathParts = window.location.pathname.split('/');
        this.topicKey = pathParts[pathParts.length - 1].replace('.html', '');
        this.topicName = window.getSubjectDisplayName ? window.getSubjectDisplayName(this.topicKey) : this.topicKey;
        this.orderMode = safeGetStorage(`quiz_order_mode_${this.topicKey}`) || 'shuffled';
        
        window.activeQuiz = this;
        this.init();
    }

    init() {
        this.createSummaryModal();
        
        // 1. Try to restore active session state from localStorage
        const savedSessionStr = safeGetStorage(`quiz_session_state_${this.topicKey}`);
        if (savedSessionStr) {
            try {
                const session = JSON.parse(savedSessionStr);
                const hasArtifacts = session && Array.isArray(session.shuffledQuizData) && session.shuffledQuizData.some(q => 
                    q.q.includes('—') || q.q.includes('–') || q.q.toLowerCase().includes('cite:')
                );

                if (!hasArtifacts && session && Array.isArray(session.shuffledQuizData) && session.shuffledQuizData.length === this.originalQuizData.length) {
                    this.shuffledQuizData = session.shuffledQuizData;
                    this.userAnswers = session.userAnswers || new Array(this.originalQuizData.length).fill(null);
                    this.answeredCount = session.answeredCount || 0;
                    this.correctCount = session.correctCount || 0;
                    this.lastCardIndex = session.lastCardIndex || 0;
                    this.currentFilter = session.currentFilter || 'all';
                    this.currentSectionFilter = session.currentSectionFilter || 'all';
                    this.orderMode = session.orderMode || this.orderMode || 'shuffled';

                    this.render();
                    this.restoreAnsweredStates();
                    this.updateScore();
                    this.saveProgress();
                    return;
                }
            } catch (e) {
                console.warn("Could not restore saved quiz session:", e);
            }
        }

        // 2. Otherwise fresh setup
        this.shuffleAndReset();
    }

    shuffleAndReset(mode = null) {
        if (mode) {
            this.orderMode = mode;
            safeSetStorage(`quiz_order_mode_${this.topicKey}`, mode);
        }
        // Clear active session storage on explicit reset
        safeSetStorage(`quiz_session_state_${this.topicKey}`, '');

        this.answeredCount = 0;
        this.correctCount = 0;
        this.currentFilter = 'all';
        this.currentSectionFilter = 'all';
        this.allAnswersRevealed = false;
        this.lastCardIndex = 0;
        this.userAnswers = new Array(this.originalQuizData.length).fill(null);
        
        // Deep clone question pool
        let questionsPool = this.originalQuizData.map((item, idx) => ({
            ...item,
            originalIndex: idx
        }));

        if (this.orderMode === 'sequential') {
            // Sequential order with freshly shuffled options
            this.shuffledQuizData = questionsPool;
        } else {
            // Full Fisher-Yates Random Shuffle of questions
            this.shuffledQuizData = [...questionsPool];
            for (let i = this.shuffledQuizData.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.shuffledQuizData[i], this.shuffledQuizData[j]] = [this.shuffledQuizData[j], this.shuffledQuizData[i]];
            }
        }

        // Always randomize and reshuffle answer choices for each question
        this.shuffledQuizData = this.shuffledQuizData.map((item, qIdx) => {
            const originalOptions = item.options;
            let optionsWithIndices = originalOptions.map((opt, i) => ({ text: opt, wasCorrect: i === item.correct }));
            
            // Fisher-Yates choice reshuffle
            for (let i = optionsWithIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [optionsWithIndices[i], optionsWithIndices[j]] = [optionsWithIndices[j], optionsWithIndices[i]];
            }
            
            const newCorrectIdx = optionsWithIndices.findIndex(opt => opt.wasCorrect);
            
            return {
                q: item.q,
                options: optionsWithIndices.map(o => o.text),
                correct: newCorrectIdx,
                exp: item.exp,
                section: item.section || 'General Subject Topic',
                originalIndex: item.originalIndex !== undefined ? item.originalIndex : qIdx
            };
        });

        this.render();
        this.updateScore();
        this.saveProgress();
    }

    toggleOrderMode(newMode) {
        if (this.orderMode === newMode) return;
        
        if (this.answeredCount > 0) {
            window.showCustomConfirmModal({
                title: "Switch Quiz Progression Mode?",
                message: `Switching to ${newMode === 'sequential' ? 'Sequential Study Guide Order' : 'Random Shuffled Exam Mode'} will restart the quiz session in that order.`,
                icon: "🔄",
                confirmText: "Switch & Restart",
                cancelText: "Cancel",
                confirmBtnClass: "btn-primary",
                onConfirm: () => {
                    this.shuffleAndReset(newMode);
                }
            });
        } else {
            this.shuffleAndReset(newMode);
        }
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        // Inject Filter Bar above quiz container if not present
        this.renderFilterBar();

        this.shuffledQuizData.forEach((q, idx) => {
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.id = `q-card-${idx}`;

            const headerMeta = document.createElement('div');
            headerMeta.className = 'quiz-card-header-meta';
            headerMeta.innerHTML = `
                <span class="quiz-card-topic-pill">📍 <strong>${q.section || 'General Subject Topic'}</strong></span>
                <span class="quiz-card-num">Question ${idx + 1} of ${this.shuffledQuizData.length}</span>
            `;

            const text = document.createElement('div');
            text.className = 'quiz-card-text';
            text.innerHTML = q.q;

            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'quiz-options';

            q.options.forEach((optText, oIdx) => {
                const optBtn = document.createElement('button');
                optBtn.className = 'quiz-option-btn';
                optBtn.id = `q-${idx}-opt-${oIdx}`;
                optBtn.innerHTML = optText;
                optBtn.onclick = () => this.handleSelect(idx, oIdx);
                optionsDiv.appendChild(optBtn);
            });

            // Breakdown / Explanation block
            const expDiv = document.createElement('div');
            expDiv.className = 'quiz-explanation';
            expDiv.id = `exp-${idx}`;
            expDiv.innerHTML = `<strong>In-Depth Academic Explanation:</strong> ${q.exp}`;

            card.appendChild(headerMeta);
            card.appendChild(text);
            card.appendChild(optionsDiv);
            card.appendChild(expDiv);
            this.container.appendChild(card);
        });

        this.updateProgressBar();
    }

    renderFilterBar() {
        let filterBar = document.getElementById('quiz-filter-bar');
        if (!filterBar) {
            const header = document.querySelector('.quiz-header');
            if (header) {
                filterBar = document.createElement('div');
                filterBar.id = 'quiz-filter-bar';
                filterBar.className = 'quiz-filter-bar';
                header.insertAdjacentElement('afterend', filterBar);
            }
        }
        if (filterBar) {
            const incorrectCount = this.answeredCount - this.correctCount;
            const sections = [...new Set(this.originalQuizData.map(q => q.section).filter(Boolean))];
            
            let sectionChipsHtml = '';
            if (sections.length > 1) {
                sectionChipsHtml = `
                    <div class="quiz-section-filter-row">
                        <span class="quiz-filter-label">Filter Topic:</span>
                        <button class="quiz-section-chip ${this.currentSectionFilter === 'all' ? 'active' : ''}" onclick="window.activeQuiz.setSectionFilter('all')">All Topics (${this.shuffledQuizData.length})</button>
                        ${sections.map(sec => {
                            const count = this.originalQuizData.filter(q => q.section === sec).length;
                            const isAct = this.currentSectionFilter === sec;
                            return `<button class="quiz-section-chip ${isAct ? 'active' : ''}" onclick="window.activeQuiz.setSectionFilter('${sec.replace(/'/g, "\\'")}')">${sec} (${count})</button>`;
                        }).join('')}
                    </div>
                `;
            }

            filterBar.innerHTML = `
                <div class="quiz-filter-top-row">
                    <div class="quiz-filter-group">
                        <button class="quiz-filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" onclick="window.activeQuiz.setFilter('all')">All (${this.shuffledQuizData.length})</button>
                        <button class="quiz-filter-btn ${this.currentFilter === 'incorrect' ? 'active' : ''}" onclick="window.activeQuiz.setFilter('incorrect')">❌ Wrong (${incorrectCount})</button>
                        <button class="quiz-filter-btn ${this.currentFilter === 'correct' ? 'active' : ''}" onclick="window.activeQuiz.setFilter('correct')">✅ Correct (${this.correctCount})</button>
                        <button class="quiz-filter-btn ${this.allAnswersRevealed ? 'active' : ''}" onclick="window.activeQuiz.toggleRevealAllAnswers()">👁️ ${this.allAnswersRevealed ? 'Hide Answers' : 'Reveal All Answers'}</button>
                    </div>
                    <div class="quiz-order-mode-group">
                        <button class="quiz-mode-btn ${this.orderMode === 'shuffled' ? 'active' : ''}" onclick="window.activeQuiz.toggleOrderMode('shuffled')" title="Randomized question order for exam practice">🔀 Shuffled Exam</button>
                        <button class="quiz-mode-btn ${this.orderMode === 'sequential' ? 'active' : ''}" onclick="window.activeQuiz.toggleOrderMode('sequential')" title="Questions appear in exact Study Guide order">📑 Study Guide Order</button>
                    </div>
                </div>
                ${sectionChipsHtml}
            `;
        }
    }

    setSectionFilter(section) {
        this.currentSectionFilter = section;
        this.renderFilterBar();
        this.applyAllFilters();
    }

    setFilter(mode) {
        this.currentFilter = mode;
        this.renderFilterBar();
        this.applyAllFilters();
    }

    applyAllFilters() {
        this.shuffledQuizData.forEach((q, idx) => {
            const card = document.getElementById(`q-card-${idx}`);
            if (!card) return;

            const isAnswered = this.userAnswers[idx] !== null;
            const isCorrect = this.userAnswers[idx] === q.correct;
            const isIncorrect = isAnswered && !isCorrect;

            // Section check
            const matchesSection = this.currentSectionFilter === 'all' || q.section === this.currentSectionFilter;

            // Status check
            let matchesStatus = true;
            if (this.currentFilter === 'incorrect') {
                matchesStatus = (isIncorrect || (!isAnswered && this.answeredCount === this.shuffledQuizData.length));
                const expDiv = document.getElementById(`exp-${idx}`);
                if (expDiv && (isIncorrect || !isAnswered)) expDiv.style.display = 'block';
            } else if (this.currentFilter === 'correct') {
                matchesStatus = isCorrect;
            }

            if (matchesSection && matchesStatus) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    toggleRevealAllAnswers() {
        this.allAnswersRevealed = !this.allAnswersRevealed;
        this.renderFilterBar();
        this.shuffledQuizData.forEach((q, idx) => {
            const expDiv = document.getElementById(`exp-${idx}`);
            const correctBtn = document.getElementById(`q-${idx}-opt-${q.correct}`);
            const isAnswered = this.userAnswers[idx] !== null;

            if (this.allAnswersRevealed) {
                if (correctBtn) correctBtn.classList.add('correct-revealed');
                if (expDiv) expDiv.style.display = 'block';
            } else {
                if (correctBtn && !isAnswered) correctBtn.classList.remove('correct-revealed');
                if (expDiv) expDiv.style.display = isAnswered ? 'block' : 'none';
            }
        });
    }

    trackCurrentVisibleCard() {
        const cards = document.querySelectorAll('.quiz-card');
        if (!cards || cards.length === 0) return;
        
        let closestIndex = this.lastCardIndex || 0;
        let minDistance = Infinity;

        cards.forEach((card, idx) => {
            if (card.style.display !== 'none') {
                const rect = card.getBoundingClientRect();
                const distance = Math.abs(rect.top - 120);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = idx;
                }
            }
        });

        this.lastCardIndex = closestIndex;
        this.saveSessionState();
    }

    handleSelect(qIdx, selectedIdx) {
        if (this.userAnswers[qIdx] !== null) return;

        this.lastCardIndex = qIdx;
        this.userAnswers[qIdx] = selectedIdx;
        this.answeredCount++;

        const q = this.shuffledQuizData[qIdx];
        const isCorrect = selectedIdx === q.correct;
        
        const card = document.getElementById(`q-card-${qIdx}`);
        card.classList.add(isCorrect ? 'answered-correct' : 'answered-incorrect');

        // Styles for option buttons
        q.options.forEach((_, oIdx) => {
            const btn = document.getElementById(`q-${qIdx}-opt-${oIdx}`);
            btn.disabled = true;
            btn.classList.add('disabled');

            if (oIdx === q.correct) {
                btn.classList.add('correct');
            } else if (oIdx === selectedIdx) {
                btn.classList.add('incorrect');
            }
        });

        if (isCorrect) {
            this.correctCount++;
            if (window.soundEffects) window.soundEffects.playCorrect();
            if (window.mistakeVault) window.mistakeVault.removeMistake(this.topicKey, q.q);
        } else {
            if (window.soundEffects) window.soundEffects.playIncorrect();
            if (window.mistakeVault) window.mistakeVault.recordMistake(this.topicKey, this.topicName || this.topicKey, q, selectedIdx);
        }

        // Render In-Depth Breakdown Box
        const expDiv = document.getElementById(`exp-${qIdx}`);
        if (expDiv) {
            const userChoiceText = q.options[selectedIdx];
            const correctChoiceText = q.options[q.correct];
            
            if (isCorrect) {
                expDiv.innerHTML = `
                    <div class="breakdown-correct-badge">✅ Correct Submission</div>
                    <div class="breakdown-text"><strong>Answer:</strong> ${correctChoiceText}</div>
                    <div class="breakdown-explanation"><strong>In-Depth Justification:</strong> ${q.exp}</div>
                `;
            } else {
                expDiv.innerHTML = `
                    <div class="breakdown-incorrect-badge">❌ Incorrect Submission</div>
                    <div class="breakdown-user-choice"><strong>Your Choice:</strong> ${userChoiceText} (Incorrect)</div>
                    <div class="breakdown-correct-choice"><strong>Correct Answer:</strong> ${correctChoiceText}</div>
                    <div class="breakdown-explanation"><strong>In-Depth Breakdown:</strong> ${q.exp}</div>
                `;
            }
            expDiv.style.display = 'block';
        }
        
        this.updateScore();
        this.updateProgressBar();
        this.renderFilterBar();
        this.saveProgress();

        if (this.answeredCount === this.shuffledQuizData.length) {
            setTimeout(() => this.showSummaryModal(), 600);
        }
    }

    updateScore() {
        if (this.scoreDisplay) {
            const pct = this.answeredCount > 0 ? Math.round((this.correctCount / this.answeredCount) * 100) : 0;
            const info = window.getSubjectLessonDetails(this.topicKey);
            this.scoreDisplay.innerHTML = `
                <div class="quiz-subject-header">
                    <span class="quiz-subject-pill">📚 <strong>${info.subject}</strong></span>
                    <span class="quiz-lesson-pill">📖 <strong>${info.lesson}</strong></span>
                    <span class="quiz-term-pill">🏷️ ${info.term}</span>
                </div>
                <div class="score-display-row">
                    <div class="score-display-main">Score: <strong>${this.correctCount}</strong> / <strong>${this.shuffledQuizData.length}</strong></div>
                    <div class="quiz-stats">Progress: ${this.answeredCount} answered (${pct}% Accuracy)</div>
                </div>
            `;
        }
    }

    updateProgressBar() {
        let progressBar = document.getElementById('quiz-progress-bar');
        if (!progressBar) {
            const header = document.querySelector('.quiz-header');
            if (header) {
                const barContainer = document.createElement('div');
                barContainer.className = 'quiz-progress-container';
                progressBar = document.createElement('div');
                progressBar.id = 'quiz-progress-bar';
                progressBar.className = 'quiz-progress-bar';
                barContainer.appendChild(progressBar);
                header.insertAdjacentElement('afterend', barContainer);
            }
        }
        if (progressBar) {
            const pct = (this.answeredCount / this.shuffledQuizData.length) * 100;
            progressBar.style.width = `${pct}%`;
        }
    }

    restoreAnsweredStates() {
        this.shuffledQuizData.forEach((q, qIdx) => {
            const selectedIdx = this.userAnswers[qIdx];
            if (selectedIdx !== null && selectedIdx !== undefined) {
                const isCorrect = selectedIdx === q.correct;
                const card = document.getElementById(`q-card-${qIdx}`);
                if (card) {
                    card.classList.add(isCorrect ? 'answered-correct' : 'answered-incorrect');
                }

                q.options.forEach((_, oIdx) => {
                    const btn = document.getElementById(`q-${qIdx}-opt-${oIdx}`);
                    if (btn) {
                        btn.disabled = true;
                        btn.classList.add('disabled');
                        if (oIdx === q.correct) {
                            btn.classList.add('correct');
                        } else if (oIdx === selectedIdx) {
                            btn.classList.add('incorrect');
                        }
                    }
                });

                const expDiv = document.getElementById(`exp-${qIdx}`);
                if (expDiv) {
                    const userChoiceText = q.options[selectedIdx];
                    const correctChoiceText = q.options[q.correct];
                    if (isCorrect) {
                        expDiv.innerHTML = `
                            <div class="breakdown-correct-badge">✅ Correct Submission</div>
                            <div class="breakdown-text"><strong>Answer:</strong> ${correctChoiceText}</div>
                            <div class="breakdown-explanation"><strong>In-Depth Justification:</strong> ${q.exp}</div>
                        `;
                    } else {
                        expDiv.innerHTML = `
                            <div class="breakdown-incorrect-badge">❌ Incorrect Submission</div>
                            <div class="breakdown-user-choice"><strong>Your Choice:</strong> ${userChoiceText} (Incorrect)</div>
                            <div class="breakdown-correct-choice"><strong>Correct Answer:</strong> ${correctChoiceText}</div>
                            <div class="breakdown-explanation"><strong>In-Depth Breakdown:</strong> ${q.exp}</div>
                        `;
                    }
                    expDiv.style.display = 'block';
                }
            }
        });

        if (this.currentFilter !== 'all') {
            this.setFilter(this.currentFilter);
        }
    }

    saveSessionState() {
        const session = {
            shuffledQuizData: this.shuffledQuizData,
            userAnswers: this.userAnswers,
            answeredCount: this.answeredCount,
            correctCount: this.correctCount,
            lastCardIndex: this.lastCardIndex || 0,
            currentFilter: this.currentFilter || 'all',
            currentSectionFilter: this.currentSectionFilter || 'all',
            orderMode: this.orderMode || 'shuffled',
            timestamp: Date.now()
        };
        safeSetStorage(`quiz_session_state_${this.topicKey}`, JSON.stringify(session));
    }

    saveProgress() {
        this.saveSessionState();

        const progressData = {
            answered: this.answeredCount,
            correct: this.correctCount,
            total: this.shuffledQuizData.length,
            completed: this.answeredCount === this.shuffledQuizData.length,
            timestamp: Date.now()
        };
        
                safeSetStorage(`quiz_progress_${this.topicKey}`, JSON.stringify(progressData));

        // Auto-sync to Supabase cloud if student is logged in
        if (window.SupabaseSync && window.SupabaseSync.isConfigured()) {
            window.SupabaseSync.syncLessonProgress(this.topicKey, {
                answered: this.answeredCount,
                correct: this.correctCount,
                total: this.shuffledQuizData.length,
                userAnswers: this.userAnswers,
                orderMode: this.orderMode,
                lastCardIndex: this.lastCardIndex || 0
            });
        }
        
        const savedHighScore = safeGetStorage(`quiz_highscore_${this.topicKey}`);
        if (!savedHighScore || this.correctCount > parseInt(savedHighScore)) {
            safeSetStorage(`quiz_highscore_${this.topicKey}`, this.correctCount);
        }
        
        window.dispatchEvent(new Event('quizProgressUpdated'));
    }

    createSummaryModal() {
        if (document.getElementById('quiz-summary-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'quiz-summary-overlay';
        overlay.className = 'quiz-summary-overlay';

        const modal = document.createElement('div');
        modal.className = 'quiz-summary-modal';
        
        const badge = document.createElement('div');
        badge.id = 'modal-badge';
        badge.className = 'quiz-badge';
        badge.innerText = '🎓';

        const title = document.createElement('h3');
        title.id = 'modal-title';
        title.innerText = 'Quiz Completed!';

        const subjectCard = document.createElement('div');
        subjectCard.id = 'modal-subject-box';
        subjectCard.className = 'modal-subject-box';
        subjectCard.innerHTML = `
            <div class="modal-subject-tag" id="modal-subject-tag">📚 Subject</div>
            <div class="modal-lesson-title" id="modal-lesson-title">📖 Lesson</div>
            <div class="modal-lesson-sub" id="modal-lesson-sub">Lesson Subtitle</div>
        `;

        const msg = document.createElement('p');
        msg.id = 'modal-message';
        msg.innerText = 'Great job finishing the study reviewer!';

        const stats = document.createElement('div');
        stats.className = 'quiz-summary-stats';

        const statBox1 = document.createElement('div');
        statBox1.className = 'summary-stat-box';
        const val1 = document.createElement('div');
        val1.id = 'modal-score-val';
        val1.className = 'summary-stat-val';
        const lbl1 = document.createElement('div');
        lbl1.className = 'summary-stat-lbl';
        lbl1.innerText = 'Correct Answers';
        statBox1.appendChild(val1);
        statBox1.appendChild(lbl1);

        const statBox2 = document.createElement('div');
        statBox2.className = 'summary-stat-box';
        const val2 = document.createElement('div');
        val2.id = 'modal-pct-val';
        val2.className = 'summary-stat-val';
        const lbl2 = document.createElement('div');
        lbl2.className = 'summary-stat-lbl';
        lbl2.innerText = 'Accuracy';
        statBox2.appendChild(val2);
        statBox2.appendChild(lbl2);

        stats.appendChild(statBox1);
        stats.appendChild(statBox2);

        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group';
        btnGroup.style.justifyContent = 'center';
        btnGroup.style.flexWrap = 'wrap';

        const retakeBtn = document.createElement('button');
        retakeBtn.className = 'btn';
        retakeBtn.innerText = '🔀 Reshuffle & Retake Quiz';
        retakeBtn.onclick = () => {
            overlay.classList.remove('active');
            this.shuffleAndReset();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const reviewWrongBtn = document.createElement('button');
        reviewWrongBtn.className = 'btn btn-primary';
        reviewWrongBtn.id = 'modal-review-wrong-btn';
        reviewWrongBtn.innerText = '🔍 Review Incorrect Submissions';
        reviewWrongBtn.onclick = () => {
            overlay.classList.remove('active');
            this.setFilter('incorrect');
            const quizHeader = document.querySelector('.quiz-header');
            if (quizHeader) quizHeader.scrollIntoView({ behavior: 'smooth' });
        };

        const portalBtn = document.createElement('a');
        portalBtn.className = 'btn btn-secondary';
        const isSubfolder = window.location.pathname.toLowerCase().includes('/prelim/') || 
                            window.location.pathname.toLowerCase().includes('/midterm/') || 
                            window.location.pathname.toLowerCase().includes('/finals/');
        portalBtn.href = isSubfolder ? '../../../index.html' : 'index.html';
        portalBtn.innerText = 'Return to Portal';

        btnGroup.appendChild(retakeBtn);
        btnGroup.appendChild(reviewWrongBtn);
        btnGroup.appendChild(portalBtn);

        modal.appendChild(badge);
        modal.appendChild(title);
        modal.appendChild(subjectCard);
        modal.appendChild(msg);
        modal.appendChild(stats);
        modal.appendChild(btnGroup);
        overlay.appendChild(modal);

        document.body.appendChild(overlay);
    }

    showSummaryModal() {
        const overlay = document.getElementById('quiz-summary-overlay');
        const badge = document.getElementById('modal-badge');
        const title = document.getElementById('modal-title');
        const msg = document.getElementById('modal-message');
        const scoreVal = document.getElementById('modal-score-val');
        const pctVal = document.getElementById('modal-pct-val');

        const info = window.getSubjectLessonDetails(this.topicKey);
        if (info) {
            const subTag = document.getElementById('modal-subject-tag');
            const lesTitle = document.getElementById('modal-lesson-title');
            const lesSub = document.getElementById('modal-lesson-sub');
            if (subTag) subTag.innerHTML = `📚 <strong>${info.subject}</strong> <span class="term-chip">${info.term}</span>`;
            if (lesTitle) lesTitle.innerHTML = `📖 <strong>${info.lesson}</strong>`;
            if (lesSub) lesSub.innerText = info.lessonSubtitle || '';
        }

        const pct = Math.round((this.correctCount / this.shuffledQuizData.length) * 100);
        scoreVal.innerText = `${this.correctCount} / ${this.shuffledQuizData.length}`;
        pctVal.innerText = `${pct}%`;

        if (pct === 100) {
            badge.innerText = '👑';
            title.innerText = 'Flawless Victory!';
            msg.innerText = `Absolute mastery demonstrated in ${info.subject} (${info.lesson})! You answered every question word-for-word correct. Top of the class!`;
        } else if (pct >= 90) {
            badge.innerText = '🌟';
            title.innerText = 'Academic Excellence!';
            msg.innerText = `Incredible score for ${info.lesson}! You have deep, rigorous comprehension of this material. Ready for the exams!`;
        } else if (pct >= 75) {
            badge.innerText = '🎓';
            title.innerText = 'Well Done!';
            msg.innerText = `Solid performance in ${info.lesson}. Review your wrong submissions below to reach 100%!`;
        } else if (pct >= 50) {
            badge.innerText = '📚';
            title.innerText = 'Keep Studying!';
            msg.innerText = `Good attempt on ${info.lesson}. Click "Review Incorrect Submissions" below to study explanations for your wrong answers!`;
        } else {
            badge.innerText = '✍️';
            title.innerText = 'Needs Review';
            msg.innerText = `Do not be discouraged! Review the in-depth explanations for ${info.lesson} below and try again.`;
        }

        if (overlay) {
            overlay.classList.add('active');
        }
    }
}

// ==========================================
// Custom Website Modal Handling System
// ==========================================
window.showCustomConfirmModal = function({
    title = "Confirmation",
    message = "Are you sure you want to proceed?",
    icon = "⚠️",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmBtnClass = "btn-primary",
    onConfirm = () => {}
}) {
    let overlay = document.getElementById('custom-confirm-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'custom-confirm-overlay';
        overlay.className = 'custom-confirm-overlay';
        overlay.innerHTML = `
            <div class="custom-confirm-modal">
                <div class="custom-confirm-icon" id="confirm-modal-icon">⚠️</div>
                <h3 class="custom-confirm-title" id="confirm-modal-title">Confirmation</h3>
                <p class="custom-confirm-message" id="confirm-modal-message">Are you sure?</p>
                <div class="custom-confirm-actions">
                    <button class="btn btn-secondary" id="confirm-modal-cancel">Cancel</button>
                    <button class="btn btn-primary" id="confirm-modal-submit">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    const iconEl = document.getElementById('confirm-modal-icon');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const submitBtn = document.getElementById('confirm-modal-submit');

    if (iconEl) iconEl.innerText = icon;
    if (titleEl) titleEl.innerText = title;
    if (msgEl) msgEl.innerText = message;
    if (cancelBtn) cancelBtn.innerText = cancelText;
    if (submitBtn) {
        submitBtn.innerText = confirmText;
        submitBtn.className = `btn ${confirmBtnClass}`;
    }

    const closeModal = () => {
        overlay.classList.remove('active');
    };

    cancelBtn.onclick = closeModal;
    overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
    };

    submitBtn.onclick = () => {
        closeModal();
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    };

    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
};

window.submitQuiz = function() {
    if (!window.activeQuiz) return;
    const quiz = window.activeQuiz;
    const unansweredCount = quiz.shuffledQuizData.length - quiz.answeredCount;

    if (unansweredCount > 0) {
        window.showCustomConfirmModal({
            title: "Submit Quiz Early?",
            message: `You still have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''} remaining. Submitting now will grade unanswered items as incorrect.`,
            icon: "📝",
            confirmText: "Submit & Grade Quiz",
            cancelText: "Keep Reviewing",
            confirmBtnClass: "btn-primary",
            onConfirm: () => {
                quiz.shuffledQuizData.forEach((_, idx) => {
                    if (quiz.userAnswers[idx] === null) {
                        quiz.userAnswers[idx] = -1;
                        const card = document.getElementById(`q-card-${idx}`);
                        if (card) card.classList.add('answered-incorrect');
                        const expDiv = document.getElementById(`exp-${idx}`);
                        if (expDiv) expDiv.style.display = 'block';
                    }
                });
                quiz.answeredCount = quiz.shuffledQuizData.length;
                quiz.updateScore();
                quiz.updateProgressBar();
                quiz.renderFilterBar();
                quiz.saveProgress();
                quiz.showSummaryModal();
            }
        });
    } else {
        quiz.showSummaryModal();
    }
};

window.resetQuiz = function() {
    if (!window.activeQuiz) return;
    
    // If 0 questions answered, reshuffle silently
    if (window.activeQuiz.answeredCount === 0) {
        window.activeQuiz.shuffleAndReset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (typeof window.showToast === 'function') window.showToast("Questions & choices reshuffled!", "info");
        return;
    }

    window.showCustomConfirmModal({
        title: "Reshuffle & Reset Quiz?",
        message: `Resetting will clear your current answers and generate a brand-new randomized shuffle of all questions and answer choices.`,
        icon: "🔀",
        confirmText: "Yes, Reshuffle & Reset",
        cancelText: "Keep Reviewing",
        confirmBtnClass: "btn-danger",
        onConfirm: () => {
            window.activeQuiz.shuffleAndReset();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (typeof window.showToast === 'function') window.showToast("Quiz reset & reshuffled!", "success");
        }
    });
};

window.resetAllCourseProgress = function() {
    // Step 1: Initial Warning Modal
    window.showCustomConfirmModal({
        title: "Reset All Course Progress?",
        message: "This will clear your saved quiz answers, high scores, mastery percentages, and study time across all subjects.",
        icon: "⚠️",
        confirmText: "Proceed to Reset",
        cancelText: "Cancel",
        confirmBtnClass: "btn-primary",
        onConfirm: () => {
            // Step 2: Final Double Handling Confirmation Modal
            setTimeout(() => {
                window.showCustomConfirmModal({
                    title: "FINAL CONFIRMATION: Erase Everything?",
                    message: "Are you 100% sure? This action is irreversible and will permanently wipe all your reviewer history across all subjects.",
                    icon: "🚨",
                    confirmText: "YES, WIPE ALL PROGRESS",
                    cancelText: "Keep My Progress",
                    confirmBtnClass: "btn-danger",
                    onConfirm: () => {
                        const keysToRemove = [];
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && (
                                key.startsWith('quiz_progress_') ||
                                key.startsWith('quiz_session_state_') ||
                                key.startsWith('quiz_highscore_') ||
                                key.startsWith('study_time_') ||
                                key.startsWith('scroll_pos_') ||
                                key.startsWith('active_tab_')
                            )) {
                                keysToRemove.push(key);
                            }
                        }
                        keysToRemove.forEach(k => localStorage.removeItem(k));

                        if (window.activeQuiz) {
                            window.activeQuiz.shuffleAndReset();
                        }

                        window.dispatchEvent(new Event('quizProgressUpdated'));
                        window.dispatchEvent(new Event('studyTimeUpdated'));

                        if (typeof renderProgressTracker === 'function') {
                            renderProgressTracker();
                        }
                    }
                });
            }, 180);
        }
    });
};

// ==========================================
// 5. Global Cross-Page Focus Timer Manager (Multi-Subject)
// ==========================================
class FocusTimerManager {
    constructor() {
        // Strict Directive: Never initialize or run focus timer on the whiteboard
        try {
            var pageUrl = (window.location.pathname || '') + (window.location.href || '');
            if (pageUrl.toLowerCase().includes('whiteboard')) {
                return;
            }
        } catch(e){}

        this.activeSubject = 'index';
        this.intervalId = null;
        this.globalSettings = { isMinimized: true, isHidden: false };
        this.state = null; // Loaded per subject
        this.audioContext = null;
        this.alarmIntervals = [];

        this.initActiveSubject();
        this.loadGlobalSettings();
        this.injectHTML();
        this.loadCurrentSubjectTimer();
        this.bindEvents();

        // Listen for page unloads to save exact state
        window.addEventListener('beforeunload', () => {
            this.saveCurrentSubjectTimer();
        });
        window.addEventListener('pagehide', () => {
            this.saveCurrentSubjectTimer();
        });
    }

        detectPageSubjectKey() {
        let path = '';
        try {
            path = decodeURIComponent(window.location.pathname).toLowerCase();
        } catch (e) {
            path = window.location.pathname.toLowerCase();
        }
                        if (path.includes('automatacomputabilityandcomplexity')) return 'automataComputabilityAndComplexity';
        if (path.includes('introductiontoautomatatheoryformallanguages')) return 'introductiontoAutomataTheoryFormalLanguages';
        if (path.includes('thecentralconceptsofautomata')) return 'theCentralConceptsOfAutomata';
        if (path.includes('introductiontooperatingsystems')) return 'introductionToOperatingSystems';
        if (path.includes('networkconfigurationinwindowsos')) return 'networkConfigurationInWindowsOS';
        if (path.includes('osstructuresandsystemcalls')) return 'osStructuresAndSystemCalls';
        if (path.includes('accesscontrol')) return 'accesscontrol';
        if (path.includes('week1-2')) return 'week1-2';
        if (path.includes('week3-4')) return 'week3-4';
        if (path.includes('introductiontodatascience')) return 'introductionToDataScience';
        if (path.includes('traditionaldatatechniques')) return 'traditionalDataTechniques';
        if (path.includes('probabilitydistribution')) return 'probabilitydistribution';
        if (path.includes('sets-events-bayesianinference')) return 'sets-events-bayesianinference';
        if (path.includes('probabilities')) return 'probabilities';
        return 'index';
    }

        getSubjectName(key) {
        const names = {
            'index': 'General Portal',
                                    'automataComputabilityAndComplexity': 'Automata, Computability & Complexity',
            'introductiontoAutomataTheoryFormalLanguages': 'Intro to Automata & Formal Languages',
            'theCentralConceptsOfAutomata': 'Central Concepts of Automata',
                        'automataComputabilityAndComplexity': 'Automata, Computability & Complexity',
            'introductiontoAutomataTheoryFormalLanguages': 'Intro to Automata & Formal Languages',
            'theCentralConceptsOfAutomata': 'Central Concepts of Automata',
                    'introductionToOperatingSystems': 'Introduction to Operating Systems',
            'networkConfigurationInWindowsOS': 'Network Configuration in Windows OS',
            'osStructuresAndSystemCalls': 'OS Structures & System Calls',
            'accesscontrol': 'Access Control Models & Principles',
            'week1-2': 'Foundations & Threat Landscape',
            'week3-4': 'Governance & Risk Management',
            'introductionToDataScience': 'Introduction to Data Science',
            'probabilities': 'Probabilities',
            'probabilitydistribution': 'Probability Distributions',
            'sets-events-bayesianinference': 'Sets, Events & Bayes',
            'traditionalDataTechniques': 'Traditional Data Techniques'
        };
        return names[key] || 'General Portal';
    }

    initActiveSubject() {
        const pageSub = this.detectPageSubjectKey();
        if (pageSub !== 'index') {
            // Force active subject to be the current subject page
            this.activeSubject = pageSub;
            safeSetStorage('focus_timer_active_subject', pageSub);
        } else {
            // Load last selected subject on index, default to index
            this.activeSubject = safeGetStorage('focus_timer_active_subject') || 'index';
        }
    }

    loadGlobalSettings() {
        const saved = safeGetStorage('focus_timer_global_settings');
        if (saved) {
            try {
                Object.assign(this.globalSettings, JSON.parse(saved));
            } catch (e) {}
        }
    }

    saveGlobalSettings() {
        safeSetStorage('focus_timer_global_settings', JSON.stringify(this.globalSettings));
    }

    // Helper to get default state for a subject
    getDefaultState() {
        return {
            mode: 'pomodoro',
            isRunning: false,
            secondsElapsed: 0,
            secondsRemaining: 1500, // 25 mins
            customPomodoroDuration: 25, // default 25 mins
            lastUpdated: Date.now()
        };
    }

    loadCurrentSubjectTimer() {
        this.stopTicking();
        
        const stateKey = `focus_timer_state_${this.activeSubject}`;
        const saved = safeGetStorage(stateKey);
        const sessionSubject = safeGetStorage('focus_timer_session_active_subject');
        
        this.state = this.getDefaultState();
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                
                // If it was running, calculate elapsed time since last shutdown
                // BUT ONLY if we are reloading the SAME subject (not navigating between subjects)
                if (parsed.isRunning && parsed.lastUpdated && sessionSubject === this.activeSubject) {
                    const elapsedMs = Date.now() - parsed.lastUpdated;
                    const elapsedSec = Math.floor(elapsedMs / 1000);
                    
                    if (elapsedSec > 0) {
                        if (parsed.mode === 'stopwatch') {
                            parsed.secondsElapsed += elapsedSec;
                            this.addStudyTime(this.activeSubject, elapsedSec);
                        } else if (parsed.mode === 'pomodoro') {
                            parsed.secondsRemaining -= elapsedSec;
                            if (parsed.secondsRemaining <= 0) {
                                parsed.secondsRemaining = 0;
                                parsed.isRunning = false;
                                this.addStudyTime(this.activeSubject, parsed.secondsRemaining + elapsedSec);
                                this.playAlarm = true;
                            } else {
                                this.addStudyTime(this.activeSubject, elapsedSec);
                            }
                        }
                    }
                }
                
                Object.assign(this.state, parsed);
            } catch (e) {
                console.error("Error loading timer state for " + this.activeSubject, e);
            }
        }
        
        // Update session subject
        safeSetStorage('focus_timer_session_active_subject', this.activeSubject);

        // Sync custom inputs
        const durationInput = document.getElementById('pomodoro-duration-input');
        if (durationInput) {
            durationInput.value = this.state.customPomodoroDuration;
        }

        this.syncUI();

        if (this.state.isRunning) {
            this.startTicking();
        }

        if (this.playAlarm) {
            this.playAlarm = false;
            setTimeout(() => {
                this.triggerAlarm();
            }, 500);
        }
    }

    saveCurrentSubjectTimer() {
        if (!this.state) return;
        this.state.lastUpdated = Date.now();
        const stateKey = `focus_timer_state_${this.activeSubject}`;
        safeSetStorage(stateKey, JSON.stringify(this.state));
    }

    switchActiveSubject(newSubject) {
        if (this.activeSubject === newSubject) return;

        // 1. Save current state as paused
        if (this.state && this.state.isRunning) {
            const now = Date.now();
            const delta = Math.floor((now - this.state.lastUpdated) / 1000);
            if (delta > 0) {
                if (this.state.mode === 'stopwatch') {
                    this.state.secondsElapsed += delta;
                } else {
                    this.state.secondsRemaining = Math.max(0, this.state.secondsRemaining - delta);
                }
                this.addStudyTime(this.activeSubject, delta);
            }
            this.state.isRunning = false;
        }
        this.saveCurrentSubjectTimer();
        this.stopTicking();

        // 2. Change active subject
        this.activeSubject = newSubject;
        safeSetStorage('focus_timer_active_subject', newSubject);

        // 3. Load new subject's timer state
        this.loadCurrentSubjectTimer();
    }

    addStudyTime(subject, seconds) {
        if (seconds <= 0) return;
        const key = `study_time_${subject}`;
        const current = parseInt(safeGetStorage(key) || '0', 10);
        safeSetStorage(key, current + seconds);
        
        // Dispatch event for live progress updates on homepage
        window.dispatchEvent(new Event('studyTimeUpdated'));
    }

    playAudioAlarm() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            
            this.stopAudioAlarm();
            this.audioContext = new AudioContext();
            this.alarmIntervals = [];

            const playChime = () => {
                if (!this.audioContext) return;
                const now = this.audioContext.currentTime;
                
                const playTone = (time, freq, duration) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, time);
                    
                    gain.gain.setValueAtTime(0, time);
                    gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
                    
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    
                    osc.start(time);
                    osc.stop(time + duration);
                };

                // Ascending chime triad
                playTone(now, 523.25, 0.6); // C5
                playTone(now + 0.15, 659.25, 0.6); // E5
                playTone(now + 0.3, 783.99, 0.9); // G5
            };

            playChime();
            const repeatId = setInterval(playChime, 4000);
            this.alarmIntervals.push(repeatId);
        } catch (e) {
            console.error("Failed to play audio alarm:", e);
        }
    }

    stopAudioAlarm() {
        if (this.alarmIntervals) {
            this.alarmIntervals.forEach(id => clearInterval(id));
            this.alarmIntervals = [];
        }
        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch (e) {}
            this.audioContext = null;
        }
    }

    triggerAlarm() {
        const overlay = document.getElementById('timer-alarm-overlay');
        const title = document.getElementById('timer-alarm-title');
        const message = document.getElementById('timer-alarm-message');
        
        if (title) title.innerText = `Focus Session Complete!`;
        if (message) message.innerText = `Take a well-deserved 5-minute break for ${this.getSubjectName(this.activeSubject)}. Rest your eyes, stretch, or grab a drink! 🍵`;

        if (overlay) {
            overlay.classList.add('active');
        }

        this.playAudioAlarm();
    }

    closeAlarm() {
        const overlay = document.getElementById('timer-alarm-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        this.stopAudioAlarm();
    }

    injectHTML() {
        const isOnSubjectPage = this.detectPageSubjectKey() !== 'index';

        // 1. Inject Floating Timer Widget
        if (!document.getElementById('global-focus-timer')) {
            const widget = document.createElement('div');
            widget.id = 'global-focus-timer';
            widget.className = 'floating-focus-timer' + (this.globalSettings.isMinimized ? ' minimized' : '');
            if (this.globalSettings.isHidden) {
                widget.style.display = 'none';
            }

            widget.innerHTML = `
                <div class="timer-header" id="timer-header-click">
                    <div class="timer-header-title">
                        ⏱️ <span id="timer-header-time-text">00:00</span>
                    </div>
                    <div class="timer-header-controls">
                        <button class="timer-header-btn" id="timer-minimize-btn" title="Minimize/Maximize">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                        </button>
                        <button class="timer-header-btn" id="timer-toggle-visibility-btn" title="Hide Timer" style="font-size:1.1rem; font-weight:bold; line-height:1;">
                            &times;
                        </button>
                    </div>
                </div>
                <div class="timer-body">
                    <div class="timer-tabs">
                        <button class="timer-tab active" id="timer-tab-pomodoro">Pomodoro</button>
                        <button class="timer-tab" id="timer-tab-stopwatch">Stopwatch</button>
                    </div>
                    
                    <div class="timer-display-container">
                        <div class="timer-display" id="timer-display-text">00:00:00</div>
                        <div class="timer-progress-bar" id="timer-progress-container" style="display:none;">
                            <div class="timer-progress-fg" id="timer-progress-fg" style="width: 0%;"></div>
                        </div>
                    </div>

                    <!-- Custom Duration Row (Only shown in Pomodoro mode) -->
                    <div class="timer-settings-row" id="timer-settings-row">
                        <span style="font-size:0.72rem; color:var(--text-muted-color); font-weight:700; text-transform:uppercase;">Block Length:</span>
                        <div style="display:flex; align-items:center; gap:0.25rem;">
                            <input type="number" id="pomodoro-duration-input" min="1" max="180" value="25" class="pomodoro-duration-input">
                            <span style="font-size:0.72rem; color:var(--text-muted-color); font-weight:600;">mins</span>
                        </div>
                    </div>

                    <div style="font-size:0.72rem; color:var(--text-muted-color); font-weight:700; margin-bottom: -0.5rem; letter-spacing:0.02em;">
                        STUDY SUBJECT:
                    </div>
                    <div id="timer-subject-display" style="font-size:0.85rem; font-weight:700; color:var(--text-dark-color); padding: 0.35rem 0.5rem; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); background: rgba(0,0,0,0.02); display:${isOnSubjectPage ? 'block' : 'none'}; margin: 0.25rem 0;">
                        ${isOnSubjectPage ? '📚 <strong>' + this.getSubjectName(this.activeSubject) + '</strong>' : ''}
                    </div>
                    <select class="timer-subject-select" id="timer-subject-select" style="display:${isOnSubjectPage ? 'none' : 'block'};" ${isOnSubjectPage ? 'disabled' : ''}>
                        <option value="" disabled selected>Select a subject...</option>
                                                                                                <optgroup label="Automata Theory & Formal Languages">
                            <option value="automataComputabilityAndComplexity">Automata, Computability & Complexity</option>
                            <option value="introductiontoAutomataTheoryFormalLanguages">Intro to Automata & Formal Languages</option>
                            <option value="theCentralConceptsOfAutomata">Central Concepts of Automata</option>
                        </optgroup>
                        <optgroup label="Operating System Configuration">
                            <option value="introductionToOperatingSystems">Introduction to Operating Systems</option>
                            <option value="networkConfigurationInWindowsOS">Network Configuration in Windows OS</option>
                            <option value="osStructuresAndSystemCalls">OS Structures & System Calls</option>
                        </optgroup>
                        <optgroup label="Information Assurance & Security">
                            <option value="accesscontrol">Access Control Models & Principles</option>
                            <option value="week1-2">Foundations & Threat Landscape</option>
                            <option value="week3-4">Governance & Risk Management</option>
                        </optgroup>
                        <optgroup label="Data Mining">
                            <option value="introductionToDataScience">Introduction to Data Science</option>
                            <option value="probabilities">Probabilities</option>
                            <option value="probabilitydistribution">Probability Distributions</option>
                            <option value="sets-events-bayesianinference">Sets, Events & Bayes</option>
                            <option value="traditionalDataTechniques">Traditional Data Techniques</option>
                        </optgroup>
                    </select>

                    <div class="timer-controls">
                        <button class="timer-btn timer-btn-primary" id="timer-play-pause-btn">▶ Play</button>
                        <button class="timer-btn timer-btn-secondary" id="timer-reset-btn">🔄 Reset</button>
                    </div>
                </div>
            `;

            document.body.appendChild(widget);
        }

        // 2. Inject Alarm Overlay Window Handler
        if (!document.getElementById('timer-alarm-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'timer-alarm-overlay';
            overlay.className = 'timer-alarm-overlay';
            overlay.innerHTML = `
                <div class="timer-alarm-modal">
                    <div class="timer-alarm-icon">⏰</div>
                    <h3 id="timer-alarm-title">Focus Session Complete!</h3>
                    <p id="timer-alarm-message">Take a well-deserved 5-minute break. Rest your eyes, stretch, or grab a drink! 🍵</p>
                    <button class="btn btn-primary" id="timer-alarm-dismiss-btn" style="width:100%; font-weight:600; padding:0.6rem 1rem;">Dismiss</button>
                </div>
            `;
            document.body.appendChild(overlay);

            document.getElementById('timer-alarm-dismiss-btn').onclick = () => this.closeAlarm();
        }

        // 3. Inject Navbar Toggle Button next to theme switcher
        const themeBtn = document.querySelector('.theme-toggle-btn');
        if (themeBtn && !document.getElementById('nav-timer-toggle')) {
            const timerToggleBtn = document.createElement('button');
            timerToggleBtn.className = 'nav-btn';
            timerToggleBtn.id = 'nav-timer-toggle';
            timerToggleBtn.style.padding = '0 0.75rem';
            timerToggleBtn.style.fontSize = '0.85rem';
            timerToggleBtn.style.border = 'none';
            timerToggleBtn.style.background = 'none';
            timerToggleBtn.style.cursor = 'pointer';
            timerToggleBtn.style.display = 'flex';
            timerToggleBtn.style.alignItems = 'center';
            timerToggleBtn.style.gap = '0.25rem';
            timerToggleBtn.innerHTML = `⏱️ <span class="nav-timer-toggle-text">Timer</span>`;
            
            themeBtn.parentNode.insertBefore(timerToggleBtn, themeBtn);
        }
    }

    bindEvents() {
        const headerClick = document.getElementById('timer-header-click');
        const minimizeBtn = document.getElementById('timer-minimize-btn');
        const visibilityBtn = document.getElementById('timer-toggle-visibility-btn');
        const tabStopwatch = document.getElementById('timer-tab-stopwatch');
        const tabPomodoro = document.getElementById('timer-tab-pomodoro');
        const playPauseBtn = document.getElementById('timer-play-pause-btn');
        const resetBtn = document.getElementById('timer-reset-btn');
        const subjectSelect = document.getElementById('timer-subject-select');
        const durationInput = document.getElementById('pomodoro-duration-input');
        const navToggleBtn = document.getElementById('nav-timer-toggle');

        // Toggle Minimized state clicking header (only if not clicking controls)
        if (headerClick) {
            headerClick.addEventListener('click', (e) => {
                if (e.target.closest('.timer-header-controls')) return;
                this.toggleMinimize();
            });
        }
        
        if (minimizeBtn) minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        if (visibilityBtn) visibilityBtn.addEventListener('click', () => this.toggleHide());

        if (navToggleBtn) {
            navToggleBtn.addEventListener('click', () => this.toggleHide());
        }

        if (tabStopwatch) tabStopwatch.addEventListener('click', () => this.switchMode('stopwatch'));
        if (tabPomodoro) tabPomodoro.addEventListener('click', () => this.switchMode('pomodoro'));
        if (playPauseBtn) playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetTimer());

        if (subjectSelect) {
            subjectSelect.addEventListener('change', (e) => {
                this.switchActiveSubject(e.target.value);
            });
        }

        if (durationInput) {
            durationInput.addEventListener('change', (e) => {
                this.handleDurationChange(e.target.value);
            });
            durationInput.addEventListener('input', (e) => {
                this.handleDurationChange(e.target.value);
            });
        }
    }

    handleDurationChange(newMinutes) {
        const mins = parseInt(newMinutes, 10);
        if (isNaN(mins) || mins < 1) return;
        
        this.state.customPomodoroDuration = mins;
        
        // If timer is not running, reset secondsRemaining to match new duration
        if (!this.state.isRunning) {
            this.state.secondsRemaining = mins * 60;
        }
        
        this.saveCurrentSubjectTimer();
        this.syncUI();
    }

    toggleMinimize() {
        this.globalSettings.isMinimized = !this.globalSettings.isMinimized;
        this.saveGlobalSettings();
        const widget = document.getElementById('global-focus-timer');
        if (widget) {
            widget.classList.toggle('minimized', this.globalSettings.isMinimized);
        }
        this.syncUI();
    }

    toggleHide() {
        this.globalSettings.isHidden = !this.globalSettings.isHidden;
        this.saveGlobalSettings();
        const widget = document.getElementById('global-focus-timer');
        if (widget) {
            widget.style.display = this.globalSettings.isHidden ? 'none' : 'block';
            if (!this.globalSettings.isHidden) {
                // Expand when unhiding
                this.globalSettings.isMinimized = false;
                widget.classList.remove('minimized');
                this.saveGlobalSettings();
                this.syncUI();
            }
        }
    }

    switchMode(mode) {
        if (this.state.mode === mode) return;
        this.state.mode = mode;
        this.state.isRunning = false;
        this.stopTicking();
        
        // Reset when switching modes
        if (mode === 'stopwatch') {
            this.state.secondsElapsed = 0;
        } else {
            this.state.secondsRemaining = this.state.customPomodoroDuration * 60;
        }
        
        this.saveCurrentSubjectTimer();
        this.syncUI();
    }

    togglePlayPause() {
        // Don't allow starting if no real subject is selected
        if (!this.state.isRunning && (this.activeSubject === 'index' || !this.activeSubject)) {
            return; // Can't start timer without a subject
        }
        this.state.isRunning = !this.state.isRunning;
        if (this.state.isRunning) {
            this.startTicking();
        } else {
            this.stopTicking();
        }
        this.saveCurrentSubjectTimer();
        this.syncUI();
    }

    startTicking() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.state.lastUpdated = Date.now();
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
    }

    stopTicking() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    tick() {
        const now = Date.now();
        const delta = Math.floor((now - this.state.lastUpdated) / 1000);
        if (delta <= 0) return;

        this.state.lastUpdated = now;

        if (this.state.mode === 'stopwatch') {
            this.state.secondsElapsed += delta;
            this.addStudyTime(this.activeSubject, delta);
        } else if (this.state.mode === 'pomodoro') {
            this.state.secondsRemaining -= delta;
            this.addStudyTime(this.activeSubject, delta);
            
            if (this.state.secondsRemaining <= 0) {
                this.state.secondsRemaining = 0;
                this.state.isRunning = false;
                this.stopTicking();
                this.saveCurrentSubjectTimer();
                this.syncUI();
                this.triggerAlarm();
                return;
            }
        }
        
        this.saveCurrentSubjectTimer();
        this.syncUI();
    }

    resetTimer() {
        this.state.isRunning = false;
        this.stopTicking();
        if (this.state.mode === 'stopwatch') {
            this.state.secondsElapsed = 0;
        } else {
            this.state.secondsRemaining = this.state.customPomodoroDuration * 60;
        }
        this.saveCurrentSubjectTimer();
        this.syncUI();
    }

    formatTime(sec) {
        const hrs = Math.floor(sec / 3600);
        const mins = Math.floor((sec % 3600) / 60);
        const secs = sec % 60;
        
        const pad = (n) => String(n).padStart(2, '0');
        if (hrs > 0) {
            return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
        }
        return `${pad(mins)}:${pad(secs)}`;
    }

    syncUI() {
        const displayText = document.getElementById('timer-display-text');
        const headerText = document.getElementById('timer-header-time-text');
        const playPauseBtn = document.getElementById('timer-play-pause-btn');
        const tabStopwatch = document.getElementById('timer-tab-stopwatch');
        const tabPomodoro = document.getElementById('timer-tab-pomodoro');
        const progressContainer = document.getElementById('timer-progress-container');
        const progressFg = document.getElementById('timer-progress-fg');
        const subjectSelect = document.getElementById('timer-subject-select');
        const subjectDisplay = document.getElementById('timer-subject-display');
        const settingsRow = document.getElementById('timer-settings-row');
        const navToggleBtn = document.getElementById('nav-timer-toggle');

        let displayString = "00:00";
        if (this.state.mode === 'stopwatch') {
            displayString = this.formatTime(this.state.secondsElapsed);
            if (displayText) displayText.style.fontSize = '2.2rem';
            if (progressContainer) progressContainer.style.display = 'none';
            if (settingsRow) settingsRow.style.display = 'none';
            if (tabStopwatch) tabStopwatch.classList.add('active');
            if (tabPomodoro) tabPomodoro.classList.remove('active');
        } else {
            displayString = this.formatTime(this.state.secondsRemaining);
            if (displayText) displayText.style.fontSize = '2.2rem';
            if (progressContainer) progressContainer.style.display = 'block';
            if (settingsRow) settingsRow.style.display = 'flex';
            if (tabStopwatch) tabStopwatch.classList.remove('active');
            if (tabPomodoro) tabPomodoro.classList.add('active');

            // Calculate percentage
            const targetTotal = this.state.customPomodoroDuration * 60;
            const pct = targetTotal > 0 ? ((targetTotal - this.state.secondsRemaining) / targetTotal) * 100 : 0;
            if (progressFg) progressFg.style.width = `${pct}%`;
        }

        if (displayText) displayText.innerText = displayString;
        if (headerText) headerText.innerText = this.state.mode === 'stopwatch' 
            ? this.formatTime(this.state.secondsElapsed)
            : this.formatTime(this.state.secondsRemaining);

        if (playPauseBtn) {
            playPauseBtn.innerHTML = this.state.isRunning ? '⏸ Pause' : '▶ Play';
            if (this.state.isRunning) {
                playPauseBtn.style.backgroundColor = 'var(--accent-color)';
            } else {
                playPauseBtn.style.backgroundColor = 'var(--primary-color)';
            }
        }

        // Automatic subject locking UI
        const isOnSubjectPage = this.detectPageSubjectKey() !== 'index';
        if (isOnSubjectPage) {
            // Locked — hide dropdown completely, show static label
            if (subjectSelect) {
                subjectSelect.style.display = 'none';
                subjectSelect.disabled = true;
                subjectSelect.style.pointerEvents = 'none';
            }
            if (subjectDisplay) {
                subjectDisplay.style.display = 'block';
                subjectDisplay.innerHTML = `📚 <strong>${this.getSubjectName(this.activeSubject)}</strong>`;
            }
        } else {
            // Homepage — dropdown is interactive
            if (subjectSelect) {
                subjectSelect.style.display = 'block';
                subjectSelect.disabled = false;
                subjectSelect.style.pointerEvents = 'auto';
                subjectSelect.value = this.activeSubject;
            }
            if (subjectDisplay) subjectDisplay.style.display = 'none';
        }

        // Sync sticky navbar toggle button visual state if it exists
        if (navToggleBtn) {
            if (this.globalSettings.isHidden) {
                navToggleBtn.classList.remove('active');
            } else {
                navToggleBtn.classList.add('active');
            }
        }
    }
}

// Instantiate Focus Timer on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
        if (window.SupabaseSync) window.SupabaseSync.updateNavUI();
    window.focusTimer = new FocusTimerManager();
});


// ==========================================
// PWA Service Worker & Install Prompt Registration
// ==========================================
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
        const swPath = window.location.pathname.includes('/subject/') ? '../../../sw.js' : './sw.js';
        navigator.serviceWorker.register(swPath).then((reg) => {
            console.log('PWA Service Worker active:', reg.scope);
            
            // Check for updates immediately on load
            reg.update().catch(() => {});

            // Check for updates when tab becomes visible
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    reg.update().catch(() => {});
                }
            });

            // If a new worker is waiting, tell it to take over immediately
            if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                }
            });
        }).catch((err) => {
            console.warn('PWA Service Worker registration:', err);
        });

        // When new version takes control, update clients smoothly without breaking state
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[PWA] Service Worker updated to latest version in background.');
        });
    });
}

// ==========================================
// Automatic Version Check & Instant Cache Auto-Purge System
// ==========================================
// ==========================================
// PWA GRACEFUL AUTO-UPDATE CONTROLLER (Zero Cache Wiping)
// ==========================================
function initAutoUpdateChecker() {
    let isChecking = false;

    const checkVersion = async () => {
        if (isChecking || !navigator.onLine || window.location.protocol === 'file:') return;
        isChecking = true;
        try {
            const versionUrl = '/version.json';
            const res = await fetch(`${versionUrl}?_t=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            const localVersion = safeGetStorage('app_release_version');

            if (localVersion && data.version && localVersion !== data.version) {
                console.log(`[Auto-Updater] New version available: ${data.version} (current: ${localVersion}). Requesting Service Worker upgrade...`);
                safeSetStorage('app_release_version', data.version);
                localStorage.setItem('portal_active_build_time', String(data.buildTime || data.version));

                // Notify Service Worker to update and activate atomically
                if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    for (const reg of regs) {
                        await reg.update();
                        if (reg.waiting) {
                            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                        }
                    }
                }
            } else if (!localVersion && data.version) {
                safeSetStorage('app_release_version', data.version);
                localStorage.setItem('portal_active_build_time', String(data.buildTime || data.version));
            }
        } catch (e) {
            // Offline or network error ignored
        } finally {
            isChecking = false;
        }
    };

    // Check on load
    setTimeout(checkVersion, 1500);

    // Check when user returns to tab
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkVersion();
        }
    });

    window.addEventListener('focus', checkVersion);
}

// ==========================================
// Web Audio API Sound Effects Manager
// ==========================================
class SoundEffectsManager {
    constructor() {
        this.ctx = null;
        this.enabled = safeGetStorage('sound_effects_enabled') !== 'false';
        this.initUI();
    }

    getAudioContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    toggle() {
        this.enabled = !this.enabled;
        safeSetStorage('sound_effects_enabled', this.enabled ? 'true' : 'false');
        this.updateBtnUI();
        if (this.enabled) {
            this.playCorrect();
        }
    }

    initUI() {
        const navRight = document.querySelector('.nav-right') || document.querySelector('.nav-actions');
        if (navRight && !document.getElementById('nav-sound-btn')) {
            const btn = document.createElement('button');
            btn.id = 'nav-sound-btn';
            btn.className = 'nav-sound-btn' + (this.enabled ? '' : ' muted');
            btn.onclick = () => this.toggle();
            navRight.prepend(btn);
            this.updateBtnUI();
        }
    }

    updateBtnUI() {
        const btn = document.getElementById('nav-sound-btn');
        if (btn) {
            btn.className = 'nav-sound-btn' + (this.enabled ? '' : ' muted');
            btn.innerHTML = this.enabled ? '🔊 <span style="font-size:0.8rem;">Sound</span>' : '🔇 <span style="font-size:0.8rem;">Muted</span>';
            btn.title = this.enabled ? 'Sound Effects: ON (Click to mute)' : 'Sound Effects: OFF (Click to unmute)';
        }
    }

    playClick() {
        if (!this.enabled) return;
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } catch (e) {}
    }

    playCorrect() {
        if (!this.enabled) return;
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;
            const notes = [523.25, 659.25, 783.99]; // C5 - E5 - G5
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
                gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.06 + 0.28);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.06);
                osc.stop(ctx.currentTime + i * 0.06 + 0.28);
            });
        } catch (e) {}
    }

    playIncorrect() {
        if (!this.enabled) return;
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;
            const notes = [349.23, 293.66]; // F4 -> D4
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
                gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.08 + 0.22);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.08);
                osc.stop(ctx.currentTime + i * 0.08 + 0.22);
            });
        } catch (e) {}
    }

    playSuccess() {
        if (!this.enabled) return;
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // Victory Fanfare
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
                gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.09);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.09 + 0.45);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.09);
                osc.stop(ctx.currentTime + i * 0.09 + 0.45);
            });
        } catch (e) {}
    }

    playTimerBell() {
        if (!this.enabled) return;
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;
            [440, 880].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(i === 0 ? 0.18 : 0.06, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 2.5);
            });
        } catch (e) {}
    }
}

// ==========================================
// Subject Key & Title Lookup System
// ==========================================
window.getSubjectDisplayName = function(key) {
    if (!key) return 'General Review';
    const names = {
                                'automataComputabilityAndComplexity': 'Automata, Computability & Complexity',
            'introductiontoAutomataTheoryFormalLanguages': 'Intro to Automata & Formal Languages',
            'theCentralConceptsOfAutomata': 'Central Concepts of Automata',
                        'automataComputabilityAndComplexity': 'Automata, Computability & Complexity',
            'introductiontoAutomataTheoryFormalLanguages': 'Intro to Automata & Formal Languages',
            'theCentralConceptsOfAutomata': 'Central Concepts of Automata',
                    'introductionToOperatingSystems': 'Introduction to Operating Systems',
            'networkConfigurationInWindowsOS': 'Network Configuration in Windows OS',
            'osStructuresAndSystemCalls': 'OS Structures & System Calls',
            'accesscontrol': 'Access Control Models & Principles',
        'week1-2': 'Foundations & Threat Landscape',
        'week3-4': 'Governance & Risk Management',
        'introductionToDataScience': 'Introduction to Data Science',
        'probabilities': 'Probabilities',
        'probabilitydistribution': 'Probability Distributions',
        'sets-events-bayesianinference': 'Sets, Events & Bayesian Inference',
        'traditionalDataTechniques': 'Traditional Data Techniques'
    };
    return names[key] || key;
};

// ==========================================
// Mistake Vault & Targeted Weakness Drilling System
// ==========================================
class MistakeVaultManager {
    constructor() {
        this.storageKey = 'mistake_vault_records';
        if (this.isHomepage()) {
            this.initOverlay();
            this.renderHomepageWidget();
            window.addEventListener('mistakeVaultUpdated', () => this.renderHomepageWidget());
        }
    }

    isHomepage() {
        const p = window.location.pathname.toLowerCase();
        return p === '/' || p.endsWith('/index.html') || p.endsWith('index.html') || p.endsWith('/') || 
               (!p.includes('/prelim/') && !p.includes('/midterm/') && !p.includes('/finals/'));
    }

    getMistakes() {
        const raw = safeGetStorage(this.storageKey);
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    }

    saveMistakes(mistakes) {
        safeSetStorage(this.storageKey, JSON.stringify(mistakes));
        window.dispatchEvent(new Event('mistakeVaultUpdated'));
    }

    recordMistake(topicKey, topicName, questionObj, userSelectedIndex) {
        let mistakes = this.getMistakes();
        const resolvedTopicName = (window.getSubjectDisplayName ? window.getSubjectDisplayName(topicKey) : null) || topicName || topicKey;
        const existingIdx = mistakes.findIndex(m => m.topicKey === topicKey && m.q === questionObj.q);
        const record = {
            id: 'm_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            topicKey: topicKey,
            topicName: resolvedTopicName,
            q: questionObj.q,
            options: questionObj.options,
            correct: questionObj.correct,
            exp: questionObj.exp,
            userChoice: userSelectedIndex,
            timestamp: Date.now()
        };

        if (existingIdx >= 0) {
            mistakes[existingIdx] = record;
        } else {
            mistakes.unshift(record);
        }

        this.saveMistakes(mistakes);
    }

    removeMistake(topicKey, questionText) {
        let mistakes = this.getMistakes();
        const filtered = mistakes.filter(m => !(m.topicKey === topicKey && m.q === questionText));
        if (filtered.length !== mistakes.length) {
            this.saveMistakes(filtered);
        }
    }

    clearVault() {
        window.showCustomConfirmModal({
            title: "Clear Mistake Vault?",
            message: "Are you sure you want to clear all logged mistakes? This cannot be undone.",
            icon: "🗑️",
            confirmText: "Clear All Mistakes",
            cancelText: "Cancel",
            confirmBtnClass: "btn-danger",
            onConfirm: () => {
                this.saveMistakes([]);
                if (window.soundEffects) window.soundEffects.playClick();
            }
        });
    }

    initOverlay() {
        if (!this.isHomepage()) return;
        if (document.getElementById('mistake-drill-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'mistake-drill-overlay';
        overlay.className = 'mistake-drill-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'drill-modal-title');
        overlay.innerHTML = `
            <div class="mistake-drill-modal">
                <div class="mistake-drill-header">
                    <div>
                        <h3 id="drill-modal-title" style="margin:0; font-size:1.15rem; font-family:'Outfit', sans-serif;">🎯 Mistake Vault Drill Session</h3>
                        <p style="margin:0.2rem 0 0 0; font-size:0.82rem; color:var(--text-muted-color);" id="drill-subtitle">Targeted Practice</p>
                    </div>
                    <button class="btn btn-secondary" onclick="window.mistakeVault.closeDrill()" style="padding:0.4rem 0.85rem; font-size:0.85rem; font-weight:600; cursor:pointer;" aria-label="Close Drill Session">✕ Close</button>
                </div>
                <div class="mistake-drill-body" id="drill-modal-body">
                </div>
            </div>
        `;

        // Light dismiss on backdrop click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeDrill();
            }
        });

        // Dismiss on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                this.closeDrill();
            }
        });

        document.body.appendChild(overlay);
    }

    openDrill() {
        if (!this.isHomepage()) return;
        this.initOverlay();

        const mistakes = this.getMistakes();
        if (mistakes.length === 0) {
            window.showCustomConfirmModal({
                title: "Vault is Empty!",
                message: "You have 0 incorrect questions in your vault. Take a practice quiz to test your knowledge!",
                icon: "🎉",
                confirmText: "Got it",
                cancelText: "Close",
                confirmBtnClass: "btn-primary"
            });
            return;
        }

        const overlay = document.getElementById('mistake-drill-overlay');
        const body = document.getElementById('drill-modal-body');
        const subtitle = document.getElementById('drill-subtitle');
        if (!overlay || !body) return;

        subtitle.innerText = `${mistakes.length} Question${mistakes.length > 1 ? 's' : ''} to Master`;
        body.innerHTML = '';

        mistakes.forEach((m, idx) => {
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.id = `drill-card-${m.id}`;
            card.style.marginBottom = '1.25rem';

            const meta = document.createElement('div');
            meta.style.display = 'flex';
            meta.style.justifyContent = 'space-between';
            meta.style.fontSize = '0.8rem';
            meta.style.color = 'var(--text-muted-color)';
            meta.style.marginBottom = '0.5rem';
            
            const displayTopicName = (window.getSubjectDisplayName ? window.getSubjectDisplayName(m.topicKey) : null) || m.topicName || m.topicKey;
            meta.innerHTML = `<span><strong style="color:var(--primary-color);">Topic:</strong> ${displayTopicName}</span> <span>#${idx + 1} of ${mistakes.length}</span>`;

            const text = document.createElement('div');
            text.className = 'quiz-card-text';
            text.innerHTML = m.q;

            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'quiz-options';

            m.options.forEach((optText, oIdx) => {
                const optBtn = document.createElement('button');
                optBtn.className = 'quiz-option-btn';
                optBtn.id = `drill-${m.id}-opt-${oIdx}`;
                optBtn.innerHTML = optText;
                optBtn.onclick = () => this.handleDrillSelect(m, oIdx);
                optionsDiv.appendChild(optBtn);
            });

            const expDiv = document.createElement('div');
            expDiv.className = 'quiz-explanation';
            expDiv.id = `drill-exp-${m.id}`;

            card.appendChild(meta);
            card.appendChild(text);
            card.appendChild(optionsDiv);
            card.appendChild(expDiv);
            body.appendChild(card);
        });

        overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
    }

    handleDrillSelect(mistakeObj, selectedIdx) {
        const card = document.getElementById(`drill-card-${mistakeObj.id}`);
        const expDiv = document.getElementById(`drill-exp-${mistakeObj.id}`);
        const isCorrect = selectedIdx === mistakeObj.correct;

        mistakeObj.options.forEach((_, oIdx) => {
            const btn = document.getElementById(`drill-${mistakeObj.id}-opt-${oIdx}`);
            if (btn) {
                btn.disabled = true;
                btn.classList.add('disabled');
                if (oIdx === mistakeObj.correct) btn.classList.add('correct');
                else if (oIdx === selectedIdx) btn.classList.add('incorrect');
            }
        });

        if (isCorrect) {
            if (window.soundEffects) window.soundEffects.playCorrect();
            if (card) card.classList.add('answered-correct');
            if (expDiv) {
                expDiv.innerHTML = `
                    <div class="breakdown-correct-badge">🎉 Mastered & Cleared from Vault!</div>
                    <div class="breakdown-explanation">${mistakeObj.exp}</div>
                `;
                expDiv.style.display = 'block';
            }
            this.removeMistake(mistakeObj.topicKey, mistakeObj.q);
        } else {
            if (window.soundEffects) window.soundEffects.playIncorrect();
            if (card) card.classList.add('answered-incorrect');
            if (expDiv) {
                expDiv.innerHTML = `
                    <div class="breakdown-incorrect-badge">❌ Incorrect — Kept in Vault for Practice</div>
                    <div class="breakdown-correct-choice"><strong>Correct:</strong> ${mistakeObj.options[mistakeObj.correct]}</div>
                    <div class="breakdown-explanation">${mistakeObj.exp}</div>
                `;
                expDiv.style.display = 'block';
            }
        }
    }

    closeDrill() {
        const overlay = document.getElementById('mistake-drill-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 250);
        }
        if (this.isHomepage()) {
            this.renderHomepageWidget();
        }
    }

    renderHomepageWidget() {
        if (!this.isHomepage()) return;
        const container = document.getElementById('mistake-vault-widget');
        if (!container) return;
        const mistakes = this.getMistakes();

        container.innerHTML = `
            <div class="mistake-vault-header">
                <h3 style="margin:0; font-size:1.05rem;">🎯 Mistake Vault</h3>
                <span class="mistake-count-badge">${mistakes.length} Mistake${mistakes.length === 1 ? '' : 's'}</span>
            </div>
            <p style="font-size:0.85rem; color:var(--text-muted-color); margin-bottom:1rem; line-height:1.4;">
                ${mistakes.length > 0 ? `You have <strong>${mistakes.length}</strong> question${mistakes.length > 1 ? 's' : ''} saved for targeted drilling. Practice them to achieve 100% mastery.` : '🎉 Excellent! You have 0 mistakes in your vault.'}
            </p>
            <div style="display:flex; gap:0.5rem;">
                <button class="btn btn-primary" onclick="window.mistakeVault.openDrill()" style="flex:1; font-size:0.82rem; padding:0.55rem; min-height:40px;" ${mistakes.length === 0 ? 'disabled' : ''}>
                    🚀 Drill Mistakes (${mistakes.length})
                </button>
                ${mistakes.length > 0 ? `
                    <button class="btn btn-secondary" onclick="window.mistakeVault.clearVault()" style="font-size:0.82rem; padding:0.55rem 0.75rem; min-height:40px;" title="Clear Vault" aria-label="Clear Mistake Vault">
                        🗑️
                    </button>
                ` : ''}
            </div>
        `;
    }
}

// ==========================================
// Interactive Academic Calculators
// ==========================================
window.calculateBayes = function() {
    const pA = parseFloat(document.getElementById('bayes-prior').value) || 0;
    const pBgA = parseFloat(document.getElementById('bayes-likelihood').value) || 0;
    const pBgNotA = parseFloat(document.getElementById('bayes-false-positive').value) || 0;

    const pNotA = 1 - pA;
    const pB = (pBgA * pA) + (pBgNotA * pNotA);
    const pAgB = pB > 0 ? (pBgA * pA) / pB : 0;

    const resVal = document.getElementById('bayes-result-val');
    const steps = document.getElementById('bayes-math-steps');

    if (resVal) {
        resVal.innerHTML = `P(A|B) = <strong>${(pAgB * 100).toFixed(2)}%</strong> <span style="font-size:0.9rem; color:var(--text-muted-color); font-weight:normal;">(${pAgB.toFixed(4)})</span>`;
    }

    if (steps) {
        steps.innerHTML = `
            <strong>Step-by-Step Derivation:</strong><br>
            • <strong>1. Prior Probabilities:</strong> P(A) = ${pA}, P(¬A) = ${pNotA.toFixed(4)}<br>
            • <strong>2. Total Probability of Evidence P(B):</strong><br>
            &nbsp;&nbsp;&nbsp;P(B) = [P(B|A) × P(A)] + [P(B|¬A) × P(¬A)]<br>
            &nbsp;&nbsp;&nbsp;P(B) = [${pBgA} × ${pA}] + [${pBgNotA} × ${pNotA.toFixed(4)}] = <strong>${pB.toFixed(5)}</strong><br>
            • <strong>3. Posterior Probability P(A|B):</strong><br>
            &nbsp;&nbsp;&nbsp;P(A|B) = [${pBgA} × ${pA}] / ${pB.toFixed(5)} = <strong>${(pAgB * 100).toFixed(2)}%</strong>
        `;
    }

    if (window.soundEffects) window.soundEffects.playClick();
};

window.calculateRisk = function() {
    const av = parseFloat(document.getElementById('risk-av').value) || 0;
    const efPre = (parseFloat(document.getElementById('risk-ef-pre').value) || 0) / 100;
    const aroPre = parseFloat(document.getElementById('risk-aro-pre').value) || 0;
    const cost = parseFloat(document.getElementById('risk-cost').value) || 0;
    const efPost = (parseFloat(document.getElementById('risk-ef-post').value) || 0) / 100;
    const aroPost = parseFloat(document.getElementById('risk-aro-post').value) || 0;

    const slePre = av * efPre;
    const alePre = slePre * aroPre;

    const slePost = av * efPost;
    const alePost = slePost * aroPost;

    const cba = alePre - alePost - cost;
    const isJustified = cba > 0;

    const resVal = document.getElementById('risk-result-val');
    const steps = document.getElementById('risk-math-steps');

    if (resVal) {
        resVal.innerHTML = `
            <span style="color:${isJustified ? '#16a34a' : '#dc2626'}">
                ${cba >= 0 ? '+' : ''}$${cba.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / yr
            </span>
            <span style="font-size:0.85rem; padding:0.2rem 0.5rem; border-radius:4px; margin-left:0.5rem; background:${isJustified ? 'var(--correct-bg-color)' : 'var(--incorrect-bg-color)'}; color:${isJustified ? 'var(--correct-color)' : 'var(--incorrect-color)'};">
                ${isJustified ? '✅ Cost-Justified' : '❌ Not Justified'}
            </span>
        `;
    }

    if (steps) {
        steps.innerHTML = `
            <strong>Financial Risk Analysis:</strong><br>
            • <strong>Pre-Control Loss:</strong> SLE = $${slePre.toLocaleString()} | <strong>ALE (Prior)</strong> = $${alePre.toLocaleString()} / yr<br>
            • <strong>Post-Control Loss:</strong> SLE = $${slePost.toLocaleString()} | <strong>ALE (Post)</strong> = $${alePost.toLocaleString()} / yr<br>
            • <strong>Annual Risk Reduction:</strong> $${(alePre - alePost).toLocaleString()} / yr<br>
            • <strong>CBA Formula:</strong> ALE(prior) - ALE(post) - Cost = $${alePre.toLocaleString()} - $${alePost.toLocaleString()} - $${cost.toLocaleString()} = <strong>$${cba.toLocaleString()}</strong>
        `;
    }

    if (window.soundEffects) window.soundEffects.playClick();
};

window.calculateZScore = function() {
    const mean = parseFloat(document.getElementById('z-mean').value) || 0;
    const sd = parseFloat(document.getElementById('z-sd').value) || 1;
    const x = parseFloat(document.getElementById('z-x').value) || 0;

    if (sd <= 0) return;

    const z = (x - mean) / sd;

    const erf = (val) => {
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const sign = val < 0 ? -1 : 1;
        const absX = Math.abs(val);
        const t = 1.0 / (1.0 + p * absX);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
        return sign * y;
    };

    const cdf = 0.5 * (1 + erf(z / Math.SQRT2));
    const percentile = (cdf * 100).toFixed(2);

    const resVal = document.getElementById('z-result-val');
    const steps = document.getElementById('z-math-steps');

    if (resVal) {
        resVal.innerHTML = `Z = <strong>${z.toFixed(3)}</strong> <span style="font-size:0.88rem; color:var(--text-muted-color); font-weight:normal;">(${percentile}th Percentile)</span>`;
    }

    if (steps) {
        let ruleCategory = "Within normal range";
        if (Math.abs(z) > 3) ruleCategory = "Outlier (> 3σ outside 99.7% bound)";
        else if (Math.abs(z) > 2) ruleCategory = "Moderate deviation (> 2σ outside 95% bound)";
        else if (Math.abs(z) > 1) ruleCategory = "Slight deviation (> 1σ outside 68% bound)";
        else ruleCategory = "Within central 68% of population (±1σ)";

        steps.innerHTML = `
            <strong>Normal Distribution Properties:</strong><br>
            • <strong>Z-Score Formula:</strong> Z = (x - μ) / σ = (${x} - ${mean}) / ${sd} = <strong>${z.toFixed(4)}</strong><br>
            • <strong>Area Under Curve P(X ≤ ${x}):</strong> ${(cdf * 100).toFixed(2)}% of values fall below this point.<br>
            • <strong>Empirical Rule 68-95-99.7% Classification:</strong> <em>${ruleCategory}</em>
        `;
    }

    if (window.soundEffects) window.soundEffects.playClick();
};

// ==========================================
// Print & Direct PDF Export Engine
// ==========================================
window.printQuickReference = function() {
    window.openPrintExportModal();
};

window.openPrintExportModal = function() {
    let modal = document.getElementById('export-pdf-modal-overlay');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'export-pdf-modal-overlay';
        modal.className = 'custom-confirm-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="custom-confirm-modal" style="max-width: 460px; text-align: left; padding: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1rem;">
                    <span style="font-size: 2.2rem; line-height: 1;">📑</span>
                    <div>
                        <h3 style="margin: 0; font-size: 1.2rem; font-family: 'Outfit', sans-serif;">Export Quick Reference</h3>
                        <p style="margin: 0.2rem 0 0 0; font-size: 0.84rem; color: var(--text-muted-color);">Generate a clean academic reference guide document</p>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.85rem; margin: 1.25rem 0;">
                    <button class="btn btn-primary" onclick="window.downloadQuickReferencePDF()" style="display: flex; align-items: center; justify-content: flex-start; gap: 0.85rem; padding: 0.9rem 1.1rem; font-size: 0.95rem; text-align: left; width: 100%; border-radius: var(--border-radius-sm); cursor: pointer;">
                        <span style="font-size: 1.5rem; line-height: 1;">📥</span>
                        <div>
                            <div style="font-weight: 700;">Download Clean PDF (.pdf)</div>
                            <div style="font-size: 0.78rem; opacity: 0.9; margin-top: 0.15rem;">Generates a razor-sharp, formatted PDF reference guide</div>
                        </div>
                    </button>
                    
                    <button class="btn btn-secondary" onclick="window.triggerBrowserPrint()" style="display: flex; align-items: center; justify-content: flex-start; gap: 0.85rem; padding: 0.9rem 1.1rem; font-size: 0.95rem; text-align: left; width: 100%; border-radius: var(--border-radius-sm); cursor: pointer;">
                        <span style="font-size: 1.5rem; line-height: 1;">🖨️</span>
                        <div>
                            <div style="font-weight: 700;">Browser Print / Save Dialog</div>
                            <div style="font-size: 0.78rem; color: var(--text-muted-color); margin-top: 0.15rem;">Opens system print window ('Save as PDF' or printer)</div>
                        </div>
                    </button>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
                    <button class="btn btn-secondary" onclick="document.getElementById('export-pdf-modal-overlay').classList.remove('active')" style="padding: 0.45rem 1rem; font-size: 0.85rem; cursor: pointer;">Cancel</button>
                </div>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
        document.body.appendChild(modal);
    }
    modal.classList.add('active');
};

window.downloadQuickReferencePDF = function() {
    const modal = document.getElementById('export-pdf-modal-overlay');
    if (modal) modal.classList.remove('active');

    // Switch to Quick Reference tab
    const validTabs = ['quick-ref', 'formulas', 'summary'];
    const targetTabId = validTabs.find(t => document.getElementById(t));
    if (targetTabId && window.switchTab) {
        window.switchTab(targetTabId);
    }

    const targetElement = targetTabId ? document.getElementById(targetTabId) : null;
    if (!targetElement) {
        window.triggerBrowserPrint();
        return;
    }

    // Subject name for title & filename
    const pathParts = window.location.pathname.split('/');
    const fileKey = pathParts[pathParts.length - 1].replace('.html', '');
    const subjectName = (window.getSubjectDisplayName ? window.getSubjectDisplayName(fileKey) : fileKey).replace(/[^a-zA-Z0-9]/g, ' ');
    const filename = `${subjectName.trim().replace(/\s+/g, '_')}_QuickReference.pdf`;

    const printBtn = document.querySelector('.btn-print-ref');
    const originalText = printBtn ? printBtn.innerHTML : null;
    if (printBtn) {
        printBtn.innerHTML = '⏳ Formatting PDF...';
    }

    const runHtml2Pdf = () => {
        const opt = {
            margin: [10, 10, 10, 10],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        // Create a dedicated clean white container for PDF generation
        const printWrapper = document.createElement('div');
        printWrapper.style.backgroundColor = '#ffffff';
        printWrapper.style.color = '#0f172a';
        printWrapper.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        printWrapper.style.padding = '12px';
        printWrapper.style.width = '780px';
        printWrapper.style.maxWidth = '100%';
        printWrapper.style.boxSizing = 'border-box';

        // Add Header Banner
        const banner = document.createElement('div');
        banner.style.borderBottom = '2px solid #0d9488';
        banner.style.paddingBottom = '8px';
        banner.style.marginBottom = '16px';
        banner.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h1 style="margin:0; font-size:18px; color:#0f172a; font-weight:800;">${subjectName}</h1>
                    <p style="margin:4px 0 0 0; font-size:12px; color:#64748b;">Comprehensive Academic Quick Reference & Master Formula Guide</p>
                </div>
                <div style="text-align:right; font-size:10px; color:#94a3b8;">
                    Computer Engineering Reviewer
                </div>
            </div>
        `;
        printWrapper.appendChild(banner);

        // Clone and sanitize content
        const clone = targetElement.cloneNode(true);
        clone.querySelectorAll('.btn-print-ref, .calc-card, .calc-grid, .calc-field, input, button, select, textarea').forEach(el => el.remove());

        // Apply clean styles across all elements inside the clone
        clone.querySelectorAll('.card').forEach(c => {
            c.style.backgroundColor = '#ffffff';
            c.style.color = '#0f172a';
            c.style.border = '1px solid #cbd5e1';
            c.style.borderRadius = '6px';
            c.style.boxShadow = 'none';
            c.style.padding = '14px';
            c.style.marginBottom = '14px';
        });

        clone.querySelectorAll('table').forEach(t => {
            t.style.width = '100%';
            t.style.borderCollapse = 'collapse';
            t.style.margin = '10px 0';
            t.style.backgroundColor = '#ffffff';
            t.style.color = '#0f172a';
        });

        clone.querySelectorAll('th, td').forEach(td => {
            td.style.border = '1px solid #cbd5e1';
            td.style.padding = '6px 8px';
            td.style.fontSize = '12px';
            td.style.color = '#0f172a';
        });

        clone.querySelectorAll('th, thead tr').forEach(th => {
            th.style.backgroundColor = '#f1f5f9';
            th.style.color = '#0f172a';
            th.style.fontWeight = 'bold';
        });

        clone.querySelectorAll('.formula-card, .slide-formula-sheet-container').forEach(fc => {
            fc.style.backgroundColor = '#f8fafc';
            fc.style.border = '1.5px solid #0d9488';
            fc.style.borderRadius = '6px';
            fc.style.padding = '10px';
            fc.style.margin = '10px 0';
            fc.style.color = '#0f172a';
            fc.style.boxShadow = 'none';
        });

        clone.querySelectorAll('.formula-text').forEach(ft => {
            ft.style.color = '#0f766e';
            ft.style.fontWeight = 'bold';
            ft.style.fontSize = '13px';
        });

        clone.querySelectorAll('.formula-explain').forEach(fe => {
            fe.style.color = '#334155';
            fe.style.fontSize = '11px';
        });

        clone.querySelectorAll('h2').forEach(h => {
            h.style.color = '#0f172a';
            h.style.fontSize = '15px';
            h.style.borderBottom = '1.5px solid #0d9488';
            h.style.paddingBottom = '4px';
            h.style.marginTop = '12px';
            h.style.marginBottom = '8px';
        });

        clone.querySelectorAll('h3').forEach(h => {
            h.style.color = '#0f172a';
            h.style.fontSize = '13px';
            h.style.marginTop = '10px';
            h.style.marginBottom = '4px';
        });

        printWrapper.appendChild(clone);

        html2pdf().set(opt).from(printWrapper).save().then(() => {
            if (printBtn && originalText) {
                printBtn.innerHTML = originalText;
            }
        }).catch(err => {
            console.error("html2pdf generation error:", err);
            if (printBtn && originalText) {
                printBtn.innerHTML = originalText;
            }
            window.triggerBrowserPrint();
        });
    };

    if (typeof html2pdf === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => runHtml2Pdf();
        script.onerror = () => {
            if (printBtn && originalText) {
                printBtn.innerHTML = originalText;
            }
            window.triggerBrowserPrint();
        };
        document.head.appendChild(script);
    } else {
        runHtml2Pdf();
    }
};

window.triggerBrowserPrint = function() {
    const modal = document.getElementById('export-pdf-modal-overlay');
    if (modal) modal.classList.remove('active');
    
    const validTabs = ['quick-ref', 'formulas', 'summary'];
    const targetTab = validTabs.find(t => document.getElementById(t));
    if (targetTab && window.switchTab) {
        window.switchTab(targetTab);
    }
    setTimeout(() => {
        window.print();
    }, 150);
};


// Global PWA Install Prompt Listener
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.style.display = 'inline-flex';
    }
});

window.installPWA = function() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted PWA installation');
            }
            deferredPrompt = null;
            const installBtn = document.getElementById('pwa-install-btn');
            if (installBtn) installBtn.style.display = 'none';
        });
    }
};

// Instantiate Sound & Mistake Managers on DOM ready
document.addEventListener('DOMContentLoaded', () => {
        if (window.SupabaseSync) window.SupabaseSync.updateNavUI();
    window.soundEffects = new SoundEffectsManager();
    window.mistakeVault = new MistakeVaultManager();
});

// ============================================================================
// SUPABASE CLIENT & STUDENT CLOUD SYNC ENGINE
// ============================================================================

window.SupabaseSync = {
    isConfigured() {
        if (window.SupabaseService) {
            const cfg = window.SupabaseService.getConfig();
            return Boolean(cfg && cfg.url && cfg.key);
        }
        return true;
    },

    getCurrentStudent() {
        if (window.SessionManager) {
            return window.SessionManager.verifyActiveSession();
        }
        try {
            const raw = safeGetStorage('student_active_session');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    setCurrentStudent(session) {
        if (window.SessionManager) {
            window.SessionManager.setSession(session);
        } else {
            safeSetStorage('student_active_session', session ? JSON.stringify(session) : '');
        }
        this.updateNavUI();
    },

    async register(username, password, question, answer) {
        if (!window.SupabaseService) return { success: false, error: "Supabase client not initialized." };
        const res = await window.SupabaseService.registerStudent(username, password, question, answer);
        if (res && res.success) {
            this.updateNavUI();
            await this.pushAllLocalProgressToCloud();
        }
        return res;
    },

    async login(username, password) {
        if (!window.SupabaseService) return { success: false, error: "Supabase client not initialized." };
        const res = await window.SupabaseService.loginStudent(username, password);
        if (res && res.success) {
            this.updateNavUI();
            await this.pullAllCloudProgressToLocal();
            await this.pullAllCloudMistakes();
        }
        return res;
    },

    async getSecurityQuestion(username) {
        if (!window.SupabaseService) return { success: false, error: "Supabase client not initialized." };
        return await window.SupabaseService.getSecurityQuestion(username);
    },

    async verifyAnswerAndIssueTemp(username, answer) {
        if (!window.SupabaseService) return { success: false, error: "Supabase client not initialized." };
        return await window.SupabaseService.verifySecurityAnswer(username, answer);
    },

    async changePassword(newPassword) {
        const user = this.getCurrentStudent();
        if (!user) return { success: false, error: "Not logged in." };
        if (!window.SupabaseService) return { success: false, error: "Supabase client not initialized." };

        return await window.SupabaseService.changePassword(user.student_id, user.session_token, newPassword);
    },

    async syncLessonProgress(topicKey, progressData) {
        const user = this.getCurrentStudent();
        if (!user || !window.SupabaseService) return;

        try {
            await window.SupabaseService.syncProgress(user.student_id, user.session_token, {
                topicKey: topicKey,
                answered: progressData.answered || 0,
                correct: progressData.correct || 0,
                total: progressData.total || 0,
                userAnswers: progressData.userAnswers || [],
                orderMode: progressData.orderMode || 'shuffled',
                lastCardIndex: progressData.lastCardIndex || 0
            });
        } catch (e) {
            console.warn("[SupabaseSync] Background progress sync warning:", e);
        }
    },

    async pullAllCloudProgressToLocal() {
        const user = this.getCurrentStudent();
        if (!user || !window.SupabaseService) return;

        try {
            const res = await window.SupabaseService.getAllProgress(user.student_id, user.session_token);
            if (res && res.success && Array.isArray(res.progress)) {
                res.progress.forEach(p => {
                    const topicKey = p.topic_key;
                    const localProgressRaw = safeGetStorage(`quiz_progress_${topicKey}`);
                    const localProg = localProgressRaw ? JSON.parse(localProgressRaw) : null;

                    if (!localProg || p.answered_count >= (localProg.answered || 0)) {
                        safeSetStorage(`quiz_progress_${topicKey}`, JSON.stringify({
                            answered: p.answered_count,
                            correct: p.correct_count,
                            total: p.total_questions,
                            percentage: p.total_questions > 0 ? Math.round((p.correct_count / p.total_questions) * 100) : 0,
                            completed: p.completed,
                            timestamp: new Date(p.updated_at).getTime()
                        }));

                        // Restore and persist highscore
                        if (p.correct_count > 0) {
                            const existingHigh = parseInt(safeGetStorage(`quiz_highscore_${topicKey}`) || '0', 10);
                            if (p.correct_count > existingHigh) {
                                safeSetStorage(`quiz_highscore_${topicKey}`, p.correct_count.toString());
                            }
                        }

                        if (p.user_answers && p.user_answers.length > 0) {
                            const sessionState = {
                                userAnswers: p.user_answers,
                                answeredCount: p.answered_count,
                                correctCount: p.correct_count,
                                lastCardIndex: p.last_card_index || 0,
                                orderMode: p.order_mode || 'shuffled',
                                timestamp: new Date(p.updated_at).getTime()
                            };
                            safeSetStorage(`quiz_session_state_${topicKey}`, JSON.stringify(sessionState));
                        }
                    }
                });
            }
        } catch (e) {
            console.error("[SupabaseSync] Error pulling progress:", e);
        }
    },

    async pushAllLocalProgressToCloud() {
        const user = this.getCurrentStudent();
        if (!user || !window.SupabaseService) return;

        // 1. Push all quiz module progress
        if (window.SUBJECT_LESSON_MAP) {
            for (const key of Object.keys(window.SUBJECT_LESSON_MAP)) {
                const localProgRaw = safeGetStorage(`quiz_progress_${key}`);
                const localSessionRaw = safeGetStorage(`quiz_session_state_${key}`);
                if (localProgRaw) {
                    try {
                        const prog = JSON.parse(localProgRaw);
                        const sess = localSessionRaw ? JSON.parse(localSessionRaw) : {};
                        await this.syncLessonProgress(key, {
                            answered: prog.answered || 0,
                            correct: prog.correct || 0,
                            total: prog.total || 0,
                            userAnswers: sess.userAnswers || [],
                            orderMode: sess.orderMode || 'shuffled',
                            lastCardIndex: sess.lastCardIndex || 0
                        });
                    } catch (e) {}
                }
            }
        }

        // 2. Push all local mistakes from mistake_vault_records
        try {
            const rawMistakes = safeGetStorage('mistake_vault_records');
            if (rawMistakes) {
                const mistakesList = JSON.parse(rawMistakes);
                if (Array.isArray(mistakesList)) {
                    for (const m of mistakesList) {
                        await this.syncMistake(
                            m.topicKey,
                            m.topicName || m.topicKey,
                            m.question,
                            m.userSelection || '',
                            m.correctAnswer || '',
                            m.explanation || ''
                        );
                    }
                }
            }
        } catch (e) {
            console.warn("[SupabaseSync] Error pushing mistakes:", e);
        }
    },

    async syncMistake(topicKey, topicName, questionText, userSelection, correctAnswer, explanation) {
        const user = this.getCurrentStudent();
        if (!user || !window.SupabaseService) return;

        try {
            await window.SupabaseService.syncMistake(user.student_id, user.session_token, {
                topicKey: topicKey,
                topicName: topicName || topicKey,
                questionText: questionText,
                userSelection: userSelection || '',
                correctAnswer: correctAnswer || '',
                explanation: explanation || ''
            });
        } catch (e) {
            console.warn("[SupabaseSync] Mistake sync warning:", e);
        }
    },

    async pullAllCloudMistakes() {
        const user = this.getCurrentStudent();
        if (!user || !window.SupabaseService) return;

        try {
            const res = await window.SupabaseService.getMistakes(user.student_id, user.session_token);
            if (res && res.success && Array.isArray(res.mistakes)) {
                let localMistakes = [];
                try {
                    const raw = safeGetStorage('mistake_vault_records');
                    if (raw) localMistakes = JSON.parse(raw);
                } catch (e) {}

                res.mistakes.forEach(m => {
                    const exists = localMistakes.some(lm => lm.topicKey === m.topic_key && lm.question === m.question_text);
                    if (!exists) {
                        localMistakes.push({
                            id: m.id,
                            topicKey: m.topic_key,
                            topicName: m.topic_name,
                            question: m.question_text,
                            userSelection: m.user_selection,
                            correctAnswer: m.correct_answer,
                            explanation: m.explanation,
                            timestamp: new Date(m.created_at).getTime()
                        });
                    }
                });
                safeSetStorage('mistake_vault_records', JSON.stringify(localMistakes));
                window.dispatchEvent(new Event('mistakeVaultUpdated'));
                if (window.mistakeVault && typeof window.mistakeVault.updateBadgeCount === 'function') {
                    window.mistakeVault.updateBadgeCount();
                }
            }
        } catch (e) {
            console.error("[SupabaseSync] Error pulling mistakes:", e);
        }
    },

    async deleteProgress(topicKey = null) {
        const user = this.getCurrentStudent();
        if (!user || !window.SupabaseService) return { success: false, error: "Not logged in." };

        const res = await window.SupabaseService.deleteProgress(user.student_id, user.session_token, topicKey || 'ALL');
        if (res && res.success) {
            if (topicKey && topicKey !== 'ALL') {
                safeSetStorage(`quiz_progress_${topicKey}`, '');
                safeSetStorage(`quiz_session_state_${topicKey}`, '');
            } else {
                if (window.SUBJECT_LESSON_MAP) {
                    for (const key of Object.keys(window.SUBJECT_LESSON_MAP)) {
                        safeSetStorage(`quiz_progress_${key}`, '');
                        safeSetStorage(`quiz_session_state_${key}`, '');
                    }
                }
            }
        }
        return res;
    },

    async deleteAccountPermanently() {
        const user = this.getCurrentStudent();
        if (!user || !window.SupabaseService) return { success: false, error: "Not logged in." };

        const res = await window.SupabaseService.deleteAccount(user.student_id, user.session_token);
        if (res && res.success) {
            this.logout();
            if (window.SUBJECT_LESSON_MAP) {
                for (const key of Object.keys(window.SUBJECT_LESSON_MAP)) {
                    safeSetStorage(`quiz_progress_${key}`, '');
                    safeSetStorage(`quiz_session_state_${key}`, '');
                }
            }
        }
        return res;
    },

    logout(isExpired = false) {
        if (window.SessionManager) {
            window.SessionManager.clearSession(isExpired);
        } else {
            safeSetStorage('student_active_session', '');
            if (isExpired && typeof window.showToast === 'function') {
                window.showToast("Your session has expired. Please sign in again.", "warning");
            }
        }
        this.updateNavUI();
        if (!isExpired && typeof window.showToast === 'function') {
            window.showToast("Signed out. Local progress saved offline.", "info");
        }
    },

    updateNavUI() {
        const user = this.getCurrentStudent();
        const navBtns = document.querySelectorAll('.auth-nav-pill');
        navBtns.forEach(btn => {
            if (user) {
                btn.innerHTML = `🎓 <strong>${user.username}</strong> <span style="font-size:0.75rem; color:#10b981;">(☁️ Synced)</span>`;
                btn.classList.add('logged-in');
            } else {
                btn.innerHTML = `👤 <strong>Sign In / Create Account</strong>`;
                btn.classList.remove('logged-in');
            }
        });

        if (typeof window.updateHeroAuthBanner === 'function') {
            window.updateHeroAuthBanner();
        }
        window.dispatchEvent(new CustomEvent('authUpdated', { detail: { user } }));
    }
};

// Connect Mistake Vault to Supabase Sync
if (window.mistakeVault) {
    const originalRecord = window.mistakeVault.recordMistake.bind(window.mistakeVault);
    window.mistakeVault.recordMistake = function(topicKey, topicName, q, selectedIdx) {
        originalRecord(topicKey, topicName, q, selectedIdx);
        if (window.SupabaseSync && window.SupabaseSync.getCurrentStudent()) {
            const userChoice = q.options ? q.options[selectedIdx] : '';
            const correctChoice = q.options ? q.options[q.correct] : '';
            window.SupabaseSync.syncMistake(topicKey, topicName, q.q, userChoice, correctChoice, q.exp);
        }
    };
}

// ============================================================================
// PASSWORD EYE VISIBILITY TOGGLE HELPER
// ============================================================================
window.attachPasswordToggle = function(inputEl) {
    if (!inputEl || inputEl.dataset.hasEyeToggle) return;
    inputEl.dataset.hasEyeToggle = 'true';

    const parent = inputEl.parentElement;
    const wrapper = document.createElement('div');
    wrapper.className = 'password-input-wrapper';

    parent.insertBefore(wrapper, inputEl);
    wrapper.appendChild(inputEl);

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'password-toggle-btn';
    toggleBtn.innerHTML = '👁️';
    toggleBtn.title = 'Show/Hide Password';
    toggleBtn.setAttribute('aria-label', 'Toggle password visibility');

    toggleBtn.onclick = (e) => {
        e.preventDefault();
        if (inputEl.type === 'password') {
            inputEl.type = 'text';
            toggleBtn.innerHTML = '🙈';
        } else {
            inputEl.type = 'password';
            toggleBtn.innerHTML = '👁️';
        }
    };

    wrapper.appendChild(toggleBtn);
};

// ============================================================================
// STUDENT AUTH & PROFILE MODAL UI
// ============================================================================
window.openAuthModal = function(tab = 'signin') {
    let overlay = document.getElementById('student-auth-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'student-auth-overlay';
        overlay.className = 'auth-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.innerHTML = `
            <div class="auth-modal-box">
                <div class="auth-modal-header">
                    <div>
                        <h3 class="auth-modal-title" id="auth-modal-title">🔐 Student Portal</h3>
                        <p class="auth-modal-subtitle" id="auth-modal-subtitle">Sign in or create an account to sync progress across devices.</p>
                    </div>
                    <button class="auth-modal-close" onclick="window.closeAuthModal()" aria-label="Close Modal">✕</button>
                </div>

                <div id="auth-tabs" class="auth-tabs-row" role="tablist">
                    <button class="auth-tab-btn active" id="tab-btn-signin" role="tab" aria-selected="true" onclick="window.switchAuthTab('signin')">
                        <span>Sign In</span>
                    </button>
                    <button class="auth-tab-btn" id="tab-btn-register" role="tab" aria-selected="false" onclick="window.switchAuthTab('register')">
                        <span class="tab-label-full">Create Account</span>
                        <span class="tab-label-compact">Register</span>
                    </button>
                    <button class="auth-tab-btn" id="tab-btn-forgot" role="tab" aria-selected="false" onclick="window.switchAuthTab('forgot')">
                        <span class="tab-label-full">Forgot Password</span>
                        <span class="tab-label-compact">Recovery</span>
                    </button>
                </div>

                <div id="auth-alert" class="auth-alert-box"></div>

                <!-- SIGN IN PANEL -->
                <div id="panel-signin">
                    <div class="auth-form-group">
                        <label class="auth-form-label" for="signin-username">Username</label>
                        <input type="text" id="signin-username" class="auth-form-input" placeholder="e.g. Izii" autocomplete="username" spellcheck="false">
                    </div>
                    <div class="auth-form-group">
                        <label class="auth-form-label" for="signin-password">Password</label>
                        <input type="password" id="signin-password" class="auth-form-input" placeholder="Enter password" autocomplete="current-password">
                    </div>
                    <div style="display:flex; justify-content:flex-end; margin-bottom:1.25rem;">
                        <a href="javascript:void(0)" onclick="window.switchAuthTab('forgot')" style="font-size:0.83rem; color:var(--primary-color); font-weight:600; text-decoration:none;">Forgot password?</a>
                    </div>
                    <button class="btn btn-primary btn-auth-submit" onclick="window.handleSignIn()">Sign In &amp; Sync Progress</button>
                </div>

                <!-- REGISTER PANEL -->
                <div id="panel-register" style="display:none;">
                    <div class="auth-form-group">
                        <label class="auth-form-label" for="reg-username">Choose a Username</label>
                        <input type="text" id="reg-username" class="auth-form-input" placeholder="e.g. Izii" autocomplete="username" spellcheck="false">
                    </div>
                    <div class="auth-form-group">
                        <label class="auth-form-label" for="reg-password">Password</label>
                        <input type="password" id="reg-password" class="auth-form-input" placeholder="Create password" autocomplete="new-password">
                    </div>
                    <div class="auth-form-group">
                        <label class="auth-form-label" for="reg-question-trigger">Secret Security Question</label>
                        <div class="custom-select-container" id="reg-question-dropdown">
                            <button type="button" class="custom-select-trigger" id="reg-question-trigger" aria-haspopup="listbox" aria-expanded="false" onclick="window.toggleCustomSelect('reg-question-dropdown')">
                                <span class="custom-select-selected-text" id="reg-question-selected-text">Name of your first elementary school?</span>
                                <svg class="custom-select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </button>
                            <div class="custom-select-menu" id="reg-question-menu" role="listbox" style="display: none;">
                                <button type="button" class="custom-select-option selected" data-value="Name of your first elementary school?" onclick="window.selectCustomOption('reg-question-dropdown', 'Name of your first elementary school?')">
                                    <span class="option-text">Name of your first elementary school?</span>
                                    <span class="option-check">✓</span>
                                </button>
                                <button type="button" class="custom-select-option" data-value="Favorite childhood book or movie?" onclick="window.selectCustomOption('reg-question-dropdown', 'Favorite childhood book or movie?')">
                                    <span class="option-text">Favorite childhood book or movie?</span>
                                    <span class="option-check">✓</span>
                                </button>
                                <button type="button" class="custom-select-option" data-value="City where you were born?" onclick="window.selectCustomOption('reg-question-dropdown', 'City where you were born?')">
                                    <span class="option-text">City where you were born?</span>
                                    <span class="option-check">✓</span>
                                </button>
                                <button type="button" class="custom-select-option" data-value="What was your childhood nickname?" onclick="window.selectCustomOption('reg-question-dropdown', 'What was your childhood nickname?')">
                                    <span class="option-text">What was your childhood nickname?</span>
                                    <span class="option-check">✓</span>
                                </button>
                                <button type="button" class="custom-select-option" data-value="__custom__" onclick="window.selectCustomOption('reg-question-dropdown', '__custom__')">
                                    <span class="option-text">✍️ Write custom secret question...</span>
                                    <span class="option-check">✓</span>
                                </button>
                            </div>
                            <input type="hidden" id="reg-question-select" value="Name of your first elementary school?">
                        </div>
                        <input type="text" id="reg-question-custom" class="auth-form-input" placeholder="Type your custom question..." style="display:none; margin-top:0.5rem;" spellcheck="false">
                    </div>
                    <div class="auth-form-group">
                        <label class="auth-form-label" for="reg-answer">Security Answer</label>
                        <input type="password" id="reg-answer" class="auth-form-input" placeholder="Your secret answer" autocomplete="off">
                    </div>
                    <button class="btn btn-primary btn-auth-submit" onclick="window.handleRegister()">Create Account &amp; Sync</button>
                </div>

                <!-- FORGOT PASSWORD PANEL -->
                <div id="panel-forgot" style="display:none;">
                    <div id="forgot-step-1">
                        <p style="font-size:0.85rem; color:var(--text-muted-color); margin-top:0; margin-bottom:1rem;">Enter your registered username to retrieve your security question.</p>
                        <div class="auth-form-group">
                            <label class="auth-form-label" for="forgot-username">Username</label>
                            <input type="text" id="forgot-username" class="auth-form-input" placeholder="Your registered username" autocomplete="username" spellcheck="false">
                        </div>
                        <button class="btn btn-primary btn-auth-submit" onclick="window.handleFetchQuestion()">Find Account</button>
                    </div>

                    <div id="forgot-step-2" style="display:none;">
                        <div style="background:rgba(13,148,136,0.08); border-left:3px solid var(--primary-color); padding:0.85rem 1rem; border-radius:6px; margin-bottom:1.1rem;">
                            <span style="font-size:0.75rem; font-weight:700; color:var(--primary-color); text-transform:uppercase; letter-spacing:0.04em;">Your Security Question:</span>
                            <div id="forgot-question-display" style="font-weight:600; font-size:0.95rem; margin-top:0.25rem; color:var(--text-dark-color);"></div>
                        </div>
                        <div class="auth-form-group">
                            <label class="auth-form-label" for="forgot-answer">Your Security Answer</label>
                            <input type="password" id="forgot-answer" class="auth-form-input" placeholder="Type your answer" autocomplete="off">
                        </div>
                        <button class="btn btn-primary btn-auth-submit" onclick="window.handleVerifyAnswer()">Verify &amp; Issue Temporary Password</button>
                    </div>

                    <div id="forgot-step-3" style="display:none;">
                        <div class="auth-temp-pass-display">
                            <div style="font-size:0.85rem; font-weight:700; color:#d97706;">⚠️ Temporary Password (Valid for 15 Minutes Only):</div>
                            <div class="auth-temp-pass-code" id="forgot-temp-pass-val">TEMP-XXXXXX</div>
                            <p style="font-size:0.82rem; color:var(--text-muted-color); margin:0.4rem 0;">Copy this temporary password and log in. You will be required to set your new permanent password upon login.</p>
                        </div>
                        <button class="btn btn-primary btn-auth-submit" onclick="window.handleUseTempPassword()">Log In with Temporary Password</button>
                    </div>
                </div>

                <!-- PROFILE & DATA MANAGEMENT PANEL -->
                <div id="panel-profile" style="display:none;">
                    <div style="display:flex; align-items:center; gap:0.85rem; margin-bottom:1.25rem; padding:0.85rem 1rem; background:rgba(16,185,129,0.1); border-radius:10px; border:1px solid rgba(16,185,129,0.25);">
                        <div style="font-size:2rem;">🎓</div>
                        <div>
                            <div style="font-weight:800; font-size:1.1rem; color:var(--text-dark-color);" id="profile-username">Student</div>
                            <div style="font-size:0.8rem; color:#10b981; font-weight:700;">🟢 Cloud Sync Active (Multi-Device)</div>
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1.5rem;">
                        <button class="btn btn-secondary" onclick="window.handleForceCloudPull()" style="justify-content:center; font-size:0.88rem; padding:0.6rem 1rem;">🔄 Pull Latest Cloud Progress</button>
                        <button class="btn btn-secondary" onclick="window.handleForceCloudPush()" style="justify-content:center; font-size:0.88rem; padding:0.6rem 1rem;">☁️ Push Local Progress to Cloud</button>
                        <button class="btn btn-secondary" onclick="window.switchAuthTab('changepass')" style="justify-content:center; font-size:0.88rem; padding:0.6rem 1rem;">🔑 Change Password</button>
                    </div>

                    <div class="auth-danger-zone">
                        <div style="font-size:0.85rem; font-weight:700; color:#dc2626; margin-bottom:0.6rem;">⚠️ Data Privacy &amp; Reset Controls</div>
                        <div style="display:flex; flex-direction:column; gap:0.5rem;">
                            <button class="btn" style="background:rgba(239,68,68,0.1); color:#dc2626; border:1px solid rgba(239,68,68,0.3); font-size:0.85rem; justify-content:center;" onclick="window.handleDeleteStudentProgress()">🗑️ Reset / Wipe Cloud Quiz Progress</button>
                            <button class="btn" style="background:#dc2626; color:white; font-size:0.85rem; justify-content:center;" onclick="window.handleDeleteStudentAccount()">Permanently Delete Student Account</button>
                        </div>
                    </div>

                    <div style="margin-top:1.5rem; text-align:center;">
                        <button class="btn btn-secondary" onclick="window.handleSignOut()" style="width:100%; justify-content:center; font-weight:600;">🚪 Sign Out</button>
                    </div>
                </div>

                <!-- CHANGE PASSWORD PANEL -->
                <div id="panel-changepass" style="display:none;">
                    <div id="changepass-alert-banner" style="display:none; background:rgba(245,158,11,0.12); border:1px solid #f59e0b; padding:0.75rem; border-radius:6px; font-size:0.85rem; margin-bottom:1.1rem; color:#b45309; font-weight:600;">
                        ⚠️ Temporary password active. Please set your new permanent password to continue.
                    </div>
                    <p style="font-size:0.85rem; color:var(--text-muted-color); margin-top:0;" id="changepass-desc">Set your new permanent password below.</p>
                    <div class="auth-form-group">
                        <label class="auth-form-label" for="cp-newpass">New Password</label>
                        <input type="password" id="cp-newpass" class="auth-form-input" placeholder="Enter new password" autocomplete="new-password">
                    </div>
                    <div class="auth-form-group">
                        <label class="auth-form-label" for="cp-confpass">Confirm New Password</label>
                        <input type="password" id="cp-confpass" class="auth-form-input" placeholder="Re-type new password" autocomplete="new-password">
                    </div>
                    <button class="btn btn-primary btn-auth-submit" onclick="window.handleChangePasswordSubmit()">Save New Password</button>
                </div>

            </div>
        `;

        // Backdrop click to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                window.closeAuthModal();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                window.closeAuthModal();
            }
        });

        // Enter key to submit active form
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const activePanel = document.querySelector('.auth-modal-box div[id^="panel-"][style*="block"], .auth-modal-box div[id^="panel-"]:not([style*="none"])');
                if (activePanel) {
                    if (activePanel.id === 'panel-signin') window.handleSignIn();
                    else if (activePanel.id === 'panel-register') window.handleRegister();
                    else if (activePanel.id === 'panel-changepass') window.handleChangePasswordSubmit();
                    else if (activePanel.id === 'panel-forgot') {
                        const s1 = document.getElementById('forgot-step-1');
                        const s2 = document.getElementById('forgot-step-2');
                        if (s2 && s2.style.display !== 'none') window.handleVerifyAnswer();
                        else if (s1 && s1.style.display !== 'none') window.handleFetchQuestion();
                    }
                }
            }
        });

        document.body.appendChild(overlay);

        ['signin-password', 'reg-password', 'reg-answer', 'forgot-answer', 'cp-newpass', 'cp-confpass'].forEach(id => {
            const el = document.getElementById(id);
            if (el) window.attachPasswordToggle(el);
        });
    }

    const currentStudent = window.SupabaseSync.getCurrentStudent();
    if (currentStudent && currentStudent.requires_password_change) {
        window.switchAuthTab('changepass');
        const banner = document.getElementById('changepass-alert-banner');
        if (banner) banner.style.display = 'block';
    } else if (currentStudent && tab !== 'changepass') {
        window.switchAuthTab('profile');
    } else {
        window.switchAuthTab(tab);
    }

    overlay.classList.add('active');
};

window.closeAuthModal = function() {
    const user = window.SupabaseSync.getCurrentStudent();
    if (user && user.requires_password_change) {
        window.showToast("You must set a new permanent password before continuing.", "warning");
        return;
    }
    const overlay = document.getElementById('student-auth-overlay');
    if (overlay) overlay.classList.remove('active');
};

window.switchAuthTab = function(tabName) {
    const panels = ['signin', 'register', 'forgot', 'profile', 'changepass'];
    panels.forEach(p => {
        const el = document.getElementById(`panel-${p}`);
        if (el) el.style.display = (p === tabName) ? 'block' : 'none';
        const btn = document.getElementById(`tab-btn-${p}`);
        if (btn) btn.classList.toggle('active', p === tabName);
    });

    const alertBox = document.getElementById('auth-alert');
    if (alertBox) {
        alertBox.style.display = 'none';
        alertBox.className = 'auth-alert-box';
    }

    const tabsRow = document.getElementById('auth-tabs');
    const modalTitle = document.getElementById('auth-modal-title');
    const modalSub = document.getElementById('auth-modal-subtitle');

    if (tabName === 'profile') {
        if (tabsRow) tabsRow.style.display = 'none';
        if (modalTitle) modalTitle.innerHTML = '🎓 Student Profile';
        if (modalSub) modalSub.innerText = 'Manage your cloud sync and account settings.';
        const user = window.SupabaseSync.getCurrentStudent();
        const pUser = document.getElementById('profile-username');
        if (pUser && user) pUser.innerText = user.username;
    } else if (tabName === 'changepass') {
        if (tabsRow) tabsRow.style.display = 'none';
        if (modalTitle) modalTitle.innerHTML = '🔑 Change Password';
        if (modalSub) modalSub.innerText = 'Set a new secure password for your account.';
    } else {
        if (tabsRow) tabsRow.style.display = 'flex';
        if (modalTitle) modalTitle.innerHTML = '🔐 Student Portal';
        if (modalSub) modalSub.innerText = 'Sign in or create an account to sync progress across devices.';
    }
};

window.handleQuestionChange = function() {
    const sel = document.getElementById('reg-question-select');
    const custom = document.getElementById('reg-question-custom');
    if (sel && custom) {
        custom.style.display = sel.value === '__custom__' ? 'block' : 'none';
        if (sel.value === '__custom__') custom.focus();
    }
};


// ============================================================================
// HCI AUTH VALIDATION & FEEDBACK HELPERS
// ============================================================================
window.showAuthAlert = function(message, type = 'error') {
    const alertBox = document.getElementById('auth-alert');
    if (!alertBox) return;

    alertBox.style.display = 'block';
    alertBox.className = `auth-alert-box ${type}`;
    
    let icon = '❌';
    if (type === 'success') icon = '✅';
    else if (type === 'warning') icon = '⚠️';
    else if (type === 'info') icon = 'ℹ️';

    alertBox.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.clearAuthAlert = function() {
    const alertBox = document.getElementById('auth-alert');
    if (alertBox) {
        alertBox.style.display = 'none';
        alertBox.className = 'auth-alert-box';
        alertBox.innerHTML = '';
    }
    document.querySelectorAll('.auth-form-input, .auth-form-select').forEach(el => {
        el.classList.remove('input-error');
    });
};

window.highlightAuthError = function(elementId, message) {
    window.clearAuthAlert();
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.add('input-error');
        el.focus();
        el.addEventListener('input', () => {
            el.classList.remove('input-error');
            const alertBox = document.getElementById('auth-alert');
            if (alertBox) alertBox.style.display = 'none';
        }, { once: true });
    }
    if (message) {
        window.showAuthAlert(message, 'error');
        window.showToast(message, 'error');
    }
};

// ============================================================================
// AUTH & CLOUD ACTION HANDLERS (FULL HCI FEEDBACK)
// ============================================================================
window.handleSignIn = async function() {
    window.clearAuthAlert();
    const uInput = document.getElementById('signin-username');
    const pInput = document.getElementById('signin-password');
    const submitBtn = document.querySelector('#panel-signin .btn-auth-submit');

    const u = (uInput?.value || '').trim();
    const p = (pInput?.value || '').trim();

    if (!u) {
        window.highlightAuthError('signin-username', 'Please enter your username.');
        return;
    }
    if (!p) {
        window.highlightAuthError('signin-password', 'Please enter your password.');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Signing in...';
    }

    window.showAuthAlert('Authenticating with database...', 'info');

    const res = await window.SupabaseSync.login(u, p);
    if (res && res.success) {
        window.showAuthAlert(`Welcome back, ${res.username}! Synchronizing data...`, 'success');
        window.showToast(`Signed in as ${res.username}!`, 'success');

        if (res.requires_password_change) {
            setTimeout(() => {
                window.switchAuthTab('changepass');
                const banner = document.getElementById('changepass-alert-banner');
                if (banner) banner.style.display = 'block';
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Sign In to Reviewer';
                }
            }, 800);
            return;
        }

        setTimeout(() => {
            window.closeAuthModal();
            location.reload();
        }, 900);
    } else {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In to Reviewer';
        }
        const err = res?.error || 'Invalid username or password.';
        window.highlightAuthError('signin-password', err);
    }
};

window.handleRegister = async function() {
    window.clearAuthAlert();
    const uInput = document.getElementById('reg-username');
    const pInput = document.getElementById('reg-password');
    const qSelect = document.getElementById('reg-question-select');
    const qCustom = document.getElementById('reg-question-custom');
    const aInput = document.getElementById('reg-answer');
    const submitBtn = document.querySelector('#panel-register .btn-auth-submit');

    const u = (uInput?.value || '').trim();
    const p = (pInput?.value || '').trim();
    let q = qSelect?.value || '';
    if (q === '__custom__') q = (qCustom?.value || '').trim();
    const a = (aInput?.value || '').trim();

    if (!u || u.length < 3) {
        window.highlightAuthError('reg-username', 'Username must be at least 3 characters.');
        return;
    }
    if (!p || p.length < 4) {
        window.highlightAuthError('reg-password', 'Password must be at least 4 characters.');
        return;
    }
    if (!q || q === '__custom__') {
        window.highlightAuthError('reg-question-custom', 'Please write your custom security question.');
        return;
    }
    if (!a || a.length < 2) {
        window.highlightAuthError('reg-answer', 'Please provide an answer to your security question.');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Creating account...';
    }

    window.showAuthAlert('Registering student profile...', 'info');

    const res = await window.SupabaseSync.register(u, p, q, a);
    if (res && res.success) {
        window.showAuthAlert(`Account created successfully for ${res.username}!`, 'success');
        window.showToast(`Welcome, ${res.username}! Account created.`, 'success');
        setTimeout(() => {
            window.closeAuthModal();
            location.reload();
        }, 1000);
    } else {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create Account &amp; Sync';
        }
        const err = res?.error || 'Registration failed. Username may already exist.';
        window.highlightAuthError('reg-username', err);
    }
};

window.handleQuestionChange = function() {
    const select = document.getElementById('reg-question-select');
    const customInput = document.getElementById('reg-question-custom');
    if (select && customInput) {
        customInput.style.display = (select.value === '__custom__') ? 'block' : 'none';
        if (select.value === '__custom__') customInput.focus();
    }
};

window.handleFetchQuestion = async function() {
    window.clearAuthAlert();
    const uInput = document.getElementById('forgot-username');
    const btn = document.querySelector('#forgot-step-1 button');
    const u = (uInput?.value || '').trim();

    if (!u) {
        window.highlightAuthError('forgot-username', 'Please enter your username to find your account.');
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Finding account...';
    }

    window.showAuthAlert('Finding student profile...', 'info');

    const res = await window.SupabaseSync.getSecurityQuestion(u);
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Find My Account';
    }

    if (res && res.success) {
        window.clearAuthAlert();
        document.getElementById('forgot-step-1').style.display = 'none';
        document.getElementById('forgot-step-2').style.display = 'block';
        document.getElementById('forgot-question-display').innerText = res.question;
        const ansInput = document.getElementById('forgot-answer');
        if (ansInput) {
            ansInput.value = '';
            ansInput.focus();
        }
    } else {
        const err = res?.error || 'Username not found. Please verify your username.';
        window.highlightAuthError('forgot-username', err);
    }
};

window.handleVerifyAnswer = async function() {
    window.clearAuthAlert();
    const u = (document.getElementById('forgot-username')?.value || '').trim();
    const aInput = document.getElementById('forgot-answer');
    const btn = document.querySelector('#forgot-step-2 button');
    const a = (aInput?.value || '').trim();

    if (!a) {
        window.highlightAuthError('forgot-answer', 'Please enter your security answer.');
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Verifying answer...';
    }

    window.showAuthAlert('Verifying security answer...', 'info');

    const res = await window.SupabaseSync.verifyAnswerAndIssueTemp(u, a);
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Verify &amp; Generate Temporary Password';
    }

    if (res && res.success) {
        window.clearAuthAlert();
        document.getElementById('forgot-step-2').style.display = 'none';
        document.getElementById('forgot-step-3').style.display = 'block';
        document.getElementById('forgot-temp-pass-val').innerText = res.temp_password;
        window.showToast("Temporary password generated!", "success");
    } else {
        const err = res?.error || 'Incorrect security answer. Please try again.';
        window.highlightAuthError('forgot-answer', err);
    }
};

window.handleUseTempPassword = function() {
    const u = document.getElementById('forgot-username').value;
    const tempP = document.getElementById('forgot-temp-pass-val').innerText;
    window.switchAuthTab('signin');
    document.getElementById('signin-username').value = u;
    document.getElementById('signin-password').value = tempP;
    window.handleSignIn();
};

window.handleChangePasswordSubmit = async function() {
    window.clearAuthAlert();
    const p1Input = document.getElementById('cp-newpass');
    const p2Input = document.getElementById('cp-confpass');
    const submitBtn = document.querySelector('#panel-changepass .btn-auth-submit');

    const p1 = (p1Input?.value || '').trim();
    const p2 = (p2Input?.value || '').trim();

    if (!p1 || p1.length < 4) {
        window.highlightAuthError('cp-newpass', 'New password must be at least 4 characters long.');
        return;
    }
    if (p1 !== p2) {
        window.highlightAuthError('cp-confpass', 'Passwords do not match. Please re-enter.');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Updating password...';
    }

    window.showAuthAlert('Updating your permanent password in cloud database...', 'info');

    const res = await window.SupabaseSync.changePassword(p1);
    if (res && res.success) {
        window.showAuthAlert('Password successfully updated! Reloading...', 'success');
        window.showToast("Password updated successfully!", "success");
        setTimeout(() => {
            window.closeAuthModal();
            location.reload();
        }, 1000);
    } else {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save New Password';
        }
        const err = res?.error || 'Failed to update password. Please check your connection.';
        window.highlightAuthError('cp-newpass', err);
    }
};

window.handleForceCloudPull = async function(btnEl) {
    const btn = btnEl || event?.target || document.querySelector('#panel-profile button');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Pulling from Cloud...';
    }

    window.showToast("Pulling cloud progress...", "info");
    try {
        await window.SupabaseSync.pullAllCloudProgressToLocal();
        await window.SupabaseSync.pullAllCloudMistakes();
        window.showToast("Cloud progress synced to device!", "success");
        if (btn) btn.innerHTML = '✅ Synced!';
        
        // Refresh trackers & charts
        window.dispatchEvent(new Event('quizProgressUpdated'));
        if (typeof window.renderProgressTracker === 'function') window.renderProgressTracker();
        if (typeof window.updateHeroAuthBanner === 'function') window.updateHeroAuthBanner();
    } catch (err) {
        console.error("Cloud pull error:", err);
        window.showToast("Cloud pull failed: " + err.message, "error");
        if (btn) btn.innerHTML = '❌ Sync Failed';
    }

    setTimeout(() => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText || '🔄 Pull Latest Cloud Progress';
        }
    }, 1800);
};

window.handleForceCloudPush = async function(btnEl) {
    const btn = btnEl || event?.target || document.querySelectorAll('#panel-profile button')[1];
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Pushing to Cloud...';
    }

    window.showToast("Pushing local progress to cloud...", "info");
    try {
        await window.SupabaseSync.pushAllLocalProgressToCloud();
        window.showToast("Local progress pushed to cloud!", "success");
        if (btn) btn.innerHTML = '✅ Pushed!';
    } catch (err) {
        console.error("Cloud push error:", err);
        window.showToast("Cloud push failed: " + err.message, "error");
        if (btn) btn.innerHTML = '❌ Push Failed';
    }

    setTimeout(() => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText || '☁️ Push Local Progress to Cloud';
        }
    }, 1800);
};

window.handleDeleteStudentProgress = function() {
    window.showCustomConfirmModal({
        title: "Delete All Cloud Mastery Progress?",
        message: "This will permanently wipe your quiz scores and answered questions from both the cloud database and this device.",
        icon: "🗑️",
        confirmText: "Delete My Progress",
        cancelText: "Cancel",
        confirmBtnClass: "btn-danger",
        onConfirm: async () => {
            const res = await window.SupabaseSync.deleteProgress('ALL');
            if (res && res.success) {
                window.showToast("Progress wiped successfully.", "info");
                setTimeout(() => location.reload(), 600);
            } else {
                window.showToast(res?.error || "Failed to delete progress.", "error");
            }
        }
    });
};

window.handleDeleteStudentAccount = function() {
    window.showCustomConfirmModal({
        title: "Permanently Delete Account?",
        message: "This will delete your student profile, username, password, and all synced progress forever. This action cannot be undone.",
        icon: "⚠️",
        confirmText: "Permanently Delete Account",
        cancelText: "Cancel",
        confirmBtnClass: "btn-danger",
        onConfirm: async () => {
            const res = await window.SupabaseSync.deleteAccountPermanently();
            if (res && res.success) {
                window.showToast("Account deleted successfully.", "info");
                setTimeout(() => location.reload(), 600);
            } else {
                window.showToast(res?.error || "Failed to delete account.", "error");
            }
        }
    });
};

window.handleSignOut = function() {
    window.SupabaseSync.logout();
    window.closeAuthModal();
    setTimeout(() => location.reload(), 400);
};


// ============================================================================
// CUSTOM SELECT CONTROLLER (JBE ENTERPRISE PATTERN)
// ============================================================================
window.toggleCustomSelect = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const menu = container.querySelector('.custom-select-menu');
    const isOpen = container.classList.contains('open');
    document.querySelectorAll('.custom-select-container.open').forEach(c => {
        if (c !== container) {
            c.classList.remove('open');
            const trig = c.querySelector('.custom-select-trigger');
            if (trig) trig.setAttribute('aria-expanded', 'false');
            const m = c.querySelector('.custom-select-menu');
            if (m) m.style.display = 'none';
        }
    });
    const nextState = !isOpen;
    container.classList.toggle('open', nextState);
    if (menu) menu.style.display = nextState ? 'block' : 'none';
    const trigger = container.querySelector('.custom-select-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', nextState ? 'true' : 'false');
};

window.selectCustomOption = function(containerId, value) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const hiddenInput = container.querySelector('input[type="hidden"]');
    if (hiddenInput) hiddenInput.value = value;

    const labelSpan = container.querySelector('.custom-select-selected-text');
    const options = container.querySelectorAll('.custom-select-option');
    options.forEach(opt => {
        const isMatch = opt.getAttribute('data-value') === value;
        opt.classList.toggle('selected', isMatch);
        if (isMatch && labelSpan) {
            labelSpan.textContent = opt.querySelector('.option-text')?.textContent || value;
        }
    });

    container.classList.remove('open');
    const menu = container.querySelector('.custom-select-menu');
    if (menu) menu.style.display = 'none';
    const trigger = container.querySelector('.custom-select-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');

    window.handleQuestionChange();
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-container')) {
        document.querySelectorAll('.custom-select-container.open').forEach(c => {
            c.classList.remove('open');
            const trig = c.querySelector('.custom-select-trigger');
            if (trig) trig.setAttribute('aria-expanded', 'false');
        });
    }
});


// ============================================================================
// GLOBAL OFFLINE AI STUDY ASSISTANT & QUIZ BOT INITIALIZER
// ============================================================================
(function loadChatbotScript() {
    if (window.StudyChatbot || document.getElementById('ai-study-chatbot-script')) return;

    function injectScript() {
        const script = document.createElement('script');
        script.id = 'ai-study-chatbot-script';
        const loc = window.location.pathname.toLowerCase();
        let prefix = '/';
        if (loc.includes('/subject/')) {
            const depth = (loc.match(/\/subject\//) ? (loc.split('/').length - 2) : 1);
            prefix = depth > 1 ? '../'.repeat(depth) : '../../../';
        }
        script.src = prefix + 'chatbot.js';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectScript);
    } else {
        injectScript();
    }
})();




// ============================================================================
// PROBABILITY FORMULAS & WORKED EXAMPLES MODAL CONTROLLER (DISPLAY MATH)
// ============================================================================
window.openProbabilityExamplesModal = function() {
    let overlay = document.getElementById('probability-examples-modal-overlay');
    if (!overlay) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `    <!-- PROBABILITY FORMULAS & WORKED EXAMPLES MODAL (DISPLAY MATH) -->
    <div id="probability-examples-modal-overlay" class="prob-modal-overlay" aria-hidden="true">
        <div class="prob-modal-box">
            <!-- Header -->
            <div class="prob-modal-header">
                <div>
                    <div class="prob-modal-badge">Data Mining • Prelim Reference</div>
                    <h2 class="prob-modal-title">📊 Probability &amp; Counting Formulas &amp; Worked Examples</h2>
                    <p class="prob-modal-subtitle">14 Comprehensive mathematical references with clean Display Math calculations and step-by-step solutions.</p>
                </div>
                <div class="prob-modal-actions-right"><button class="prob-modal-btn-icon" onclick="window.toggleModalFullscreen(this)" title="Toggle Fullscreen Window">&#x26F6;</button><button class="prob-modal-btn-icon close-btn" onclick="window.closeProbabilityExamplesModal()" title="Close">&times;</button></div>
            </div>

            <!-- Toolbar: Search & Category Chips -->
            <div class="prob-modal-toolbar">
                <div class="prob-search-wrap">
                    <span class="prob-search-icon">🔍</span>
                    <input type="text" id="prob-examples-search" class="prob-search-input" placeholder="Search formulas, rules, or keywords (e.g., Permutations, Combinations, Variations, Factorial, Expected Value)..." oninput="window.filterProbabilityExamples()">
                </div>
                <div class="prob-category-chips">
                    <button class="prob-chip active" data-cat="all" onclick="window.filterProbCategory('all', this)">All Formulas (14)</button>
                    <button class="prob-chip" data-cat="combinatorics" onclick="window.filterProbCategory('combinatorics', this)">Combinatorics &amp; Counting (5)</button>
                    <button class="prob-chip" data-cat="axioms" onclick="window.filterProbCategory('axioms', this)">Axioms &amp; Basic Rules (3)</button>
                    <button class="prob-chip" data-cat="addition" onclick="window.filterProbCategory('addition', this)">Addition &amp; Unions (2)</button>
                    <button class="prob-chip" data-cat="multiplication" onclick="window.filterProbCategory('multiplication', this)">Multiplication &amp; Events (2)</button>
                    <button class="prob-chip" data-cat="expectation" onclick="window.filterProbCategory('expectation', this)">Expected Value &amp; Trials (2)</button>
                </div>
            </div>

            <!-- Scrollable Content -->
            <div class="prob-modal-content" id="prob-examples-list">

                    <!-- 1. Range Axiom -->
                    <div class="prob-card" data-cat="axioms">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">1</div>
                                <h3 class="prob-card-title">Range Axiom</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Probability Axiom</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('0 <= P(A) <= 1', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">0 &le; P(A) &le; 1</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Any probability must be between <strong>0</strong> (impossible event) and <strong>1</strong> (certain event). It can never be negative, and it can never be greater than 1.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎲 Worked Example: Rolling a Standard 6-Sided Die</div>
                            <p class="prob-scenario-desc">Rolling a standard 6-sided die to get an even number {2, 4, 6}.</p>
                            <div style="font-size:0.86rem; color:var(--text-muted-color);">
                                • Total possible outcomes: <strong>n(S) = 6</strong><br>
                                • Favorable outcomes: <strong>n(Even) = 3</strong>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Calculation</span>
                                <div>
                                    <div class="prob-math-display" style="padding:8px 12px; margin:2px 0;">
                                        <div class="prob-math-inline-block">
                                            P(Even) = <span class="math-frac"><span class="math-num">3</span><span class="math-den">6</span></span> = 0.50 (50%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="prob-check-badge">✅ Check: 0 &le; 0.50 &le; 1 (Valid Probability)</div>
                        </div>
                    </div>

                    <!-- 2. Complement Rule -->
                    <div class="prob-card" data-cat="axioms">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">2</div>
                                <h3 class="prob-card-title">Complement Rule</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Opposite Event</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(A') = 1 - P(A)', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">P(A') = 1 &minus; P(A)</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> The probability that event A will <strong>not happen</strong> is equal to <strong>1 minus the probability that it does happen</strong>.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🌧️ Worked Example: Probability of Rain</div>
                            <p class="prob-scenario-desc">The probability that it will rain tomorrow is <strong>P(Rain) = 0.35</strong>. Find the probability that it will not rain.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Identify P(A): <span class="prob-step-calc">P(Rain) = 0.35</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>
                                    Subtract from 1:
                                    <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;">
                                        <div class="prob-math-inline-block">P(No Rain) = 1 &minus; 0.35 = 0.65 (65%)</div>
                                    </div>
                                </div>
                            </div>
                            <div class="prob-check-badge">✅ Check: 0.35 + 0.65 = 1.00 (Exhaustive Complement)</div>
                        </div>
                    </div>

                    <!-- 3. Addition Rule (General - Overlapping Events) -->
                    <div class="prob-card" data-cat="addition">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">3</div>
                                <h3 class="prob-card-title">Addition Rule (General - Overlapping Events)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Union / Non-Exclusive</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(A ∪ B) = P(A) + P(B) - P(A ∩ B)', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">P(A &cup; B) = P(A) + P(B) &minus; P(A &cap; B)</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Used to find the probability of <strong>A or B</strong> occurring when both events can happen at the same time. You subtract the overlap <strong>P(A &cap; B)</strong> so it is not counted twice.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎓 Worked Example: Student Subject Preferences</div>
                            <p class="prob-scenario-desc">In a class of 100 students: 40 students like Math (P(Math) = 40/100 = 0.40), 30 like Science (P(Science) = 30/100 = 0.30), and 10 like both (P(Math &cap; Science) = 10/100 = 0.10).</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Add individual probabilities: <span class="prob-step-calc">0.40 + 0.30 = 0.70</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>
                                    Subtract the overlap:
                                    <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;">
                                        <div class="prob-math-inline-block">P(Math &cup; Science) = 0.70 &minus; 0.10 = 0.60 (60%)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 4. Addition Rule (Mutually Exclusive Events) -->
                    <div class="prob-card" data-cat="addition">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">4</div>
                                <h3 class="prob-card-title">Addition Rule (Mutually Exclusive Events)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Disjoint Events</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(A ∪ B) = P(A) + P(B)', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">P(A &cup; B) = P(A) + P(B)</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Used when two events <strong>cannot happen at the same time</strong> (P(A &cap; B) = 0). Since there is zero intersection, no subtraction is needed.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎲 Worked Example: Rolling a 2 or a 5 on a Die</div>
                            <p class="prob-scenario-desc">Rolling a single 6-sided die. What is the probability of rolling a 2 or a 5?</p>
                            <div style="font-size:0.86rem; color:var(--text-muted-color);">
                                • P(2) = 1/6<br>
                                • P(5) = 1/6
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>
                                    Add the two probabilities:
                                    <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;">
                                        <div class="prob-math-inline-block">
                                            P(2 &cup; 5) = <span class="math-frac"><span class="math-num">1</span><span class="math-den">6</span></span> + <span class="math-frac"><span class="math-num">1</span><span class="math-den">6</span></span> = <span class="math-frac"><span class="math-num">2</span><span class="math-den">6</span></span> = <span class="math-frac"><span class="math-num">1</span><span class="math-den">3</span></span> &approx; 0.333 (33.3%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 5. Multiplication Rule (General - Dependent Events) -->
                    <div class="prob-card" data-cat="multiplication">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">5</div>
                                <h3 class="prob-card-title">Multiplication Rule (General - Dependent Events)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Conditional / Without Replacement</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(A ∩ B) = P(A) × P(B|A)', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">P(A &cap; B) = P(A) &times; P(B | A)</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Used when the first event A <strong>directly affects the chance</strong> of the second event B (such as drawing items without replacement).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🔴 Worked Example: Drawing Marbles Without Replacement</div>
                            <p class="prob-scenario-desc">A box contains 3 red marbles and 2 blue marbles (5 total). You draw 2 marbles one after another without replacement. Find the probability that both marbles are red.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Probability of 1st marble red: <span class="prob-step-calc">P(1st Red) = 3/5 = 0.60</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>Probability of 2nd marble red (given 1st was red: 2 red left, 4 total left): <span class="prob-step-calc">P(2nd Red | 1st Red) = 2/4 = 0.50</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 3</span>
                                <div>
                                    Multiply:
                                    <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;">
                                        <div class="prob-math-inline-block">P(Both Red) = 0.60 &times; 0.50 = 0.30 (30%)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 6. Multiplication Rule (Independent Events) -->
                    <div class="prob-card" data-cat="multiplication">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">6</div>
                                <h3 class="prob-card-title">Multiplication Rule (Independent Events)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Independent / Replacement</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(A ∩ B) = P(A) × P(B)', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">P(A &cap; B) = P(A) &times; P(B)</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Used when event A has <strong>no effect whatsoever</strong> on event B.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🪙 Worked Example: Coin Flip &amp; Die Roll</div>
                            <p class="prob-scenario-desc">Flipping a fair coin and rolling a fair 6-sided die. Find the probability of getting Heads and rolling a 4.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Probability of Heads: <span class="prob-step-calc">P(Heads) = 1/2 = 0.50</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>Probability of rolling a 4: <span class="prob-step-calc">P(4) = 1/6 &approx; 0.1667</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 3</span>
                                <div>
                                    Multiply:
                                    <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;">
                                        <div class="prob-math-inline-block">
                                            P(Heads &cap; 4) = <span class="math-frac"><span class="math-num">1</span><span class="math-den">2</span></span> &times; <span class="math-frac"><span class="math-num">1</span><span class="math-den">6</span></span> = <span class="math-frac"><span class="math-num">1</span><span class="math-den">12</span></span> &approx; 0.0833 (8.33%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 7. Expected Value E(X) -->
                    <div class="prob-card" data-cat="expectation">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">7</div>
                                <h3 class="prob-card-title">Expected Value E(X)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Weighted Average</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('E(X) = ∑ [x_i × P(x_i)]', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">E(X) = &sum; [ x<sub>i</sub> &sdot; P(x<sub>i</sub>) ]</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> The long-term average outcome calculated by multiplying each value (x<sub>i</sub>) by its probability (P(x<sub>i</sub>)) and adding them all together.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎡 Worked Example: Prize Wheel Payout</div>
                            <p class="prob-scenario-desc">A prize wheel gives: \$10 with probability 0.20, \$5 with probability 0.50, and \$0 with probability 0.30.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>
                                    Multiply each value by its probability:<br>
                                    • Outcome 1: <span class="prob-step-calc">10 &times; 0.20 = 2.0</span><br>
                                    • Outcome 2: <span class="prob-step-calc">5 &times; 0.50 = 2.5</span><br>
                                    • Outcome 3: <span class="prob-step-calc">0 &times; 0.30 = 0.0</span>
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>
                                    Sum all values:
                                    <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;">
                                        <div class="prob-math-inline-block">E(X) = 2.0 + 2.5 + 0.0 = 4.50 (\$4.50)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 8. Experimental Probability -->
                    <div class="prob-card" data-cat="expectation">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">8</div>
                                <h3 class="prob-card-title">Experimental Probability</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Empirical / Real-World</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P_exp(A) = Successful Trials / Total Trials', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                P<sub>exp</sub>(A) = <span class="math-frac"><span class="math-num">Successful Trials</span><span class="math-den">Total Trials</span></span>
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Probability based strictly on actual real-world experiment results rather than theoretical formulas.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🪙 Worked Example: Coin Flip Experiment</div>
                            <p class="prob-scenario-desc">You flip a coin 50 times in total, and it lands on Heads 28 times.</p>
                            <div style="font-size:0.86rem; color:var(--text-muted-color);">
                                • Successful Trials = 28<br>
                                • Total Trials = 50
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Calculation</span>
                                <div>
                                    <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;">
                                        <div class="prob-math-inline-block">
                                            P<sub>exp</sub>(Heads) = <span class="math-frac"><span class="math-num">28</span><span class="math-den">50</span></span> = 0.56 (56%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 9. Total Probability Sum -->
                    <div class="prob-card" data-cat="axioms">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">9</div>
                                <h3 class="prob-card-title">Total Probability Sum</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Sample Space Axiom</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('∑ P(X = x_i) = 1', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">&sum; P(X = x<sub>i</sub>) = 1</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> If you add the probabilities of all possible mutually exclusive outcomes in a complete sample space, the sum must <strong>always equal exactly 1 (100%)</strong>.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎯 Worked Example: Spinner Color Outcomes</div>
                            <p class="prob-scenario-desc">A spinner has 3 colored sections: Red, Blue, and Green. P(Red) = 0.45, P(Blue) = 0.35, and P(Green) = 0.20.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Add all individual probabilities: <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;"><div class="prob-math-inline-block">&sum; P(X) = 0.45 + 0.35 + 0.20</div></div></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>Verify sum: <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;"><div class="prob-math-inline-block">0.45 + 0.35 + 0.20 = 1.00 (100%)</div></div></div>
                            </div>
                            <div class="prob-check-badge">✅ Check: Exactly 1.00 &mdash; Valid Exhaustive Sample Space!</div>
                        </div>
                    </div>

                    <!-- 10. Permutations (Without Repetition) -->
                    <div class="prob-card" data-cat="combinatorics">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">10</div>
                                <h3 class="prob-card-title">Permutations (Without Repetition)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">All Items • Order Matters</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Total Arrangements = n!', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">Total Arrangements = n!</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Use Case (When to use it):</strong> Use this when you are arranging <strong>all</strong> items in a specific order, and each item can only be used once. <strong>Order matters</strong>.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">📚 Worked Example: Arranging Books on a Shelf</div>
                            <p class="prob-scenario-desc">Arranging <strong>n = 4</strong> different books on a bookshelf.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Write the factorial expression: <span class="prob-step-calc">4! = 4 &times; 3 &times; 2 &times; 1</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>
                                    Multiply:
                                    <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;">
                                        <div class="prob-math-inline-block">4! = 24 arrangements</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 11. Variations (Without Repetition) -->
                    <div class="prob-card" data-cat="combinatorics">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">11</div>
                                <h3 class="prob-card-title">Variations (Without Repetition)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Subset Ranked • Order Matters</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Total Ways = n! / (n - p)!', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Total Ways = V<sub>n</sub><sup>p</sup> = 
                                <span class="math-frac">
                                    <span class="math-num">n!</span>
                                    <span class="math-den">(n &minus; p)!</span>
                                </span>
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Use Case (When to use it):</strong> Use this when you have a set of <strong>n items</strong>, and you want to select and rank/order only <strong>p</strong> of them. <strong>Order matters</strong>, and items cannot be reused.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🏃 Worked Example: Race Podium Placements</div>
                            <p class="prob-scenario-desc">A race has <strong>n = 5</strong> runners. How many ways can <strong>p = 3</strong> runners win 1st, 2nd, and 3rd place?</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Identify values: <span class="prob-step-calc">n = 5, p = 3</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>Calculate denominator (n &minus; p)!: <span class="prob-step-calc">(5 &minus; 3)! = 2! = 2 &times; 1 = 2</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 3</span>
                                <div>Calculate numerator n!: <span class="prob-step-calc">5! = 5 &times; 4 &times; 3 &times; 2 &times; 1 = 120</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 4</span>
                                <div>
                                    Divide:
                                    <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;">
                                        <div class="prob-math-inline-block">
                                            <span class="math-frac"><span class="math-num">120</span><span class="math-den">2</span></span> = 60 possible podium finishes
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 12. Variations (With Repetition) -->
                    <div class="prob-card" data-cat="combinatorics">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">12</div>
                                <h3 class="prob-card-title">Variations (With Repetition)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Repeated Choices • Order Matters</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Total Ways = n^p', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">Total Ways = n<sup>p</sup></div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Use Case (When to use it):</strong> Use this when you are filling <strong>p ordered positions</strong> from <strong>n choices</strong>, and you can repeat choices (like PIN codes, passwords, or multiple choice answers). <strong>Order matters</strong>.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🔢 Worked Example: Creating a 3-Digit PIN Code</div>
                            <p class="prob-scenario-desc">Creating a <strong>p = 3</strong> digit PIN code using digits 0 to 9 (<strong>n = 10</strong> options). Digits can repeat (e.g., 777).</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Identify values: <span class="prob-step-calc">n = 10, p = 3</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>
                                    Compute n<sup>p</sup>:
                                    <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;">
                                        <div class="prob-math-inline-block">10<sup>3</sup> = 10 &times; 10 &times; 10 = 1,000 possible PIN codes</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 13. Combinations (Without Repetition) -->
                    <div class="prob-card" data-cat="combinatorics">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">13</div>
                                <h3 class="prob-card-title">Combinations (Without Repetition)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Groups • Order Does NOT Matter</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Total Groups = n! / (p! × (n - p)!)', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Total Groups = C<sub>n</sub><sup>p</sup> = 
                                <span class="math-frac">
                                    <span class="math-num">n!</span>
                                    <span class="math-den">p! &times; (n &minus; p)!</span>
                                </span>
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Use Case (When to use it):</strong> Use this when you are selecting a group or committee of <strong>p items</strong> from <strong>n items</strong>, and the <strong>order of selection does NOT matter</strong>. Items cannot be repeated.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">👥 Worked Example: Choosing Student Project Teams</div>
                            <p class="prob-scenario-desc">A teacher chooses a project team of <strong>p = 3</strong> students from a class of <strong>n = 5</strong> students.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Identify values: <span class="prob-step-calc">n = 5, p = 3</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>Calculate n!: <span class="prob-step-calc">5! = 5 &times; 4 &times; 3 &times; 2 &times; 1 = 120</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 3</span>
                                <div>Calculate p!: <span class="prob-step-calc">3! = 3 &times; 2 &times; 1 = 6</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 4</span>
                                <div>Calculate (n &minus; p)!: <span class="prob-step-calc">(5 &minus; 3)! = 2! = 2 &times; 1 = 2</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 5</span>
                                <div>Multiply denominator: <span class="prob-step-calc">p! &times; (n &minus; p)! = 6 &times; 2 = 12</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 6</span>
                                <div>
                                    Divide:
                                    <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;">
                                        <div class="prob-math-inline-block">
                                            <span class="math-frac"><span class="math-num">120</span><span class="math-den">12</span></span> = 10 possible student groups
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 14. Combinations (With Repetition) -->
                    <div class="prob-card" data-cat="combinatorics">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">14</div>
                                <h3 class="prob-card-title">Combinations (With Repetition)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Multi-Category Pick • Order Does NOT Matter</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Total Combinations = (n + p - 1)! / (p! × (n - 1)!)', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Total Combinations = 
                                <span class="math-frac">
                                    <span class="math-num">(n + p &minus; 1)!</span>
                                    <span class="math-den">p! &times; (n &minus; 1)!</span>
                                </span>
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Use Case (When to use it):</strong> Use this when you are choosing <strong>p items</strong> from <strong>n categories</strong>, the <strong>order does NOT matter</strong>, and you can pick <strong>multiples of the same category</strong> (like donut flavors or ice cream scoops).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🍩 Worked Example: Buying Donut Flavor Combinations</div>
                            <p class="prob-scenario-desc">Buying <strong>p = 2</strong> donuts from a bakery selling <strong>n = 3</strong> flavors (Chocolate, Glazed, Strawberry). You can choose two of the same flavor (e.g., 2 Chocolate).</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Calculate (n + p &minus; 1): <span class="prob-step-calc">3 + 2 &minus; 1 = 4</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>Calculate (n &minus; 1): <span class="prob-step-calc">3 &minus; 1 = 2</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 3</span>
                                <div>Calculate numerator (4!): <span class="prob-step-calc">4! = 4 &times; 3 &times; 2 &times; 1 = 24</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 4</span>
                                <div>Calculate denominator terms: <span class="prob-step-calc">p! = 2! = 2</span> and <span class="prob-step-calc">(n &minus; 1)! = 2! = 2</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 5</span>
                                <div>Multiply denominator: <span class="prob-step-calc">2 &times; 2 = 4</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 6</span>
                                <div>
                                    Divide:
                                    <div class="prob-math-display" style="padding:8px 12px; margin:4px 0;">
                                        <div class="prob-math-inline-block">
                                            <span class="math-frac"><span class="math-num">24</span><span class="math-den">4</span></span> = 6 distinct donut selections
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                <div id="prob-no-results" style="display:none; text-align:center; padding:40px 20px; color:var(--text-muted-color);">
                    <span style="font-size:2rem;">🔍</span>
                    <p style="margin:8px 0 0 0; font-weight:600;">No matching probability or counting formulas found.</p>
                    <p style="margin:4px 0 0 0; font-size:0.85rem;">Try adjusting your search terms or selecting 'All Formulas'.</p>
                </div>
            </div>
        </div>
    </div>`;
        document.body.appendChild(wrapper.firstElementChild);
        overlay = document.getElementById('probability-examples-modal-overlay');
    }

    if (overlay) {
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const searchInput = document.getElementById('prob-examples-search');
            if (searchInput) searchInput.focus();
        }, 100);
    }
};

window.closeProbabilityExamplesModal = function() {
    const overlay = document.getElementById('probability-examples-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
};

window.filterProbabilityExamples = function() {
    const query = (document.getElementById('prob-examples-search')?.value || '').toLowerCase().trim();
    const activeChip = document.querySelector('.prob-chip.active');
    const activeCat = activeChip ? activeChip.getAttribute('data-cat') || 'all' : 'all';

    const cards = document.querySelectorAll('.prob-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const cat = card.getAttribute('data-cat') || 'all';

        const matchesQuery = !query || text.includes(query);
        const matchesCat = activeCat === 'all' || cat.includes(activeCat);

        if (matchesQuery && matchesCat) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const noResults = document.getElementById('prob-no-results');
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
};

window.filterProbCategory = function(category, btn) {
    document.querySelectorAll('.prob-chip').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    window.filterProbabilityExamples();
};

window.copyProbFormula = function(formulaText, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(formulaText).then(() => {
            if (btn) {
                const orig = btn.innerHTML;
                btn.innerHTML = '✅ Copied!';
                setTimeout(() => { btn.innerHTML = orig; }, 1800);
            }
            if (window.showToast) window.showToast('Formula copied to clipboard!', 'success');
        });
    }
};

// Global click & Escape key listener for Probability Examples Modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const overlay = document.getElementById('probability-examples-modal-overlay');
        if (overlay && overlay.classList.contains('active')) {
            window.closeProbabilityExamplesModal();
        }
    }
});

document.addEventListener('click', (e) => {
    const overlay = document.getElementById('probability-examples-modal-overlay');
    if (overlay && e.target === overlay) {
        window.closeProbabilityExamplesModal();
    }
});


// ============================================================================
// PROBABILITY DISTRIBUTIONS WORKED EXAMPLES MODAL CONTROLLER (DISPLAY MATH)
// ============================================================================
window.openDistributionsExamplesModal = function() {
    let overlay = document.getElementById('distributions-examples-modal-overlay');
    if (!overlay) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `    <!-- PROBABILITY DISTRIBUTIONS WORKED EXAMPLES MODAL (DISPLAY MATH) -->
    <div id="distributions-examples-modal-overlay" class="prob-modal-overlay" aria-hidden="true">
        <div class="prob-modal-box">
            <!-- Header -->
            <div class="prob-modal-header">
                <div>
                    <div class="prob-modal-badge">Data Mining • Prelim Reference</div>
                    <h2 class="prob-modal-title">📈 Probability Distributions Formulas &amp; Worked Examples</h2>
                    <p class="prob-modal-subtitle">16 Complete references with Display Math, Discrete/Continuous models, CDF/PDF rules, and Empirical 68-95-99.7 outliers.</p>
                </div>
                <div class="prob-modal-actions-right"><button class="prob-modal-btn-icon" onclick="window.toggleModalFullscreen(this)" title="Toggle Fullscreen Window">&#x26F6;</button><button class="prob-modal-btn-icon close-btn" onclick="window.closeDistributionsExamplesModal()" title="Close">&times;</button></div>
            </div>

            <!-- Toolbar: Search & Category Chips -->
            <div class="prob-modal-toolbar">
                <div class="prob-search-wrap">
                    <span class="prob-search-icon">🔍</span>
                    <input type="text" id="dist-examples-search" class="prob-search-input" placeholder="Search distributions (e.g., Binomial, Poisson, Normal, Student t, Chi-Squared, CDF, Empirical, Outlier)..." oninput="window.filterDistributionsExamples()">
                </div>
                <div class="prob-category-chips">
                    <button class="prob-chip active" data-cat="all" onclick="window.filterDistCategory('all', this)">All Topics (16)</button>
                    <button class="prob-chip" data-cat="discrete" onclick="window.filterDistCategory('discrete', this)">Discrete Distributions (4)</button>
                    <button class="prob-chip" data-cat="continuous" onclick="window.filterDistCategory('continuous', this)">Continuous Distributions (6)</button>
                    <button class="prob-chip" data-cat="concepts" onclick="window.filterDistCategory('concepts', this)">PDF, CDF &amp; Intervals (3)</button>
                    <button class="prob-chip" data-cat="empirical" onclick="window.filterDistCategory('empirical', this)">Empirical Rules &amp; Outliers (3)</button>
                </div>
            </div>

            <!-- Scrollable Content -->
            <div class="prob-modal-content" id="dist-examples-list">

                    <!-- 1. Bernoulli Distribution -->
                    <div class="prob-card" data-cat="discrete">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">1</div>
                                <h3 class="prob-card-title">Bernoulli Distribution (Discrete)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Discrete • Single Trial</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('μ = p, σ² = p(1 - p)', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Mean (&mu;) = p &nbsp;&nbsp;|&nbsp;&nbsp; Variance (&sigma;<sup>2</sup>) = p(1 &minus; p)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>When to Use It:</strong> Use this for a <strong>single trial</strong> that can only end in one of two ways: <strong>Success (1)</strong> or <strong>Failure (0)</strong> (e.g., passing a test, coin landing on heads, user clicking an ad).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🛒 Worked Example: Website Purchase Click</div>
                            <p class="prob-scenario-desc">A website visitor has a <strong>p = 0.20</strong> probability of clicking "Buy" (Success).</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Mean</span>
                                <div><span class="prob-step-calc">&mu; = 0.20</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Variance</span>
                                <div>
                                    <span class="prob-step-calc">&sigma;<sup>2</sup> = 0.20 &times; (1 &minus; 0.20) = 0.20 &times; 0.80 = 0.16</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Binomial Distribution -->
                    <div class="prob-card" data-cat="discrete">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">2</div>
                                <h3 class="prob-card-title">Binomial Distribution (Discrete)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Discrete • n Independent Trials</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(y) = C(n, y) * p^y * (1 - p)^(n - y)', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                P(y) = C(n, y) &sdot; p<sup>y</sup> &sdot; (1 &minus; p)<sup>n &minus; y</sup>
                                &nbsp;&nbsp;|&nbsp;&nbsp; &mu; = n &sdot; p
                                &nbsp;&nbsp;|&nbsp;&nbsp; &sigma;<sup>2</sup> = n &sdot; p &sdot; (1 &minus; p)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>When to Use It:</strong> Use this when you repeat a Bernoulli trial <strong>n times independently</strong> and want to find the probability of getting exactly <strong>y successes</strong> (e.g., testing 10 items for defects, flipping a coin 5 times).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">💡 Worked Example: Testing Lightbulbs for Defects</div>
                            <p class="prob-scenario-desc">You test <strong>n = 3</strong> lightbulbs. Each has defect probability <strong>p = 0.10</strong>. Find <strong>P(y = 1)</strong> defective bulb, the Mean, and the Variance.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>
                                    Calculate Combinations C(3, 1):
                                    <span class="prob-step-calc">C(3, 1) = 3! / [1!(3 - 1)!] = 6 / 2 = 3</span>
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>
                                    Calculate P(1):
                                    <div class="prob-math-display" style="padding:8px 12px; margin:3px 0;">
                                        <div class="prob-math-inline-block">
                                            P(1) = 3 &times; (0.10)<sup>1</sup> &times; (0.90)<sup>2</sup> = 3 &times; 0.10 &times; 0.81 = 0.243 (24.3%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 3</span>
                                <div>Mean: <span class="prob-step-calc">&mu; = 3 &times; 0.10 = 0.30</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 4</span>
                                <div>Variance: <span class="prob-step-calc">&sigma;<sup>2</sup> = 3 &times; 0.10 &times; 0.90 = 0.27</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Discrete Uniform Distribution -->
                    <div class="prob-card" data-cat="discrete">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">3</div>
                                <h3 class="prob-card-title">Discrete Uniform Distribution (Discrete)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Discrete • Equal Integer Range</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('μ = (a + b)/2, σ² = ((b - a + 1)^2 - 1)/12', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                &mu; = <span class="math-frac"><span class="math-num">a + b</span><span class="math-den">2</span></span>
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                &sigma;<sup>2</sup> = <span class="math-frac"><span class="math-num">(b &minus; a + 1)<sup>2</sup> &minus; 1</span><span class="math-den">12</span></span>
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>When to Use It:</strong> Use this when choosing from a finite set of consecutive integers from minimum <strong>a</strong> to maximum <strong>b</strong>, where every single number has an equal chance of being chosen (e.g., rolling a fair die, picking a random ticket number).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎲 Worked Example: Rolling a Fair 8-Sided Die</div>
                            <p class="prob-scenario-desc">Rolling a fair 8-sided die numbered from <strong>a = 1</strong> to <strong>b = 8</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>
                                    Calculate Mean:
                                    <span class="prob-step-calc">&mu; = (1 + 8) / 2 = 9 / 2 = 4.5</span>
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>
                                    Calculate Variance:
                                    <div class="prob-math-display" style="padding:8px 12px; margin:3px 0;">
                                        <div class="prob-math-inline-block">
                                            &sigma;<sup>2</sup> = <span class="math-frac"><span class="math-num">(8 &minus; 1 + 1)<sup>2</sup> &minus; 1</span><span class="math-den">12</span></span> = <span class="math-frac"><span class="math-num">64 &minus; 1</span><span class="math-den">12</span></span> = <span class="math-frac"><span class="math-num">63</span><span class="math-den">12</span></span> = 5.25
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 4. Poisson Distribution -->
                    <div class="prob-card" data-cat="discrete">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">4</div>
                                <h3 class="prob-card-title">Poisson Distribution (Discrete)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Discrete • Rate Over Interval</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(y) = (λ^y * e^-λ) / y!', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                P(y) = <span class="math-frac"><span class="math-num">&lambda;<sup>y</sup> &sdot; e<sup>&minus;&lambda;</sup></span><span class="math-den">y!</span></span>
                                &nbsp;&nbsp;|&nbsp;&nbsp; &mu; = &lambda;
                                &nbsp;&nbsp;|&nbsp;&nbsp; &sigma;<sup>2</sup> = &lambda;
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>When to Use It:</strong> Use this to count the number of times an event happens within a <strong>fixed unit of time, distance, or area</strong> (e.g., customer arrivals per hour, support tickets received per day).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">📞 Worked Example: Help Desk Call Arrivals</div>
                            <p class="prob-scenario-desc">A help desk receives an average of <strong>&lambda; = 3</strong> calls per hour. Find the probability of receiving exactly <strong>y = 2</strong> calls in an hour (given e<sup>&minus;3</sup> &approx; 0.0498).</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>
                                    Calculate P(2):
                                    <div class="prob-math-display" style="padding:8px 12px; margin:3px 0;">
                                        <div class="prob-math-inline-block">
                                            P(2) = <span class="math-frac"><span class="math-num">3<sup>2</sup> &sdot; 0.0498</span><span class="math-den">2!</span></span> = <span class="math-frac"><span class="math-num">9 &times; 0.0498</span><span class="math-den">2</span></span> = <span class="math-frac"><span class="math-num">0.4482</span><span class="math-den">2</span></span> = 0.2241 (22.41%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>Mean &amp; Variance: <span class="prob-step-calc">&mu; = 3</span> &nbsp;|&nbsp; <span class="prob-step-calc">&sigma;<sup>2</sup> = 3</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 5. Continuous Uniform Distribution -->
                    <div class="prob-card" data-cat="continuous">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">5</div>
                                <h3 class="prob-card-title">Continuous Uniform Distribution (Continuous)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Continuous • Interval [a, b]</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('f(x) = 1/(b - a), μ = (a + b)/2, σ² = (b - a)^2 / 12', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                f(x) = <span class="math-frac"><span class="math-num">1</span><span class="math-den">b &minus; a</span></span>
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                &mu; = <span class="math-frac"><span class="math-num">a + b</span><span class="math-den">2</span></span>
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                &sigma;<sup>2</sup> = <span class="math-frac"><span class="math-num">(b &minus; a)<sup>2</sup></span><span class="math-den">12</span></span>
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>When to Use It:</strong> Use this when any measurement within a continuous range <strong>[a, b]</strong> has an equal probability density (e.g., waiting time for a bus that arrives every 10 minutes).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">⏳ Worked Example: Loading Screen Duration</div>
                            <p class="prob-scenario-desc">A loading screen takes between <strong>a = 0</strong> and <strong>b = 10</strong> seconds uniformly.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Density f(x): <span class="prob-step-calc">f(x) = 1 / (10 &minus; 0) = 1 / 10 = 0.10</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>Mean: <span class="prob-step-calc">&mu; = (0 + 10) / 2 = 5 seconds</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 3</span>
                                <div>
                                    Variance:
                                    <span class="prob-step-calc">&sigma;<sup>2</sup> = (10 &minus; 0)<sup>2</sup> / 12 = 100 / 12 &approx; 8.33 seconds<sup>2</sup></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 6. Normal Distribution -->
                    <div class="prob-card" data-cat="continuous">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">6</div>
                                <h3 class="prob-card-title">Normal Distribution N(&mu;, &sigma;<sup>2</sup>) (Continuous)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Continuous • Bell Curve</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('N(μ, σ²): 68% [μ±1σ], 95% [μ±2σ], 99.7% [μ±3σ]', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Mean = &mu; &nbsp;&nbsp;|&nbsp;&nbsp; Variance = &sigma;<sup>2</sup> &nbsp;&nbsp;|&nbsp;&nbsp; Std Dev (&sigma;) = &radic;&sigma;<sup>2</sup>
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>When to Use It:</strong> Use this for continuous real-world data that clusters symmetrically around a central average with bell-curve spread (e.g., heights, test scores, measurement errors).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🌿 Worked Example: Plant Heights Following N(50, 16)</div>
                            <p class="prob-scenario-desc">Plant heights follow <strong>N(50, 16)</strong>, where mean <strong>&mu; = 50</strong> and variance <strong>&sigma;<sup>2</sup> = 16</strong> (&sigma; = &radic;16 = 4).</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">68% Range</span>
                                <div><span class="prob-step-calc">[50 &minus; 4, 50 + 4] = [46, 54]</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">95% Range</span>
                                <div><span class="prob-step-calc">[50 &minus; 2(4), 50 + 2(4)] = [50 &minus; 8, 50 + 8] = [42, 58]</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">99.7% Range</span>
                                <div><span class="prob-step-calc">[50 &minus; 3(4), 50 + 3(4)] = [50 &minus; 12, 50 + 12] = [38, 62]</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 7. Student's t-Distribution -->
                    <div class="prob-card" data-cat="continuous">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">7</div>
                                <h3 class="prob-card-title">Student's t-Distribution (Continuous)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Continuous • Small Sample n &lt; 30</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('df k = n - 1, μ = 0, σ² = (s² * k)/(k - 2)', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Degrees of Freedom (k) = n &minus; 1 &nbsp;&nbsp;|&nbsp;&nbsp; &mu; = 0 &nbsp;&nbsp;|&nbsp;&nbsp; &sigma;<sup>2</sup> = <span class="math-frac"><span class="math-num">s<sup>2</sup> &sdot; k</span><span class="math-den">k &minus; 2</span></span> (for k &gt; 2)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>When to Use It:</strong> Use this when dealing with <strong>small sample sizes (n &lt; 30)</strong> where the population variance is unknown. It provides wider tails to handle greater estimation uncertainty.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🧪 Worked Example: Small Sample Test (n = 6)</div>
                            <p class="prob-scenario-desc">A test is run on a sample size of <strong>n = 6</strong> with standard scale <strong>s = 1</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Degrees of Freedom: <span class="prob-step-calc">k = 6 &minus; 1 = 5</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>Mean: <span class="prob-step-calc">&mu; = 0</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 3</span>
                                <div>
                                    Variance:
                                    <span class="prob-step-calc">&sigma;<sup>2</sup> = (1<sup>2</sup> &times; 5) / (5 &minus; 2) = 5 / 3 &approx; 1.67</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 8. Chi-Squared Distribution -->
                    <div class="prob-card" data-cat="continuous">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">8</div>
                                <h3 class="prob-card-title">Chi-Squared Distribution &chi;<sup>2</sup>(k) (Continuous)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Continuous • Non-Negative x &ge; 0</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('μ = k, σ² = 2k', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Mean (&mu;) = k &nbsp;&nbsp;|&nbsp;&nbsp; Variance (&sigma;<sup>2</sup>) = 2k
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>When to Use It:</strong> Use this for hypothesis testing (goodness-of-fit tests, test of independence) and variance modeling. Values are strictly non-negative (x &ge; 0).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">📊 Worked Example: Chi-Squared Test with k = 8</div>
                            <p class="prob-scenario-desc">A Chi-Squared test statistic has <strong>k = 8</strong> degrees of freedom.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Mean: <span class="prob-step-calc">&mu; = k = 8</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>Variance: <span class="prob-step-calc">&sigma;<sup>2</sup> = 2 &times; 8 = 16</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 9. Exponential Distribution -->
                    <div class="prob-card" data-cat="continuous">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">9</div>
                                <h3 class="prob-card-title">Exponential Distribution (Continuous)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Continuous • Time Between Events</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('μ = 1/λ, σ² = 1/λ²', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Mean (&mu;) = <span class="math-frac"><span class="math-num">1</span><span class="math-den">&lambda;</span></span>
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                Variance (&sigma;<sup>2</sup>) = <span class="math-frac"><span class="math-num">1</span><span class="math-den">&lambda;<sup>2</sup></span></span>
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>When to Use It:</strong> Use this to model the <strong>continuous time elapsed between independent Poisson events</strong> (e.g., time until the next machine breakdown, battery lifetime).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">⚙️ Worked Example: Machine Failure Rate</div>
                            <p class="prob-scenario-desc">A machine fails at a rate of <strong>&lambda; = 0.5</strong> failures per month.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Mean time until next failure: <span class="prob-step-calc">&mu; = 1 / 0.5 = 2 months</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>Variance: <span class="prob-step-calc">&sigma;<sup>2</sup> = 1 / (0.5)<sup>2</sup> = 1 / 0.25 = 4 months<sup>2</sup></span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 10. Logistic Distribution -->
                    <div class="prob-card" data-cat="continuous">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">10</div>
                                <h3 class="prob-card-title">Logistic Distribution (Continuous)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Continuous • S-Curve / Heavy Tails</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Mean = μ, σ² = (s² * π²) / 3', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Mean = &mu;
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                Variance (&sigma;<sup>2</sup>) = <span class="math-frac"><span class="math-num">s<sup>2</sup> &sdot; &pi;<sup>2</sup></span><span class="math-den">3</span></span> (&pi;<sup>2</sup> &approx; 9.8696)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>When to Use It:</strong> Use this in classification tasks (like Logistic Regression) where probabilities form an S-shaped sigmoid curve, especially when data has heavier tails than a normal distribution.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">📈 Worked Example: Logistic Model Variance</div>
                            <p class="prob-scenario-desc">A logistic model has location <strong>&mu; = 2</strong> and scale parameter <strong>s = 1</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Mean: <span class="prob-step-calc">&mu; = 2</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>
                                    Variance:
                                    <span class="prob-step-calc">&sigma;<sup>2</sup> = (1<sup>2</sup> &times; 9.8696) / 3 = 9.8696 / 3 &approx; 3.29</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 11. PDF f(x) & Exact Probability P(X = x) = 0 -->
                    <div class="prob-card" data-cat="concepts">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">11</div>
                                <h3 class="prob-card-title">PDF f(x) &amp; Exact Value P(X = x) = 0</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Continuous Concept</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Total Area = 1.0, P(X = x) = 0', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Total Area Under Curve = 1.00 &nbsp;&nbsp;|&nbsp;&nbsp; P(X = exact point) = 0
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Core Concept:</strong> For continuous variables, <strong>f(x) represents the height (density)</strong>. The total area under the entire curve always equals 1. The probability of landing on an exact single continuous value is <strong>always zero (P(X = x) = 0)</strong> because an exact point has zero width.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">📏 Worked Example: Continuous Uniform Variable [0, 10]</div>
                            <p class="prob-scenario-desc">Spread evenly between 0 and 10 seconds, giving density <strong>f(x) = 0.10</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Total Area</span>
                                <div><span class="prob-step-calc">Area = width &times; height = 10 &times; 0.10 = 1.00</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Exact Point</span>
                                <div>Probability of finishing at exactly 5.00000...s: <span class="prob-step-calc">P(X = 5) = 0</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 12. Cumulative Distribution Function CDF F(x) -->
                    <div class="prob-card" data-cat="concepts">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">12</div>
                                <h3 class="prob-card-title">Cumulative Distribution Function (CDF) F(x)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Accumulated Probability</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('F(x) = P(X <= x)', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                F(x) = P(X &le; x)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Core Concept:</strong> <strong>F(x)</strong> measures the accumulated probability from the very beginning up to a specific cutoff value <strong>x</strong>.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🔋 Worked Example: Battery Lifetime CDF</div>
                            <p class="prob-scenario-desc">A battery life model has a CDF where <strong>F(50) = 0.70</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Calculation</span>
                                <div><span class="prob-step-calc">P(X &le; 50) = 0.70 (70%)</span></div>
                            </div>
                            <div class="prob-check-badge">
                                💡 Meaning: There is a 70% probability that a battery will last 50 hours or fewer.
                            </div>
                        </div>
                    </div>

                    <!-- 13. Interval Probability P(A <= X <= B) -->
                    <div class="prob-card" data-cat="concepts">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">13</div>
                                <h3 class="prob-card-title">Interval Probability: P(A &le; X &le; B)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Between A and B</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(A <= X <= B) = F(B) - F(A)', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                P(A &le; X &le; B) = F(B) &minus; F(A)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Core Concept:</strong> To find the probability of a value falling between A and B, subtract the lower cumulative probability <strong>F(A)</strong> from the upper cumulative probability <strong>F(B)</strong>.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">⏱️ Worked Example: Wait Time Interval</div>
                            <p class="prob-scenario-desc">A customer service wait time has cumulative values <strong>F(10) = 0.85</strong> and <strong>F(3) = 0.25</strong>. Find probability of waiting between 3 and 10 minutes.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Given: <span class="prob-step-calc">F(B) = F(10) = 0.85</span> and <span class="prob-step-calc">F(A) = F(3) = 0.25</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>
                                    Subtract:
                                    <div class="prob-math-display" style="padding:8px 12px; margin:3px 0;">
                                        <div class="prob-math-inline-block">
                                            P(3 &le; X &le; 10) = 0.85 &minus; 0.25 = 0.60 (60%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 14. Empirical Rule: 1σ (68.27%) -->
                    <div class="prob-card" data-cat="empirical">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">14</div>
                                <h3 class="prob-card-title">Empirical Rule: &mu; &plusmn; 1&sigma; (68.27%)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">68% Rule</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('[μ - 1σ, μ + 1σ] = 68.27%', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                [ &mu; &minus; 1&sigma; , &mu; + 1&sigma; ] &implies; 68.27% of Data
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Core Concept:</strong> In any normal distribution, approximately <strong>68.27%</strong> of all observed values fall within <strong>1 standard deviation</strong> from the mean.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">📝 Worked Example: Exam Scores (&mu; = 100, &sigma; = 15)</div>
                            <p class="prob-scenario-desc">A test has Mean <strong>&mu; = 100</strong> and Standard Deviation <strong>&sigma; = 15</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Lower Limit</span>
                                <div><span class="prob-step-calc">100 &minus; 15 = 85</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Upper Limit</span>
                                <div><span class="prob-step-calc">100 + 15 = 115</span></div>
                            </div>
                            <div class="prob-check-badge">
                                ✅ Result: 68.27% of all student scores fall between 85 and 115.
                            </div>
                        </div>
                    </div>

                    <!-- 15. Empirical Rule: 2σ (95.45%) -->
                    <div class="prob-card" data-cat="empirical">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">15</div>
                                <h3 class="prob-card-title">Empirical Rule: &mu; &plusmn; 2&sigma; (95.45%)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">95% Rule</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('[μ - 2σ, μ + 2σ] = 95.45%', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                [ &mu; &minus; 2&sigma; , &mu; + 2&sigma; ] &implies; 95.45% of Data
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Core Concept:</strong> In any normal distribution, approximately <strong>95.45%</strong> of all observed values fall within <strong>2 standard deviations</strong> from the mean.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">📝 Worked Example: Exam Scores (&mu; = 100, &sigma; = 15)</div>
                            <p class="prob-scenario-desc">Using Mean <strong>&mu; = 100</strong> and Standard Deviation <strong>&sigma; = 15</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Lower Limit</span>
                                <div><span class="prob-step-calc">100 &minus; 2(15) = 100 &minus; 30 = 70</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Upper Limit</span>
                                <div><span class="prob-step-calc">100 + 2(15) = 100 + 30 = 130</span></div>
                            </div>
                            <div class="prob-check-badge">
                                ✅ Result: 95.45% of all student scores fall between 70 and 130.
                            </div>
                        </div>
                    </div>

                    <!-- 16. Empirical Rule: 3σ (99.73% & Outliers) -->
                    <div class="prob-card" data-cat="empirical">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">16</div>
                                <h3 class="prob-card-title">Empirical Rule: &mu; &plusmn; 3&sigma; (99.73% &amp; Outliers)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">99.7% &amp; Outlier Detection</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('[μ - 3σ, μ + 3σ] = 99.73%', this)">📋 Copy Formula</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                [ &mu; &minus; 3&sigma; , &mu; + 3&sigma; ] &implies; 99.73% of Data &nbsp;|&nbsp; Outside = Outlier
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Core Concept:</strong> In a normal distribution, <strong>99.73%</strong> of data falls within 3 standard deviations. Any observation falling outside this range (<strong>&gt; 3&sigma; away from the mean</strong>) is mathematically flagged as an <strong>outlier</strong>.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎯 Worked Example: Exam Scores &amp; Outlier Check</div>
                            <p class="prob-scenario-desc">Using Mean <strong>&mu; = 100</strong> and Standard Deviation <strong>&sigma; = 15</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Lower Limit</span>
                                <div><span class="prob-step-calc">100 &minus; 3(15) = 100 &minus; 45 = 55</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Upper Limit</span>
                                <div><span class="prob-step-calc">100 + 3(15) = 100 + 45 = 145</span></div>
                            </div>
                            <div class="prob-check-badge" style="background:rgba(239, 68, 68, 0.14); color:#ef4444; border-color:rgba(239, 68, 68, 0.35);">
                                🚨 Outlier Check: A score of 150 is greater than 145 (3&sigma;), making it an Outlier!
                            </div>
                        </div>
                    </div>

                <div id="dist-no-results" style="display:none; text-align:center; padding:40px 20px; color:var(--text-muted-color);">
                    <span style="font-size:2rem;">🔍</span>
                    <p style="margin:8px 0 0 0; font-weight:600;">No matching distribution formulas found.</p>
                    <p style="margin:4px 0 0 0; font-size:0.85rem;">Try adjusting your search terms or selecting 'All Topics'.</p>
                </div>
            </div>
        </div>
    </div>`;
        document.body.appendChild(wrapper.firstElementChild);
        overlay = document.getElementById('distributions-examples-modal-overlay');
    }

    if (overlay) {
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const searchInput = document.getElementById('dist-examples-search');
            if (searchInput) searchInput.focus();
        }, 100);
    }
};

window.closeDistributionsExamplesModal = function() {
    const overlay = document.getElementById('distributions-examples-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
};

window.filterDistributionsExamples = function() {
    const query = (document.getElementById('dist-examples-search')?.value || '').toLowerCase().trim();
    const activeChip = document.querySelector('#distributions-examples-modal-overlay .prob-chip.active');
    const activeCat = activeChip ? activeChip.getAttribute('data-cat') || 'all' : 'all';

    const cards = document.querySelectorAll('#distributions-examples-modal-overlay .prob-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const cat = card.getAttribute('data-cat') || 'all';

        const matchesQuery = !query || text.includes(query);
        const matchesCat = activeCat === 'all' || cat.includes(activeCat);

        if (matchesQuery && matchesCat) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const noResults = document.getElementById('dist-no-results');
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
};

window.filterDistCategory = function(category, btn) {
    document.querySelectorAll('#distributions-examples-modal-overlay .prob-chip').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    window.filterDistributionsExamples();
};

// Keyboard & Click backdrop listener for Distributions modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const overlay = document.getElementById('distributions-examples-modal-overlay');
        if (overlay && overlay.classList.contains('active')) {
            window.closeDistributionsExamplesModal();
        }
    }
});

document.addEventListener('click', (e) => {
    const overlay = document.getElementById('distributions-examples-modal-overlay');
    if (overlay && e.target === overlay) {
        window.closeDistributionsExamplesModal();
    }
});


// ============================================================================
// SETS, EVENTS & BAYESIAN INFERENCE WORKED EXAMPLES MODAL CONTROLLER
// ============================================================================
window.openBayesianExamplesModal = function() {
    let overlay = document.getElementById('bayesian-examples-modal-overlay');
    if (!overlay) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `    <!-- SETS, EVENTS & BAYESIAN INFERENCE WORKED EXAMPLES MODAL (DISPLAY MATH) -->
    <div id="bayesian-examples-modal-overlay" class="prob-modal-overlay" aria-hidden="true">
        <div class="prob-modal-box">
            <!-- Header -->
            <div class="prob-modal-header">
                <div>
                    <div class="prob-modal-badge">Data Mining • Prelim Reference</div>
                    <h2 class="prob-modal-title">📐 Sets, Events &amp; Bayesian Inference Formulas &amp; Worked Examples</h2>
                    <p class="prob-modal-subtitle">20 Comprehensive mathematical references with clean Display Math calculations, set notation, probability rules, and Bayes' Theorem.</p>
                </div>
                <div class="prob-modal-actions-right"><button class="prob-modal-btn-icon" onclick="window.toggleModalFullscreen(this)" title="Toggle Fullscreen Window">&#x26F6;</button><button class="prob-modal-btn-icon close-btn" onclick="window.closeBayesianExamplesModal()" title="Close">&times;</button></div>
            </div>

            <!-- Toolbar: Search & Category Chips -->
            <div class="prob-modal-toolbar">
                <div class="prob-search-wrap">
                    <span class="prob-search-icon">🔍</span>
                    <input type="text" id="bayes-examples-search" class="prob-search-input" placeholder="Search set rules or Bayes (e.g., Intersection, Union, Subset, Conditional, Bayes Rule, Odds)..." oninput="window.filterBayesianExamples()">
                </div>
                <div class="prob-category-chips">
                    <button class="prob-chip active" data-cat="all" onclick="window.filterBayesCategory('all', this)">All Topics (20)</button>
                    <button class="prob-chip" data-cat="symbols" onclick="window.filterBayesCategory('symbols', this)">Set Symbols &amp; Notation (6)</button>
                    <button class="prob-chip" data-cat="events" onclick="window.filterBayesCategory('events', this)">Combining Events &amp; Sets (5)</button>
                    <button class="prob-chip" data-cat="rules" onclick="window.filterBayesCategory('rules', this)">Probability Laws &amp; Rules (5)</button>
                    <button class="prob-chip" data-cat="bayes" onclick="window.filterBayesCategory('bayes', this)">Bayesian Inference &amp; Odds (4)</button>
                </div>
            </div>

            <!-- Scrollable Content -->
            <div class="prob-modal-content" id="bayes-examples-list">

                    <!-- 1. x in A -->
                    <div class="prob-card" data-cat="symbols">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">1</div>
                                <h3 class="prob-card-title">Element Of: x &isin; A</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Set Notation</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('x ∈ A (x is an element of A)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">x &isin; A &nbsp;&implies;&nbsp; x is an element of set A</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> The value <strong>x belongs to set A</strong> (it is one of the members inside the set).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🔢 Worked Example</div>
                            <p class="prob-scenario-desc">Let Set <strong>A = {2, 4, 6, 8}</strong>. Since the number 4 is inside the set:</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Result</span>
                                <div><span class="prob-step-calc">4 &isin; A &nbsp;(True)</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. x not in A -->
                    <div class="prob-card" data-cat="symbols">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">2</div>
                                <h3 class="prob-card-title">Not An Element Of: x &notin; A</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Set Notation</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('x ∉ A (x is not an element of A)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">x &notin; A &nbsp;&implies;&nbsp; x does not belong to set A</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> The value <strong>x does not belong to set A</strong> (it is absent from the set).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🔢 Worked Example</div>
                            <p class="prob-scenario-desc">Using Set <strong>A = {2, 4, 6, 8}</strong>, the number 5 is not inside the set:</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Result</span>
                                <div><span class="prob-step-calc">5 &notin; A &nbsp;(True)</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Universal Quantifier: For All (∀) -->
                    <div class="prob-card" data-cat="symbols">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">3</div>
                                <h3 class="prob-card-title">Universal Quantifier: &forall; (For All)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Logical Quantifier</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('∀x ∈ A (For all elements x in A)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">&forall; x &isin; A &nbsp;&implies;&nbsp; For all x belonging to set A</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> A condition or property applies to <strong>every single item</strong> contained in the set.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🔢 Worked Example</div>
                            <p class="prob-scenario-desc">For Set <strong>A = {2, 4, 6}</strong>:</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Statement</span>
                                <div><span class="prob-step-calc">&forall; x &isin; A, x is an even number</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 4. Colon: Such That (:) -->
                    <div class="prob-card" data-cat="symbols">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">4</div>
                                <h3 class="prob-card-title">Set-Builder Notation: : (Such That)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Set Definition</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('{x : condition}', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">{ x : condition(x) } &nbsp;&implies;&nbsp; Set of all x such that condition holds</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Introduces a defining rule, property, or filter constraint for members of the set.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🔢 Worked Example: Numbers Greater Than 3</div>
                            <p class="prob-scenario-desc">Defining Set B of all real numbers strictly greater than 3:</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Set Builder</span>
                                <div><span class="prob-step-calc">B = { x : x &gt; 3 }</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 5. Subset: A ⊆ B -->
                    <div class="prob-card" data-cat="symbols">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">5</div>
                                <h3 class="prob-card-title">Subset: A &sube; B</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Set Relation</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('A ⊆ B (A is a subset of B)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">A &sube; B &nbsp;&implies;&nbsp; Every element of A is also in B</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Every single element in set A is also found inside set B.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🔢 Worked Example</div>
                            <p class="prob-scenario-desc">Let <strong>A = {2, 4}</strong> and <strong>B = {1, 2, 3, 4, 5}</strong>. Since both 2 and 4 are inside B:</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Result</span>
                                <div><span class="prob-step-calc">A &sube; B &nbsp;(True)</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 6. Empty Set: ∅ -->
                    <div class="prob-card" data-cat="symbols">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">6</div>
                                <h3 class="prob-card-title">Empty / Null Set: &empty;</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Zero Elements</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('∅ = {}', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">&empty; = { } &nbsp;&implies;&nbsp; Set with zero elements (Size = 0)</div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> A set that contains <strong>zero elements</strong> (impossible outcome set).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎲 Worked Example</div>
                            <p class="prob-scenario-desc">Rolling a standard 6-sided die {1, 2, 3, 4, 5, 6} and getting a number greater than 6:</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Outcomes</span>
                                <div><span class="prob-step-calc">Outcomes = &empty;</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 7. Intersection (A ∩ B) & Joint Probability -->
                    <div class="prob-card" data-cat="events">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">7</div>
                                <h3 class="prob-card-title">Intersection (A &cap; B) &amp; Joint Probability</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Both Occur Simultaneously</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('A ∩ B, P(A ∩ B) = n(A ∩ B) / n(S)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                A &cap; B = { x : x &isin; A and x &isin; B } &nbsp;&nbsp;|&nbsp;&nbsp; P(A &cap; B) = <span class="math-frac"><span class="math-num">n(A &cap; B)</span><span class="math-den">n(S)</span></span>
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Definition:</strong> Elements belonging to <strong>both set A and set B</strong> at the same time.<br>
                            <strong>Probability Meaning:</strong> Joint Probability <strong>P(A &cap; B)</strong> &mdash; the chance that both events occur simultaneously.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎲 Worked Example: Rolling a 6-Sided Die</div>
                            <p class="prob-scenario-desc">Sample Space <strong>S = {1, 2, 3, 4, 5, 6}</strong>.<br>
                            • Event A (Even numbers): <strong>A = {2, 4, 6}</strong><br>
                            • Event B (Numbers &ge; 4): <strong>B = {4, 5, 6}</strong></p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Set Elements</span>
                                <div><span class="prob-step-calc">A &cap; B = {4, 6} &nbsp;(2 elements)</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Probability</span>
                                <div>
                                    <div class="prob-math-display" style="padding:8px 12px; margin:3px 0;">
                                        <div class="prob-math-inline-block">
                                            P(A &cap; B) = <span class="math-frac"><span class="math-num">2 favorable</span><span class="math-den">6 total</span></span> = <span class="math-frac"><span class="math-num">2</span><span class="math-den">6</span></span> = <span class="math-frac"><span class="math-num">1</span><span class="math-den">3</span></span> &approx; 0.333 (33.3%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 8. Union (A ∪ B) & Combined Probability -->
                    <div class="prob-card" data-cat="events">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">8</div>
                                <h3 class="prob-card-title">Union (A &cup; B) &amp; Combined Probability</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Either or Both Occur</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('A ∪ B = A + B - (A ∩ B)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                A &cup; B = { x : x &isin; A or x &isin; B } &nbsp;&nbsp;|&nbsp;&nbsp; n(A &cup; B) = n(A) + n(B) &minus; n(A &cap; B)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Definition:</strong> Elements belonging to <strong>set A, set B, or both</strong>.<br>
                            <strong>Probability Meaning:</strong> Combined Probability <strong>P(A &cup; B)</strong> &mdash; the chance that at least one of the events happens.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎲 Worked Example: Rolling a 6-Sided Die</div>
                            <p class="prob-scenario-desc">Using <strong>A = {2, 4, 6}</strong> and <strong>B = {4, 5, 6}</strong> (overlap {4, 6}):</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Union Set</span>
                                <div><span class="prob-step-calc">A &cup; B = {2, 4, 5, 6} &nbsp;(4 unique elements)</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Formula Check</span>
                                <div><span class="prob-step-calc">n(A &cup; B) = 3 + 3 &minus; 2 = 4</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Probability</span>
                                <div>
                                    <div class="prob-math-display" style="padding:8px 12px; margin:3px 0;">
                                        <div class="prob-math-inline-block">
                                            P(A &cup; B) = <span class="math-frac"><span class="math-num">4 favorable</span><span class="math-den">6 total</span></span> = <span class="math-frac"><span class="math-num">4</span><span class="math-den">6</span></span> = <span class="math-frac"><span class="math-num">2</span><span class="math-den">3</span></span> &approx; 0.667 (66.7%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 9. Complement (A' or A^c) -->
                    <div class="prob-card" data-cat="events">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">9</div>
                                <h3 class="prob-card-title">Complement (A' or A<sup>c</sup>)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Opposite Outcome</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(A') = 1 - P(A)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                A' = S &minus; A &nbsp;&nbsp;|&nbsp;&nbsp; P(A') = 1 &minus; P(A)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Definition:</strong> All elements in the sample space S that are <strong>not in set A</strong>.<br>
                            <strong>Probability Meaning:</strong> Probability of event A <strong>not occurring</strong>.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎲 Worked Example: Rolling a 6 on a Die</div>
                            <p class="prob-scenario-desc">Event A (Rolling a 6): <strong>A = {6}</strong>, so <strong>P(A) = 1/6</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Complement Set</span>
                                <div><span class="prob-step-calc">A' = {1, 2, 3, 4, 5}</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Probability</span>
                                <div>
                                    <div class="prob-math-display" style="padding:8px 12px; margin:3px 0;">
                                        <div class="prob-math-inline-block">
                                            P(A') = 1 &minus; <span class="math-frac"><span class="math-num">1</span><span class="math-den">6</span></span> = <span class="math-frac"><span class="math-num">5</span><span class="math-den">6</span></span> &approx; 0.833 (83.3%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 10. Subset & Event Implication -->
                    <div class="prob-card" data-cat="events">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">10</div>
                                <h3 class="prob-card-title">Subset &amp; Event Implication (A &sube; B)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">A Implies B</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('A ⊆ B => P(A) <= P(B)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                A &sube; B &nbsp;&implies;&nbsp; Occurrence of A guarantees occurrence of B
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Definition:</strong> Every element of set A is contained within set B.<br>
                            <strong>Probability Meaning:</strong> Event A <strong>implies</strong> Event B. (If event A occurs, event B has definitely occurred as well).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎲 Worked Example: Rolling a 6 vs Even Number</div>
                            <p class="prob-scenario-desc">Event A (Rolling a 6): <strong>{6}</strong>. Event B (Rolling an Even): <strong>{2, 4, 6}</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Verification</span>
                                <div><span class="prob-step-calc">{6} &sube; {2, 4, 6} &implies; A &sube; B</span></div>
                            </div>
                            <div class="prob-check-badge">
                                💡 Implication: Rolling a 6 automatically guarantees that you rolled an even number!
                            </div>
                        </div>
                    </div>

                    <!-- 11. Mutually Exclusive Events -->
                    <div class="prob-card" data-cat="events">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">11</div>
                                <h3 class="prob-card-title">Mutually Exclusive Events (A &cap; B = &empty;)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Disjoint Events</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('A ∩ B = ∅, P(A ∩ B) = 0', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                A &cap; B = &empty; &nbsp;&nbsp;|&nbsp;&nbsp; P(A &cap; B) = 0
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Two events <strong>cannot happen at the exact same time</strong> because they share zero common outcomes.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎲 Worked Example: Odd vs Even Die Rolls</div>
                            <p class="prob-scenario-desc">Event A (Odd): <strong>{1, 3, 5}</strong>. Event B (Even): <strong>{2, 4, 6}</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Result</span>
                                <div><span class="prob-step-calc">A &cap; B = &empty; &nbsp;(Mutually Exclusive)</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 12. Conditional Probability -->
                    <div class="prob-card" data-cat="rules">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">12</div>
                                <h3 class="prob-card-title">Conditional Probability: P(A | B)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Given B Occurred</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(A | B) = P(A ∩ B) / P(B)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                P(A | B) = <span class="math-frac"><span class="math-num">P(A &cap; B)</span><span class="math-den">P(B)</span></span>
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> The probability that event A occurs <strong>given that event B has already occurred</strong>.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🃏 Worked Example: Drawing a King Given a Face Card</div>
                            <p class="prob-scenario-desc">In a standard 52-card deck: Total Face cards <strong>P(B) = 12/52</strong>. Cards that are both King and Face card: <strong>P(A &cap; B) = 4/52</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Calculation</span>
                                <div>
                                    <div class="prob-math-display" style="padding:8px 12px; margin:3px 0;">
                                        <div class="prob-math-inline-block">
                                            P(A | B) = <span class="math-frac"><span class="math-num">4/52</span><span class="math-den">12/52</span></span> = <span class="math-frac"><span class="math-num">4</span><span class="math-den">12</span></span> = <span class="math-frac"><span class="math-num">1</span><span class="math-den">3</span></span> &approx; 0.333 (33.3%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 13. Multiplication Rule -->
                    <div class="prob-card" data-cat="rules">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">13</div>
                                <h3 class="prob-card-title">Multiplication Rule: P(A &cap; B)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Joint Occurrence</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(A ∩ B) = P(A | B) × P(B)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                P(A &cap; B) = P(A | B) &times; P(B)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Used to compute the joint probability of both events by multiplying the conditional probability by the prior condition probability.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🛍️ Worked Example: Store Visits &amp; Purchases</div>
                            <p class="prob-scenario-desc">If <strong>40%</strong> of users visit a store (P(B) = 0.40), and of those visitors, <strong>50%</strong> make a purchase (P(A | B) = 0.50):</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Calculation</span>
                                <div><span class="prob-step-calc">P(A &cap; B) = 0.50 &times; 0.40 = 0.20 (20%)</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 14. Additive Law -->
                    <div class="prob-card" data-cat="rules">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">14</div>
                                <h3 class="prob-card-title">Additive Law: P(A &cup; B)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Union Probability</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(A ∪ B) = P(A) + P(B) - P(A ∩ B)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                P(A &cup; B) = P(A) + P(B) &minus; P(A &cap; B)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Adds individual probabilities and subtracts the intersection to avoid double-counting.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🏅 Worked Example: Sports &amp; Music Participation</div>
                            <p class="prob-scenario-desc">P(Sports) = 0.60, P(Music) = 0.50, and P(Both) = 0.30.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Calculation</span>
                                <div><span class="prob-step-calc">P(Sports &cup; Music) = 0.60 + 0.50 &minus; 0.30 = 0.80 (80%)</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 15. Law of Total Probability -->
                    <div class="prob-card" data-cat="rules">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">15</div>
                                <h3 class="prob-card-title">Law of Total Probability</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Partition Sum</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(A) = ∑ [P(A | B_i) * P(B_i)]', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                P(A) = &sum; [ P(A | B<sub>i</sub>) &sdot; P(B<sub>i</sub>) ]
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Calculates the total probability of event A across all mutually exclusive and exhaustive partitions B<sub>i</sub>.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🏭 Worked Example: Factory Assembly Lines Defect Rate</div>
                            <p class="prob-scenario-desc">Line 1 (B<sub>1</sub>): 60% of volume (P(B<sub>1</sub>)=0.60) with 2% defect rate (P(A|B<sub>1</sub>)=0.02).<br>
                            Line 2 (B<sub>2</sub>): 40% of volume (P(B<sub>2</sub>)=0.40) with 5% defect rate (P(A|B<sub>2</sub>)=0.05).</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Calculation</span>
                                <div>
                                    <div class="prob-math-display" style="padding:8px 12px; margin:3px 0;">
                                        <div class="prob-math-inline-block">
                                            P(Defect) = (0.02 &times; 0.60) + (0.05 &times; 0.40) = 0.012 + 0.020 = 0.032 (3.2%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 16. Independence Condition -->
                    <div class="prob-card" data-cat="rules">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">16</div>
                                <h3 class="prob-card-title">Independence Condition</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">No Mutual Influence</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(A | B) = P(A), P(A ∩ B) = P(A) * P(B)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                P(A | B) = P(A) &nbsp;&nbsp;|&nbsp;&nbsp; P(A &cap; B) = P(A) &times; P(B)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Events A and B are independent if knowing that B occurred does not change the probability of A.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🪙 Worked Example: Coin Flip &amp; Die Roll</div>
                            <p class="prob-scenario-desc">Flipping a coin (A = Heads, P(A) = 0.50) and rolling a die (B = 6, P(B) = 1/6 &approx; 0.1667).</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Calculation</span>
                                <div><span class="prob-step-calc">P(A &cap; B) = 0.50 &times; (1/6) = 1/12 &approx; 0.0833 (8.33%)</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 17. Bayes' Rule -->
                    <div class="prob-card" data-cat="bayes">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">17</div>
                                <h3 class="prob-card-title">Bayes' Rule (Posterior Probability)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Belief Update</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(H | E) = [P(E | H) * P(H)] / P(E)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                P(H | E) = <span class="math-frac"><span class="math-num">P(E | H) &sdot; P(H)</span><span class="math-den">P(E)</span></span>
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Updates the probability of hypothesis <strong>H</strong> after observing evidence <strong>E</strong> by multiplying the prior P(H) by the likelihood P(E|H) and dividing by marginal evidence P(E).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🩺 Worked Example: Medical Diagnostic Test</div>
                            <p class="prob-scenario-desc">Prior condition probability <strong>P(H) = 0.01</strong>. Test sensitivity <strong>P(E | H) = 0.90</strong>. Total positive test rate <strong>P(E) = 0.05</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 1</span>
                                <div>Numerator: <span class="prob-step-calc">P(E | H) &times; P(H) = 0.90 &times; 0.01 = 0.009</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Step 2</span>
                                <div>
                                    Divide by P(E):
                                    <div class="prob-math-display" style="padding:8px 12px; margin:3px 0;">
                                        <div class="prob-math-inline-block">
                                            P(H | E) = <span class="math-frac"><span class="math-num">0.009</span><span class="math-den">0.05</span></span> = 0.18 (18% Posterior Probability)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 18. Evidence P(E) Formula -->
                    <div class="prob-card" data-cat="bayes">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">18</div>
                                <h3 class="prob-card-title">Marginal Evidence Formula: P(E)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Total Evidence</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P(E) = ∑ [P(E | H_i) * P(H_i)]', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                P(E) = &sum; [ P(E | H<sub>i</sub>) &sdot; P(H<sub>i</sub>) ]
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Computes the total denominator probability of observing evidence E across all candidate hypotheses H<sub>i</sub>.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🧪 Worked Example: Disease vs Healthy Population Evidence</div>
                            <p class="prob-scenario-desc">Hypotheses: Has Disease (H<sub>1</sub> = 0.01, P(E|H<sub>1</sub>) = 0.90) and No Disease (H<sub>2</sub> = 0.99, P(E|H<sub>2</sub>) = 0.04 false positive).</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Calculation</span>
                                <div>
                                    <div class="prob-math-display" style="padding:8px 12px; margin:3px 0;">
                                        <div class="prob-math-inline-block">
                                            P(E) = (0.90 &times; 0.01) + (0.04 &times; 0.99) = 0.009 + 0.0396 = 0.0486 (4.86%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 19. Odds to Probability Formula -->
                    <div class="prob-card" data-cat="bayes">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">19</div>
                                <h3 class="prob-card-title">Odds to Probability Conversion</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Odds Conversion</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('P = Odds / (1 + Odds)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                P = <span class="math-frac"><span class="math-num">Odds</span><span class="math-den">1 + Odds</span></span>
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Converts betting / Bayesian odds into a normalized probability value between 0 and 1.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🎲 Worked Example: Odds of 3 (3 to 1)</div>
                            <p class="prob-scenario-desc">The odds of an event occurring are <strong>3</strong> (meaning 3 to 1 in favor).</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Calculation</span>
                                <div>
                                    <div class="prob-math-display" style="padding:8px 12px; margin:3px 0;">
                                        <div class="prob-math-inline-block">
                                            P = <span class="math-frac"><span class="math-num">3</span><span class="math-den">1 + 3</span></span> = <span class="math-frac"><span class="math-num">3</span><span class="math-den">4</span></span> = 0.75 (75%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 20. Posterior Odds Formula -->
                    <div class="prob-card" data-cat="bayes">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">20</div>
                                <h3 class="prob-card-title">Posterior Odds &amp; Likelihood Ratio</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Bayesian Updating</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Posterior Odds = Prior Odds * Likelihood Ratio', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Posterior Odds = Prior Odds &times; Likelihood Ratio
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Meaning:</strong> Updates prior odds directly into posterior odds by scaling by the Likelihood Ratio (Bayes Factor).
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">⚖️ Worked Example: Odds Updating</div>
                            <p class="prob-scenario-desc">Prior Odds of an event are <strong>2</strong>, and new evidence provides a Likelihood Ratio of <strong>1.5</strong>.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Calculation</span>
                                <div><span class="prob-step-calc">Posterior Odds = 2 &times; 1.5 = 3 &nbsp;(3 to 1 Odds)</span></div>
                            </div>
                        </div>
                    </div>

                <div id="bayes-no-results" style="display:none; text-align:center; padding:40px 20px; color:var(--text-muted-color);">
                    <span style="font-size:2rem;">🔍</span>
                    <p style="margin:8px 0 0 0; font-weight:600;">No matching set or Bayesian formulas found.</p>
                    <p style="margin:4px 0 0 0; font-size:0.85rem;">Try adjusting your search terms or selecting 'All Topics'.</p>
                </div>
            </div>
        </div>
    </div>`;
        document.body.appendChild(wrapper.firstElementChild);
        overlay = document.getElementById('bayesian-examples-modal-overlay');
    }

    if (overlay) {
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const searchInput = document.getElementById('bayes-examples-search');
            if (searchInput) searchInput.focus();
        }, 100);
    }
};

window.closeBayesianExamplesModal = function() {
    const overlay = document.getElementById('bayesian-examples-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
};

window.filterBayesianExamples = function() {
    const query = (document.getElementById('bayes-examples-search')?.value || '').toLowerCase().trim();
    const activeChip = document.querySelector('#bayesian-examples-modal-overlay .prob-chip.active');
    const activeCat = activeChip ? activeChip.getAttribute('data-cat') || 'all' : 'all';

    const cards = document.querySelectorAll('#bayesian-examples-modal-overlay .prob-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const cat = card.getAttribute('data-cat') || 'all';

        const matchesQuery = !query || text.includes(query);
        const matchesCat = activeCat === 'all' || cat.includes(activeCat);

        if (matchesQuery && matchesCat) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const noResults = document.getElementById('bayes-no-results');
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
};

window.filterBayesCategory = function(category, btn) {
    document.querySelectorAll('#bayesian-examples-modal-overlay .prob-chip').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    window.filterBayesianExamples();
};

// Keyboard & Click backdrop listener for Bayesian modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const overlay = document.getElementById('bayesian-examples-modal-overlay');
        if (overlay && overlay.classList.contains('active')) {
            window.closeBayesianExamplesModal();
        }
    }
});

document.addEventListener('click', (e) => {
    const overlay = document.getElementById('bayesian-examples-modal-overlay');
    if (overlay && e.target === overlay) {
        window.closeBayesianExamplesModal();
    }
});


// ============================================================================
// TRADITIONAL DATA TECHNIQUES WORKED EXAMPLES MODAL CONTROLLER
// ============================================================================
window.openTraditionalExamplesModal = function() {
    let overlay = document.getElementById('traditional-examples-modal-overlay');
    if (!overlay) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `    <!-- TRADITIONAL DATA TECHNIQUES WORKED EXAMPLES MODAL (DISPLAY MATH) -->
    <div id="traditional-examples-modal-overlay" class="prob-modal-overlay" aria-hidden="true">
        <div class="prob-modal-box">
            <!-- Header -->
            <div class="prob-modal-header">
                <div>
                    <div class="prob-modal-badge">Data Mining • Prelim Reference</div>
                    <h2 class="prob-modal-title">💾 Traditional Data Techniques Formulas &amp; Worked Examples</h2>
                    <p class="prob-modal-subtitle">14 Comprehensive references with Data Pipelines, BI Metrics Hierarchy, Linear/Logistic Regression, and ML &amp; LLM Foundations.</p>
                </div>
                <div class="prob-modal-actions-right"><button class="prob-modal-btn-icon" onclick="window.toggleModalFullscreen(this)" title="Toggle Fullscreen Window">&#x26F6;</button><button class="prob-modal-btn-icon close-btn" onclick="window.closeTraditionalExamplesModal()" title="Close">&times;</button></div>
            </div>

            <!-- Toolbar: Search & Category Chips -->
            <div class="prob-modal-toolbar">
                <div class="prob-search-wrap">
                    <span class="prob-search-icon">🔍</span>
                    <input type="text" id="traditional-examples-search" class="prob-search-input" placeholder="Search techniques (e.g., Pre-processing, Imputation, BI Metrics, Regression, Clustering, LLM, GPT)..." oninput="window.filterTraditionalExamples()">
                </div>
                <div class="prob-category-chips">
                    <button class="prob-chip active" data-cat="all" onclick="window.filterTradCategory('all', this)">All Topics (14)</button>
                    <button class="prob-chip" data-cat="preprocess" onclick="window.filterTradCategory('preprocess', this)">Pre-Processing &amp; Cleansing (6)</button>
                    <button class="prob-chip" data-cat="bi" onclick="window.filterTradCategory('bi', this)">BI Metrics Hierarchy (1)</button>
                    <button class="prob-chip" data-cat="predictive" onclick="window.filterTradCategory('predictive', this)">Regression &amp; Predictive Models (4)</button>
                    <button class="prob-chip" data-cat="ml" onclick="window.filterTradCategory('ml', this)">ML Foundations &amp; LLMs (3)</button>
                </div>
            </div>

            <!-- Scrollable Content -->
            <div class="prob-modal-content" id="traditional-examples-list">

                    <!-- 1. The Data Pipeline -->
                    <div class="prob-card" data-cat="preprocess">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">1</div>
                                <h3 class="prob-card-title">The 4-Step Data Pipeline</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Data Flow</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Raw Data -> Pre-Processing -> Processing -> Information', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Raw Data &nbsp;&xrarr;&nbsp; Pre-Processing &nbsp;&xrarr;&nbsp; Processing &nbsp;&xrarr;&nbsp; Information
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Concept:</strong> The fundamental 4-step journey raw numerical values and logs take to become actionable, high-value business decisions.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🏪 Worked Example: Retail Store Hourly Sales Flow</div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">1. Raw Data</span>
                                <div>A store database records <strong>10,000 messy transaction logs</strong> with missing timestamps and duplicate entries.</div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">2. Pre-Process</span>
                                <div>An automated script <strong>removes duplicate sales</strong> and fills in blank product categories.</div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">3. Processing</span>
                                <div>An analytical algorithm <strong>calculates total sales</strong> for every single hour of the day.</div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">4. Information</span>
                                <div>A final executive report reveals <strong>70% of sales occur between 5 PM &amp; 8 PM</strong>, prompting management to add cashier shifts during peak hours.</div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Raw Data: Manual vs Automatic -->
                    <div class="prob-card" data-cat="preprocess">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">2</div>
                                <h3 class="prob-card-title">Raw Data: Manual vs. Automatic Collection</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Data Ingestion</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Manual (High Control, Prone to Human Error) vs Automatic (High Volume, Needs Bot Filter)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Untouched Source Data &nbsp;&bull;&nbsp; Manual vs. Automated Telemetry
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Concept:</strong> <strong>Raw Data</strong> is completely untouched data directly from the source before any cleaning, restructuring, or formatting occurs.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">📋 Comparison Walkthrough</div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Manual</span>
                                <div>
                                    <strong>Clinic Paper Survey:</strong> High control over questions asked, but slow to gather and prone to human handwriting/entry errors.
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Automatic</span>
                                <div>
                                    <strong>Server Web Logs / Cookies / IP Telemetry:</strong> High volume and instantaneous, but requires heavy cleaning to filter out web bot &amp; crawler traffic.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Class Labeling: The Arithmetic Test -->
                    <div class="prob-card" data-cat="preprocess">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">3</div>
                                <h3 class="prob-card-title">Class Labeling: The Arithmetic Test</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Data Types</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Arithmetic Meaningful => Numerical | Arithmetic Meaningless => Categorical', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Arithmetic Meaningful &rArr; Numerical &nbsp;&nbsp;|&nbsp;&nbsp; Arithmetic Meaningless &rArr; Categorical
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>The Rule:</strong> If computing an average or performing arithmetic makes logical real-world sense &implies; <strong>Numerical</strong>. If arithmetic is meaningless &implies; <strong>Categorical</strong>.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">⚖️ Two Classification Tests</div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Numerical</span>
                                <div>
                                    <strong>Support Complaints:</strong> User A files 3 complaints; User B files 5 complaints.<br>
                                    Average complaints = <span class="prob-step-calc">(3 + 5) / 2 = 4</span>.<br>
                                    &check; The average is meaningful &rArr; <strong>Numerical Data</strong>.
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Categorical</span>
                                <div>
                                    <strong>Customer ID / Zip Code:</strong> Customer A is ID 1001; Customer B is ID 1003.<br>
                                    Average ID = <span class="prob-step-calc">(1001 + 1003) / 2 = 1002</span>.<br>
                                    &cross; Customer 1002 is an unrelated third party &rArr; Math is meaningless &rArr; <strong>Categorical Data</strong>.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 4. Data Cleansing & Missing Values -->
                    <div class="prob-card" data-cat="preprocess">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">4</div>
                                <h3 class="prob-card-title">Data Cleansing &amp; Missing Values (NaN)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Imputation vs Deletion</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Deletion: remove row | Imputation: Mean = sum(valid)/n', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Given Dataset: [ 20, 22, 24, NaN ]
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Concept:</strong> Systematic strategies for handling corrupted entries, missing telemetry, or blank cells (NaN) in a dataset.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🛠️ Two Treatment Strategies</div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Option A</span>
                                <div>
                                    <strong>Disregard Record Entirely (Row Deletion):</strong> Delete row with NaN.<br>
                                    <span class="prob-step-calc">Result Dataset = [ 20, 22, 24 ]</span>
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Option B</span>
                                <div>
                                    <strong>Imputation (Mean Substitution):</strong> Calculate average of valid entries:<br>
                                    <span class="prob-step-calc">Mean = (20 + 22 + 24) / 3 = 66 / 3 = 22</span><br>
                                    Replace NaN with 22 &rArr; <span class="prob-step-calc">Result Dataset = [ 20, 22, 24, 22 ]</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 5. Balancing & Shuffling -->
                    <div class="prob-card" data-cat="preprocess">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">5</div>
                                <h3 class="prob-card-title">Balancing &amp; Shuffling Techniques</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Data Preparation</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Balancing: 50/50 ratio | Shuffling: Randomize row order', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Class Balancing (Resampling) &nbsp;&bull;&nbsp; Row Shuffling (Permutation)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Purpose:</strong> Prevent algorithmic bias and prevent models from memorizing sequential order during training batches.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">⚖️ Walkthrough Examples</div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Balancing</span>
                                <div>
                                    <strong>Credit Card Fraud:</strong> 990 legit vs 10 fraud. Unbalanced model guesses "Legit" 100% of the time (99% accuracy but 0 fraud caught!).<br>
                                    &bull; <strong>Fix:</strong> Resample to 500 legit / 500 fraud (50/50 ratio) so both classes are learned equally.
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Shuffling</span>
                                <div>
                                    <strong>Loan Approvals:</strong> Dataset has all "Approved" rows at top and all "Denied" rows at bottom.<br>
                                    &bull; <strong>Fix:</strong> Randomize row order so any batch sampled during training contains an even mixture.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 6. Big Data Expansions: Masking & NLP -->
                    <div class="prob-card" data-cat="preprocess">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">6</div>
                                <h3 class="prob-card-title">Big Data Expansions: Masking &amp; Text Mining</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Security &amp; NLP</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Data Masking: PII Protection | Text Mining: NLP Sentiment Extraction', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Structured (Tabular) vs. Unstructured (Audio/Video/Text) &bull; Data Masking
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Big Data Typology:</strong><br>
                            &bull; <strong>Structured (Green):</strong> Rows &amp; columns (Excel, SQL inventory tables).<br>
                            &bull; <strong>Unstructured (Orange):</strong> Customer call audio, CCTV video feeds, PDF contracts.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🔒 Applied Techniques</div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Text Mining</span>
                                <div>
                                    Running Natural Language Processing (NLP) on <strong>5,000 social media posts</strong> to detect customer sentiment (Positive, Neutral, Negative).
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Data Masking</span>
                                <div>
                                    Replacing real credit cards <span class="prob-step-calc">4111-2222-3333-4444</span> with dummy tokens <span class="prob-step-calc">XXXX-XXXX-XXXX-1234</span> to safeguard PII during developer testing.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 7. BI Metrics Hierarchy -->
                    <div class="prob-card" data-cat="bi">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">7</div>
                                <h3 class="prob-card-title">Business Intelligence (BI) Metrics Hierarchy</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">4-Tier BI Hierarchy</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Observation -> Measure -> Metric -> KPI', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Observation &nbsp;&xrarr;&nbsp; Measure &nbsp;&xrarr;&nbsp; Metric &nbsp;&xrarr;&nbsp; KPI
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Hierarchy Concept:</strong> Moves from raw singular events to aggregated totals, calculated ratios, and strategic decision targets.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🏢 Complete Store BI Walkthrough</div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">1. Observation</span>
                                <div><strong>Raw Event:</strong> A single customer walks in and buys 1 shirt for \$50.</div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">2. Measure</span>
                                <div><strong>Accumulated Total:</strong> At the end of the day, total revenue is <strong>\$500 across 20 customers</strong>.</div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">3. Metric</span>
                                <div>
                                    <strong>Calculated Ratio:</strong>
                                    <span class="prob-step-calc">Metric = Total Revenue / Customers = \$500 / 20 = \$25 / customer</span>
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">4. KPI</span>
                                <div>
                                    <strong>Strategic Target:</strong> Management target: <em>"Average spend must exceed \$22."</em><br>
                                    <span class="prob-check-badge">✅ KPI Met: \$25 &gt; \$22 target threshold!</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 8. Linear Regression -->
                    <div class="prob-card" data-cat="predictive">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">8</div>
                                <h3 class="prob-card-title">Linear Regression: Y = B &sdot; X + &epsilon;</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Continuous Prediction</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Y = B * X + ε', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Y = B &sdot; X + &epsilon;
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Formula Breakdown:</strong><br>
                            &bull; <strong>Y:</strong> Dependent Variable (target prediction)<br>
                            &bull; <strong>X:</strong> Regressor / Independent Variable / Predictor feature<br>
                            &bull; <strong>B:</strong> Slope / Weight multiplier &nbsp;|&nbsp; <strong>&epsilon;:</strong> Random error term
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">⚡ Worked Example: Electricity Bill Prediction</div>
                            <p class="prob-scenario-desc">Predicting electricity bill (Y) based on daily air conditioner run-time in hours (X):</p>
                            <div class="prob-math-display" style="padding:8px 12px; margin:3px 0;">
                                <div class="prob-math-inline-block">
                                    Bill (Y) = 15 &sdot; (Hours X) + 50
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Calculation</span>
                                <div>
                                    If you run the AC for <strong>X = 6 hours</strong>:<br>
                                    <span class="prob-step-calc">Y = (15 &times; 6) + 50 = 90 + 50 = \$140</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 9. Logistic Regression -->
                    <div class="prob-card" data-cat="predictive">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">9</div>
                                <h3 class="prob-card-title">Logistic Regression (Classification &amp; Cutoff)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Sigmoid Probability</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('If P(Success) > 0.50 => Class 1 | Else => Class 0', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                If P(Success) &gt; 0.50 &rArr; Class 1 &nbsp;&nbsp;|&nbsp;&nbsp; If P(Success) &le; 0.50 &rArr; Class 0
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Concept:</strong> Maps linear combinations to an S-shaped curve (Sigmoid) outputting a probability between 0 and 1 with a decision threshold cutoff.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🏦 Worked Example: Bank Loan Default Classifier</div>
                            <p class="prob-scenario-desc">A risk model predicts whether a loan applicant will default on payment.</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Model Output</span>
                                <div>Model outputs probability: <span class="prob-step-calc">P = 0.72 (72%)</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Decision</span>
                                <div>Since <strong>0.72 &gt; 0.50</strong> &rArr; System classifies applicant as <strong>Class 1 (High Risk / Default)</strong>.</div>
                            </div>
                        </div>
                    </div>

                    <!-- 10. Clustering vs Factor Analysis -->
                    <div class="prob-card" data-cat="predictive">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">10</div>
                                <h3 class="prob-card-title">Clustering vs. Factor Analysis</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Rows vs Columns</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Clustering: Groups Rows (Observations) | Factor Analysis: Groups Columns (Variables)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Clustering &rArr; Groups Rows (Observations) &nbsp;&bull;&nbsp; Factor Analysis &rArr; Groups Columns (Features)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Golden Distinction:</strong><br>
                            &bull; <strong>Clustering:</strong> Groups <em>observations/samples (rows)</em> into distinct clusters.<br>
                            &bull; <strong>Factor Analysis:</strong> Compresses correlated <em>variables/features (columns)</em> into underlying factors.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🛍️ Customer Scenario Comparison</div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Clustering</span>
                                <div>
                                    You have <strong>1,000 customer row profiles</strong> &rArr; Grouped into 3 clusters: <em>Budget Shoppers, Bargain Hunters, and Luxury Buyers</em>.
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Factor Analysis</span>
                                <div>
                                    A survey has <strong>50 question columns</strong> &rArr; Compresses 50 columns into 2 core factors: <em>Store Environment and Customer Service</em>.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 11. Time Series Analysis -->
                    <div class="prob-card" data-cat="predictive">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">11</div>
                                <h3 class="prob-card-title">Time Series Analysis: The Axis Rule</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Sequential Data</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Horizontal X-Axis = Time | Vertical Y-Axis = Value/Metric', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Horizontal X-Axis = Time (Independent) &nbsp;&bull;&nbsp; Vertical Y-Axis = Observation (Dependent)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Mandatory Rule:</strong> The time component must <strong>strictly sit on the horizontal X-axis</strong> because time moves forward independently and monotonically.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">📈 Worked Example: Tracking Holiday Retail Sales</div>
                            <p class="prob-scenario-desc">Tracking daily revenue across the month of December:</p>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">X-Axis (Horizontal)</span>
                                <div><span class="prob-step-calc">Dec 1, Dec 2, Dec 3, ..., Dec 31</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Y-Axis (Vertical)</span>
                                <div><span class="prob-step-calc">Daily Revenue (\$1,000, \$1,200, \$2,500...)</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- 12. ML: The 4 Ingredients -->
                    <div class="prob-card" data-cat="ml">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">12</div>
                                <h3 class="prob-card-title">Machine Learning: The 4 Core Ingredients</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Robot Archer Analogy</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('1. Data -> 2. Model -> 3. Objective Function -> 4. Optimizer', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                1. Data &nbsp;&bull;&nbsp; 2. Model &nbsp;&bull;&nbsp; 3. Objective Function &nbsp;&bull;&nbsp; 4. Optimization Algorithm
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Concept:</strong> Every single machine learning system requires these 4 components to learn from experience.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🏹 The Robot Archer Analogy</div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">1. Data</span>
                                <div><strong>Quiver of Arrows:</strong> 10,000 historical images of handwritten digits (0 through 9).</div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">2. Model</span>
                                <div><strong>Bow Usage:</strong> A Neural Network mathematical architecture designed to process pixel inputs.</div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">3. Objective</span>
                                <div><strong>Distance from Bullseye:</strong> A loss function measuring prediction error (e.g., predicting 8 when true digit is 3).</div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">4. Optimizer</span>
                                <div><strong>Adjusting Grip:</strong> Gradient Descent updates internal weights to reduce error on the next attempt.</div>
                            </div>
                        </div>
                    </div>

                    <!-- 13. The 3 ML Paradigms -->
                    <div class="prob-card" data-cat="ml">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">13</div>
                                <h3 class="prob-card-title">The 3 Machine Learning Paradigms</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Supervised / Unsupervised / RL</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('Supervised (Labeled) | Unsupervised (Unlabeled) | Reinforcement (Reward/Penalty)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                Supervised (Labeled) &nbsp;&bull;&nbsp; Unsupervised (Unlabeled) &nbsp;&bull;&nbsp; Reinforcement (Rewards)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Taxonomy:</strong> Categorizes how machines consume data and receive feedback during training.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">🤖 Paradigm Comparisons</div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Supervised</span>
                                <div>
                                    <strong>Labeled Data:</strong> Training an email filter with <strong>5,000 pre-tagged emails</strong> ("Spam" or "Not Spam").
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Unsupervised</span>
                                <div>
                                    <strong>Unlabeled Data:</strong> Giving an algorithm purchase histories of <strong>10,000 users with no labels</strong>, discovering clusters automatically (K-Means).
                                </div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Reinforcement</span>
                                <div>
                                    <strong>Reward/Penalty:</strong> An AI bot learns Chess by receiving <strong>+1 for win and -1 for loss</strong> through millions of self-played games.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 14. Self-Supervised Learning & LLMs -->
                    <div class="prob-card" data-cat="ml">
                        <div class="prob-card-hdr">
                            <div class="prob-card-title-group">
                                <div class="prob-num-pill">14</div>
                                <h3 class="prob-card-title">Self-Supervised Learning &amp; LLMs (GPT)</h3>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="prob-tag-badge">Transformers &amp; Pre-training</span>
                                <button class="prob-copy-btn" onclick="window.copyProbFormula('N-grams -> RNNs -> LSTMs -> Transformers (GPT: Generative Pre-trained Transformer)', this)">📋 Copy</button>
                            </div>
                        </div>
                        <div class="prob-math-display">
                            <div class="prob-math-inline-block">
                                N-grams &nbsp;&xrarr;&nbsp; RNNs &nbsp;&xrarr;&nbsp; LSTMs &nbsp;&xrarr;&nbsp; Transformers (Self-Attention)
                            </div>
                        </div>
                        <div class="prob-meaning-box">
                            <strong>Concept:</strong> The model generates its own training labels by masking parts of a sequence and predicting the missing token from contextual attention.<br>
                            <strong>GPT:</strong> <em>Generative Pre-trained Transformer</em>.
                        </div>
                        <div class="prob-example-section">
                            <div class="prob-scenario-title">📝 Masked Language Modeling Walkthrough</div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Input Text</span>
                                <div><span class="prob-step-calc">"The chef baked a fresh loaf of [MASK]."</span></div>
                            </div>
                            <div class="prob-step-row">
                                <span class="prob-step-badge">Prediction</span>
                                <div>
                                    Self-Supervised Output: <span class="prob-step-calc">[MASK] = "bread" (Highest Attention Score)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                <div id="traditional-no-results" style="display:none; text-align:center; padding:40px 20px; color:var(--text-muted-color);">
                    <span style="font-size:2rem;">🔍</span>
                    <p style="margin:8px 0 0 0; font-weight:600;">No matching data techniques found.</p>
                    <p style="margin:4px 0 0 0; font-size:0.85rem;">Try adjusting your search terms or selecting 'All Topics'.</p>
                </div>
            </div>
        </div>
    </div>`;
        document.body.appendChild(wrapper.firstElementChild);
        overlay = document.getElementById('traditional-examples-modal-overlay');
    }

    if (overlay) {
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const searchInput = document.getElementById('traditional-examples-search');
            if (searchInput) searchInput.focus();
        }, 100);
    }
};

window.closeTraditionalExamplesModal = function() {
    const overlay = document.getElementById('traditional-examples-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
};

window.filterTraditionalExamples = function() {
    const query = (document.getElementById('traditional-examples-search')?.value || '').toLowerCase().trim();
    const activeChip = document.querySelector('#traditional-examples-modal-overlay .prob-chip.active');
    const activeCat = activeChip ? activeChip.getAttribute('data-cat') || 'all' : 'all';

    const cards = document.querySelectorAll('#traditional-examples-modal-overlay .prob-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const cat = card.getAttribute('data-cat') || 'all';

        const matchesQuery = !query || text.includes(query);
        const matchesCat = activeCat === 'all' || cat.includes(activeCat);

        if (matchesQuery && matchesCat) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const noResults = document.getElementById('traditional-no-results');
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
};

window.filterTradCategory = function(category, btn) {
    document.querySelectorAll('#traditional-examples-modal-overlay .prob-chip').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    window.filterTraditionalExamples();
};

// Keyboard & Click backdrop listener for Traditional modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const overlay = document.getElementById('traditional-examples-modal-overlay');
        if (overlay && overlay.classList.contains('active')) {
            window.closeTraditionalExamplesModal();
        }
    }
});

document.addEventListener('click', (e) => {
    const overlay = document.getElementById('traditional-examples-modal-overlay');
    if (overlay && e.target === overlay) {
        window.closeTraditionalExamplesModal();
    }
});

window.toggleModalFullscreen = function(btn) {
    const modalBox = btn.closest('.prob-modal-box');
    if (!modalBox) return;
    const isFull = modalBox.classList.toggle('is-fullscreen');
    btn.innerHTML = isFull ? '&#128471;' : '&#x26F6;';
    btn.title = isFull ? 'Restore Window Size' : 'Maximize Window';
};
