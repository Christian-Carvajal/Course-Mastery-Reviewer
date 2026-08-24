// ============================================================================
// GLOBAL BUILT-IN SCIENTIFIC & CS REVIEWER CALCULATOR (v1.1)
// File: calculator.js
// Compact Ergonomic UI, 1-Click Formula Copier, Skeleton Inserter, Base Converter
// ============================================================================

(function(window, document) {
    'use strict';

    if (window.ReviewerCalculator) {
        return; // Prevent duplicate instantiation
    }

    const FORMULA_PRESETS = [
        {
            category: '🔐 Information Assurance & Security',
            items: [
                {
                    name: 'ALE (Annualized Loss Expectancy)',
                    formula: 'ALE = SLE * ARO',
                    skeleton: '* ',
                    desc: 'Single Loss Expectancy multiplied by Annualized Rate of Occurrence'
                },
                {
                    name: 'SLE (Single Loss Expectancy)',
                    formula: 'SLE = AV * EF',
                    skeleton: '* ',
                    desc: 'Asset Value multiplied by Exposure Factor (0.0 to 1.0)'
                },
                {
                    name: 'Key Space Size (2^k bits)',
                    formula: 'KeySpace = 2^k',
                    skeleton: '2^',
                    desc: 'Total brute-force search space for k-bit keys (e.g. 2^128, 2^256)'
                },
                {
                    name: 'Password Entropy (Bits)',
                    formula: 'Entropy = L * log2(R)',
                    skeleton: ' * log2()',
                    desc: 'Password length L multiplied by log2 of character pool size R'
                }
            ]
        },
        {
            category: '📊 Data Mining & Probabilities',
            items: [
                {
                    name: 'Combinations (nCr)',
                    formula: 'nCr(n, r) = n! / (r! * (n - r)!)',
                    skeleton: 'nCr(',
                    desc: 'Number of ways to choose r items from n without order'
                },
                {
                    name: 'Permutations (nPr)',
                    formula: 'nPr(n, r) = n! / (n - r)!',
                    skeleton: 'nPr(',
                    desc: 'Number of ways to arrange r items from n with order'
                },
                {
                    name: 'Bayes Theorem P(A|B)',
                    formula: 'P(A|B) = (P(B|A) * P(A)) / P(B)',
                    skeleton: '(*)/',
                    desc: 'Posterior probability given likelihood, prior, and marginal evidence'
                },
                {
                    name: 'Complement Rule (At Least Once)',
                    formula: 'P(At Least 1) = 1 - (1 - p)^n',
                    skeleton: '1 - (1 - )^',
                    desc: 'Probability of at least one occurrence across n independent trials'
                },
                {
                    name: 'Classical Probability P(A)',
                    formula: 'P(A) = n(A) / n(S)',
                    skeleton: '/',
                    desc: 'Number of favorable outcomes divided by total sample space'
                }
            ]
        },
        {
            category: '💻 OS Configuration & Networking',
            items: [
                {
                    name: 'Page / Frame Size (2^d bytes)',
                    formula: 'PageSize = 2^Offset_Bits',
                    skeleton: '2^',
                    desc: 'Page frame capacity in bytes (e.g. 2^12 = 4096 Bytes = 4 KB)'
                },
                {
                    name: 'Page Table Entries Count',
                    formula: 'Entries = 2^(Virtual_Bits - Offset_Bits)',
                    skeleton: '2^()',
                    desc: 'Total page table entries (e.g. 2^(32 - 12) = 2^20 = 1,048,576)'
                },
                {
                    name: 'IPv4 Usable Subnet Hosts',
                    formula: 'Usable_Hosts = 2^(32 - CIDR) - 2',
                    skeleton: '2^(32 - ) - 2',
                    desc: 'Usable host addresses in CIDR prefix (subtracting network and broadcast)'
                },
                {
                    name: 'Byte Unit Conversion (KB to B)',
                    formula: 'Bytes = KB * 1024',
                    skeleton: ' * 1024',
                    desc: 'Multiply by 1024 for KiB, 1024^2 for MiB, 1024^3 for GiB'
                }
            ]
        },
        {
            category: '⚡ Automata & Computability',
            items: [
                {
                    name: 'NFA to DFA Powerset States',
                    formula: 'DFA_Max_States = 2^|Q|',
                    skeleton: '2^',
                    desc: 'Maximum states in powerset construction for NFA with |Q| states'
                },
                {
                    name: 'Binary State Complexity log2(N)',
                    formula: 'Bits = log2(N)',
                    skeleton: 'log2(',
                    desc: 'Minimum binary state bits required to encode N distinct states'
                }
            ]
        }
    ];

    class CourseCalculator {
        constructor() {
            this.isOpen = false;
            this.isScientific = true;
            this.showHistory = false;
            this.showPresets = false;
            this.expression = '';
            this.result = '0';
            this.history = [];
            this.currentBase = 'dec';

            this.loadState();
            this.initDOM();
            this.bindEvents();
        }

        loadState() {
            try {
                const savedHistory = localStorage.getItem('reviewer_calc_history');
                if (savedHistory) {
                    this.history = JSON.parse(savedHistory);
                }
                const savedSci = localStorage.getItem('reviewer_calc_sci');
                if (savedSci !== null) {
                    this.isScientific = savedSci === 'true';
                }
            } catch (e) {}
        }

        saveState() {
            try {
                localStorage.setItem('reviewer_calc_history', JSON.stringify(this.history.slice(-30)));
                localStorage.setItem('reviewer_calc_sci', this.isScientific);
            } catch (e) {}
        }

        initDOM() {
            if (document.getElementById('reviewer-calculator-modal')) return;

            // 1. Floating Omnipresent Trigger FAB
            const fab = document.createElement('button');
            fab.id = 'reviewer-calc-fab';
            fab.className = 'reviewer-calc-fab';
            fab.setAttribute('aria-label', 'Open Course Calculator');
            fab.setAttribute('title', 'Open Course Calculator (Shortcut: Alt+C)');
            fab.innerHTML = `
                <span class="calc-fab-icon">🧮</span>
                <span class="calc-fab-label">Calculator</span>
            `;
            document.body.appendChild(fab);

            // 2. Calculator Modal / Draggable Window
            const modal = document.createElement('div');
            modal.id = 'reviewer-calculator-modal';
            modal.className = 'reviewer-calc-window';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-label', 'Scientific Course Reviewer Calculator');
            modal.style.display = 'none';

            modal.innerHTML = `
                <!-- Window Header / Drag Handle -->
                <div class="calc-header" id="calc-drag-handle">
                    <div class="calc-header-left">
                        <span class="calc-header-icon">🧮</span>
                        <div class="calc-header-info">
                            <span class="calc-header-title">Course Calculator</span>
                            <span class="calc-header-mode-badge" id="calc-mode-label">CS Scientific</span>
                        </div>
                    </div>
                    <div class="calc-header-actions">
                        <button class="calc-hdr-btn" id="calc-toggle-presets" title="CS & Math Formula Reference Presets">📐 Presets</button>
                        <button class="calc-hdr-btn" id="calc-toggle-history" title="View Calculation History">📜 (<span id="calc-history-count">0</span>)</button>
                        <button class="calc-hdr-btn" id="calc-toggle-mode" title="Toggle Standard / CS Scientific Mode">⇄ Mode</button>
                        <button class="calc-hdr-btn calc-close-btn" id="calc-btn-close" title="Close Calculator (Esc)">&times;</button>
                    </div>
                </div>

                <!-- Live Base Converter Strip (Dec / Hex / Bin / Oct) -->
                <div class="calc-base-bar">
                    <div class="calc-base-item" id="calc-base-dec" title="Click to copy Decimal value">
                        <span class="base-lbl">DEC</span>
                        <span class="base-val" id="val-base-dec">0</span>
                    </div>
                    <div class="calc-base-item" id="calc-base-hex" title="Click to copy Hexadecimal value">
                        <span class="base-lbl">HEX</span>
                        <span class="base-val" id="val-base-hex">0x0</span>
                    </div>
                    <div class="calc-base-item" id="calc-base-bin" title="Click to copy Binary value">
                        <span class="base-lbl">BIN</span>
                        <span class="base-val" id="val-base-bin">0b0</span>
                    </div>
                    <div class="calc-base-item" id="calc-base-oct" title="Click to copy Octal value">
                        <span class="base-lbl">OCT</span>
                        <span class="base-val" id="val-base-oct">0o0</span>
                    </div>
                </div>

                <!-- Display Screen -->
                <div class="calc-screen-box">
                    <div class="calc-expr-line" id="calc-expr-display" title="Current expression">0</div>
                    <div class="calc-result-line" id="calc-result-display" title="Evaluated result">0</div>
                    <div class="calc-copy-bar">
                        <button class="calc-copy-btn" id="calc-copy-computation" title="Copy full expression and answer e.g. '150000 * 0.15 = 22500'">
                            📋 Copy Equation
                        </button>
                        <button class="calc-copy-btn calc-copy-result" id="calc-copy-result-only" title="Copy only the numeric result">
                            Copy Result
                        </button>
                        <span class="calc-copy-toast" id="calc-copy-toast">✓ Copied!</span>
                    </div>
                </div>

                <!-- Presets Drawer Panel (Formula Presets & Quick Reference) -->
                <div class="calc-drawer-panel" id="calc-presets-drawer" style="display: none;">
                    <div class="drawer-header">
                        <strong>📐 CS & Course Formula Presets</strong>
                        <button class="drawer-close" id="calc-close-presets">&times;</button>
                    </div>
                    <div class="drawer-preset-desc">
                        Click <strong>Copy</strong> to copy the clean formula, or <strong>Insert</strong> to load its skeleton into the keypad for your own numbers!
                    </div>
                    <div class="drawer-grid" id="calc-presets-container">
                        <!-- Rendered dynamically from FORMULA_PRESETS -->
                    </div>
                </div>

                <!-- History Drawer Panel -->
                <div class="calc-drawer-panel" id="calc-history-drawer" style="display: none;">
                    <div class="drawer-header">
                        <strong>📜 Calculation History</strong>
                        <div class="drawer-actions">
                            <button class="drawer-clear-btn" id="calc-clear-history">Clear</button>
                            <button class="drawer-close" id="calc-close-history">&times;</button>
                        </div>
                    </div>
                    <div class="calc-history-list" id="calc-history-items">
                        <div class="calc-history-empty">No calculations recorded yet.</div>
                    </div>
                </div>

                <!-- Keypad Buttons -->
                <div class="calc-keypad-container" id="calc-keypad">
                    <!-- Scientific Row 1 -->
                    <div class="calc-key-row sci-row">
                        <button class="calc-btn sci-btn" data-action="func" data-val="log2(">log₂</button>
                        <button class="calc-btn sci-btn" data-action="func" data-val="ln(">ln</button>
                        <button class="calc-btn sci-btn" data-action="func" data-val="log10(">log₁₀</button>
                        <button class="calc-btn sci-btn" data-action="func" data-val="nCr(">nCr</button>
                        <button class="calc-btn sci-btn" data-action="func" data-val="nPr(">nPr</button>
                        <button class="calc-btn sci-btn" data-action="func" data-val="!">n!</button>
                    </div>

                    <!-- Scientific Row 2 -->
                    <div class="calc-key-row sci-row">
                        <button class="calc-btn sci-btn" data-action="op" data-val="^">xʸ</button>
                        <button class="calc-btn sci-btn" data-action="func" data-val="2^">2ˣ</button>
                        <button class="calc-btn sci-btn" data-action="func" data-val="e^">eˣ</button>
                        <button class="calc-btn sci-btn" data-action="func" data-val="sqrt(">√</button>
                        <button class="calc-btn sci-btn" data-action="op" data-val="%">mod</button>
                        <button class="calc-btn sci-btn" data-action="val" data-val="pi">π</button>
                    </div>

                    <!-- Primary Standard Rows -->
                    <div class="calc-key-row">
                        <button class="calc-btn fn-btn" data-action="clear">AC</button>
                        <button class="calc-btn fn-btn" data-action="delete">⌫</button>
                        <button class="calc-btn fn-btn" data-action="paren" data-val="(">(</button>
                        <button class="calc-btn fn-btn" data-action="paren" data-val=")">)</button>
                        <button class="calc-btn op-btn" data-action="op" data-val="/">÷</button>
                    </div>

                    <div class="calc-key-row">
                        <button class="calc-btn num-btn" data-action="num" data-val="7">7</button>
                        <button class="calc-btn num-btn" data-action="num" data-val="8">8</button>
                        <button class="calc-btn num-btn" data-action="num" data-val="9">9</button>
                        <button class="calc-btn op-btn" data-action="op" data-val="*">×</button>
                    </div>

                    <div class="calc-key-row">
                        <button class="calc-btn num-btn" data-action="num" data-val="4">4</button>
                        <button class="calc-btn num-btn" data-action="num" data-val="5">5</button>
                        <button class="calc-btn num-btn" data-action="num" data-val="6">6</button>
                        <button class="calc-btn op-btn" data-action="op" data-val="-">−</button>
                    </div>

                    <div class="calc-key-row">
                        <button class="calc-btn num-btn" data-action="num" data-val="1">1</button>
                        <button class="calc-btn num-btn" data-action="num" data-val="2">2</button>
                        <button class="calc-btn num-btn" data-action="num" data-val="3">3</button>
                        <button class="calc-btn op-btn" data-action="op" data-val="+">+</button>
                    </div>

                    <div class="calc-key-row">
                        <button class="calc-btn fn-btn" data-action="neg">±</button>
                        <button class="calc-btn num-btn" data-action="num" data-val="0">0</button>
                        <button class="calc-btn num-btn" data-action="num" data-val=".">.</button>
                        <button class="calc-btn eq-btn" data-action="equals">=</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Inject quick pill in sticky nav topbar if available
            const navActions = document.querySelector('.topbar-actions, nav.sticky-nav > div:last-child');
            if (navActions && !navActions.querySelector('.nav-calc-btn')) {
                const calcNavBtn = document.createElement('button');
                calcNavBtn.className = 'topbar-action-pill calc-pill nav-calc-btn';
                calcNavBtn.title = 'Open Course Calculator (Alt+C)';
                calcNavBtn.innerHTML = '<span class="pill-icon">🧮</span><span class="pill-label">Calculator</span>';
                calcNavBtn.style.marginRight = '0.35rem';
                calcNavBtn.addEventListener('click', () => this.toggleModal());
                navActions.insertBefore(calcNavBtn, navActions.firstChild);
            }
        }

        bindEvents() {
            this.modal = document.getElementById('reviewer-calculator-modal');
            this.fab = document.getElementById('reviewer-calc-fab');
            this.exprEl = document.getElementById('calc-expr-display');
            this.resEl = document.getElementById('calc-result-display');
            this.toastEl = document.getElementById('calc-copy-toast');
            this.historyCountEl = document.getElementById('calc-history-count');
            this.modeLabelEl = document.getElementById('calc-mode-label');

            if (this.fab) {
                this.fab.addEventListener('click', () => this.toggleModal());
            }

            const closeBtn = document.getElementById('calc-btn-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal());
            }

            const modeBtn = document.getElementById('calc-toggle-mode');
            if (modeBtn) {
                modeBtn.addEventListener('click', () => this.toggleMode());
            }

            const presetsBtn = document.getElementById('calc-toggle-presets');
            const closePresetsBtn = document.getElementById('calc-close-presets');
            if (presetsBtn) {
                presetsBtn.addEventListener('click', () => this.togglePresets());
            }
            if (closePresetsBtn) {
                closePresetsBtn.addEventListener('click', () => this.togglePresets(false));
            }

            const historyBtn = document.getElementById('calc-toggle-history');
            const closeHistBtn = document.getElementById('calc-close-history');
            const clearHistBtn = document.getElementById('calc-clear-history');
            if (historyBtn) {
                historyBtn.addEventListener('click', () => this.toggleHistory());
            }
            if (closeHistBtn) {
                closeHistBtn.addEventListener('click', () => this.toggleHistory(false));
            }
            if (clearHistBtn) {
                clearHistBtn.addEventListener('click', () => this.clearHistory());
            }

            const copyCompBtn = document.getElementById('calc-copy-computation');
            if (copyCompBtn) {
                copyCompBtn.addEventListener('click', () => this.copyEquation());
            }
            const copyResBtn = document.getElementById('calc-copy-result-only');
            if (copyResBtn) {
                copyResBtn.addEventListener('click', () => this.copyResultOnly());
            }

            const keypad = document.getElementById('calc-keypad');
            if (keypad) {
                keypad.addEventListener('click', (e) => {
                    const btn = e.target.closest('.calc-btn');
                    if (!btn) return;
                    this.handleButtonPress(btn);
                });
            }

            // Keyboard Shortcuts
            document.addEventListener('keydown', (e) => {
                if ((e.altKey && e.key.toLowerCase() === 'c') || (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'c')) {
                    e.preventDefault();
                    this.toggleModal();
                    return;
                }

                if (this.isOpen) {
                    if (e.key === 'Escape') {
                        this.closeModal();
                        return;
                    }
                    this.handleKeyboard(e);
                }
            });

            ['dec', 'hex', 'bin', 'oct'].forEach(base => {
                const el = document.getElementById(`calc-base-${base}`);
                if (el) {
                    el.addEventListener('click', () => {
                        const val = document.getElementById(`val-base-${base}`)?.textContent || '0';
                        this.copyToClipboard(val, `Copied ${base.toUpperCase()}: ${val}`);
                    });
                }
            });

            this.renderPresets();
            this.initDraggable();
            this.renderHistory();
            this.updateModeUI();
        }

        renderPresets() {
            const container = document.getElementById('calc-presets-container');
            if (!container) return;

            container.innerHTML = FORMULA_PRESETS.map(group => `
                <div class="preset-group">
                    <span class="preset-group-title">${group.category}</span>
                    <div class="preset-items-list">
                        ${group.items.map(item => `
                            <div class="preset-card">
                                <div class="preset-card-info">
                                    <div class="preset-card-name">${item.name}</div>
                                    <div class="preset-card-formula">${item.formula}</div>
                                </div>
                                <div class="preset-card-actions">
                                    <button class="preset-act-btn preset-copy-formula" data-formula="${item.formula}" title="Copy formula equation to clipboard">
                                        📋 Copy
                                    </button>
                                    <button class="preset-act-btn preset-insert-skel" data-skel="${item.skeleton}" title="Insert formula skeleton onto keypad">
                                        ⚡ Insert
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');

            // Bind Copy & Insert event listeners
            container.querySelectorAll('.preset-copy-formula').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const formStr = btn.getAttribute('data-formula');
                    if (formStr) {
                        this.copyToClipboard(formStr, `Copied Formula: ${formStr}`);
                    }
                });
            });

            container.querySelectorAll('.preset-insert-skel').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const skel = btn.getAttribute('data-skel');
                    if (skel) {
                        if (this.expression === '0' || !this.expression) {
                            this.expression = skel;
                        } else {
                            this.expression += skel;
                        }
                        this.evaluate(false);
                        this.updateDisplay();
                        this.togglePresets(false);
                        this.showCopyToast(`Inserted ${skel}`);
                    }
                });
            });
        }

        initDraggable() {
            const handle = document.getElementById('calc-drag-handle');
            const windowEl = this.modal;
            if (!handle || !windowEl) return;

            let isDragging = false;
            let startX, startY, initialLeft, initialTop;

            handle.addEventListener('mousedown', (e) => {
                if (e.target.closest('button')) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = windowEl.getBoundingClientRect();
                initialLeft = rect.left;
                initialTop = rect.top;
                windowEl.style.transition = 'none';
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                const newLeft = Math.max(10, Math.min(window.innerWidth - windowEl.offsetWidth - 10, initialLeft + dx));
                const newTop = Math.max(10, Math.min(window.innerHeight - windowEl.offsetHeight - 10, initialTop + dy));

                windowEl.style.left = `${newLeft}px`;
                windowEl.style.top = `${newTop}px`;
                windowEl.style.right = 'auto';
                windowEl.style.bottom = 'auto';
            });

            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    windowEl.style.transition = '';
                }
            });
        }

        toggleModal() {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.modal.style.display = 'flex';
                this.fab.classList.add('active');
                this.updateDisplay();
            } else {
                this.closeModal();
            }
        }

        closeModal() {
            this.isOpen = false;
            this.modal.style.display = 'none';
            if (this.fab) this.fab.classList.remove('active');
            this.togglePresets(false);
            this.toggleHistory(false);
        }

        toggleMode() {
            this.isScientific = !this.isScientific;
            this.saveState();
            this.updateModeUI();
        }

        updateModeUI() {
            const sciRows = this.modal.querySelectorAll('.sci-row');
            sciRows.forEach(row => {
                row.style.display = this.isScientific ? 'flex' : 'none';
            });
            if (this.modeLabelEl) {
                this.modeLabelEl.textContent = this.isScientific ? 'CS Scientific' : 'Standard';
            }
        }

        togglePresets(force) {
            const drawer = document.getElementById('calc-presets-drawer');
            if (!drawer) return;
            this.showPresets = force !== undefined ? force : !this.showPresets;
            drawer.style.display = this.showPresets ? 'flex' : 'none';
            if (this.showPresets) this.toggleHistory(false);
        }

        toggleHistory(force) {
            const drawer = document.getElementById('calc-history-drawer');
            if (!drawer) return;
            this.showHistory = force !== undefined ? force : !this.showHistory;
            drawer.style.display = this.showHistory ? 'flex' : 'none';
            if (this.showHistory) {
                this.togglePresets(false);
                this.renderHistory();
            }
        }

        handleButtonPress(btn) {
            const action = btn.getAttribute('data-action');
            const val = btn.getAttribute('data-val');

            btn.classList.add('btn-active-pop');
            setTimeout(() => btn.classList.remove('btn-active-pop'), 120);

            switch (action) {
                case 'num':
                    this.appendChar(val);
                    break;
                case 'op':
                    this.appendOp(val);
                    break;
                case 'func':
                    this.appendFunction(val);
                    break;
                case 'paren':
                    this.appendChar(val);
                    break;
                case 'val':
                    if (val === 'pi') this.appendChar('3.14159265');
                    break;
                case 'clear':
                    this.clearAll();
                    break;
                case 'delete':
                    this.backspace();
                    break;
                case 'neg':
                    this.toggleNegative();
                    break;
                case 'equals':
                    this.evaluate(true);
                    break;
            }
            this.updateDisplay();
        }

        handleKeyboard(e) {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

            const key = e.key;

            if (/[0-9.]/.test(key)) {
                this.appendChar(key);
            } else if (['+', '-', '*', '/'].includes(key)) {
                this.appendOp(key);
            } else if (key === '^') {
                this.appendOp('^');
            } else if (key === '%' ) {
                this.appendOp('%');
            } else if (key === '(' || key === ')') {
                this.appendChar(key);
            } else if (key === 'Enter' || key === '=') {
                e.preventDefault();
                this.evaluate(true);
            } else if (key === 'Backspace') {
                this.backspace();
            } else if (key === 'Escape') {
                this.closeModal();
            } else if (key.toLowerCase() === 'c') {
                this.clearAll();
            }
            this.updateDisplay();
        }

        appendChar(char) {
            if (this.expression === '0' && char !== '.') {
                this.expression = char;
            } else {
                this.expression += char;
            }
            this.evaluate(false);
        }

        appendOp(op) {
            if (!this.expression) {
                if (op === '-') this.expression = '-';
                return;
            }
            const lastChar = this.expression.slice(-1);
            if (['+', '-', '*', '/', '^', '%'].includes(lastChar)) {
                this.expression = this.expression.slice(0, -1) + op;
            } else {
                this.expression += op;
            }
            this.evaluate(false);
        }

        appendFunction(fn) {
            this.expression += fn;
            this.evaluate(false);
        }

        clearAll() {
            this.expression = '';
            this.result = '0';
            this.updateBaseConversions(0);
        }

        backspace() {
            if (this.expression.length > 0) {
                this.expression = this.expression.slice(0, -1);
                this.evaluate(false);
            }
        }

        toggleNegative() {
            if (!this.expression) return;
            if (this.expression.startsWith('-')) {
                this.expression = this.expression.slice(1);
            } else {
                this.expression = '-' + this.expression;
            }
            this.evaluate(false);
        }

        static factorial(n) {
            if (n < 0) return NaN;
            if (n === 0 || n === 1) return 1;
            let res = 1;
            for (let i = 2; i <= Math.min(n, 170); i++) res *= i;
            return res;
        }

        static nCr(n, r) {
            if (r < 0 || r > n) return 0;
            return CourseCalculator.factorial(n) / (CourseCalculator.factorial(r) * CourseCalculator.factorial(n - r));
        }

        static nPr(n, r) {
            if (r < 0 || r > n) return 0;
            return CourseCalculator.factorial(n) / CourseCalculator.factorial(n - r);
        }

        evaluate(recordToHistory = false) {
            if (!this.expression || this.expression.trim() === '') {
                this.result = '0';
                this.updateBaseConversions(0);
                return;
            }

            try {
                let parsed = this.expression;

                parsed = parsed.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
                parsed = parsed.replace(/\^/g, '**');

                parsed = parsed.replace(/log2\(([^)]+)\)/g, 'Math.log2($1)');
                parsed = parsed.replace(/ln\(([^)]+)\)/g, 'Math.log($1)');
                parsed = parsed.replace(/log10\(([^)]+)\)/g, 'Math.log10($1)');
                parsed = parsed.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
                parsed = parsed.replace(/2\^([0-9.]+)/g, '(2**$1)');
                parsed = parsed.replace(/e\^([0-9.]+)/g, '(Math.E**$1)');

                parsed = parsed.replace(/nCr\(([0-9.]+),\s*([0-9.]+)\)/g, 'CourseCalculator.nCr($1, $2)');
                parsed = parsed.replace(/nPr\(([0-9.]+),\s*([0-9.]+)\)/g, 'CourseCalculator.nPr($1, $2)');
                parsed = parsed.replace(/([0-9]+)!/g, 'CourseCalculator.factorial($1)');

                const safeEval = new Function('CourseCalculator', `
                    try {
                        return ${parsed};
                    } catch(e) {
                        return null;
                    }
                `);

                const calculated = safeEval(CourseCalculator);

                if (calculated !== null && !isNaN(calculated) && isFinite(calculated)) {
                    const formatted = Number.isInteger(calculated) 
                        ? calculated.toString() 
                        : parseFloat(calculated.toFixed(8)).toString();

                    this.result = formatted;
                    this.updateBaseConversions(Number(calculated));

                    if (recordToHistory) {
                        this.history.unshift({
                            expr: this.expression,
                            result: this.result,
                            timestamp: Date.now()
                        });
                        this.saveState();
                        this.renderHistory();
                    }
                }
            } catch (e) {
                if (recordToHistory) {
                    this.result = 'Error';
                }
            }
        }

        updateBaseConversions(num) {
            const intVal = Math.floor(Math.abs(num));
            const sign = num < 0 ? '-' : '';

            const decEl = document.getElementById('val-base-dec');
            const hexEl = document.getElementById('val-base-hex');
            const binEl = document.getElementById('val-base-bin');
            const octEl = document.getElementById('val-base-oct');

            if (decEl) decEl.textContent = sign + intVal.toString(10);
            if (hexEl) hexEl.textContent = sign + '0x' + intVal.toString(16).toUpperCase();
            if (binEl) binEl.textContent = sign + '0b' + intVal.toString(2);
            if (octEl) octEl.textContent = sign + '0o' + intVal.toString(8);
        }

        updateDisplay() {
            if (this.exprEl) this.exprEl.textContent = this.expression || '0';
            if (this.resEl) this.resEl.textContent = this.result;
            if (this.historyCountEl) this.historyCountEl.textContent = this.history.length;
        }

        copyEquation() {
            const eq = `${this.expression || '0'} = ${this.result}`;
            this.copyToClipboard(eq, `Copied: ${eq}`);
        }

        copyResultOnly() {
            this.copyToClipboard(this.result, `Copied Result: ${this.result}`);
        }

        copyToClipboard(text, message) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showCopyToast(message || '✓ Copied to clipboard!');
                }).catch(() => {
                    this.fallbackCopy(text, message);
                });
            } else {
                this.fallbackCopy(text, message);
            }
        }

        fallbackCopy(text, message) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                this.showCopyToast(message || '✓ Copied to clipboard!');
            } catch (e) {}
            document.body.removeChild(ta);
        }

        showCopyToast(msg) {
            if (!this.toastEl) return;
            this.toastEl.textContent = msg;
            this.toastEl.classList.add('show');
            setTimeout(() => {
                this.toastEl.classList.remove('show');
            }, 2400);
        }

        renderHistory() {
            const list = document.getElementById('calc-history-items');
            if (!list) return;

            if (this.history.length === 0) {
                list.innerHTML = '<div class="calc-history-empty">No calculations recorded yet.</div>';
                return;
            }

            list.innerHTML = this.history.map((h, i) => `
                <div class="calc-hist-item" data-index="${i}" title="Click to load into calculator">
                    <div class="calc-hist-expr">${h.expr}</div>
                    <div class="calc-hist-res">= ${h.result}</div>
                    <button class="calc-hist-copy-btn" title="Copy equation" data-eq="${h.expr} = ${h.result}">📋 Copy</button>
                </div>
            `).join('');

            list.querySelectorAll('.calc-hist-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.calc-hist-copy-btn')) {
                        const eq = e.target.getAttribute('data-eq');
                        this.copyToClipboard(eq, `Copied: ${eq}`);
                        return;
                    }
                    const idx = Number(item.getAttribute('data-index'));
                    const entry = this.history[idx];
                    if (entry) {
                        this.expression = entry.expr;
                        this.result = entry.result;
                        this.evaluate(false);
                        this.updateDisplay();
                        this.toggleHistory(false);
                    }
                });
            });
        }

        clearHistory() {
            this.history = [];
            this.saveState();
            this.renderHistory();
            this.updateDisplay();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ReviewerCalculator = new CourseCalculator();
        });
    } else {
        window.ReviewerCalculator = new CourseCalculator();
    }

})(window, document);
