# 🎓 Course Mastery Reviewer & Quiz Portal

<p align="center">
  <img src="icons/icon-512.png" width="128" height="128" alt="Course Reviewer Logo" style="border-radius: 24px;" />
</p>

<p align="center">
  <strong>An offline-first, interactive University Course Reviewer, Quiz Engine, and AI Tutor PWA.</strong><br>
  Designed & Built with ❤️ by <strong>Christian Ezekiel</strong>.
</p>

<p align="center">
  <a href="#-subjects--curriculum-covered">Curriculum</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-how-to-run-locally">Run Locally</a> •
  <a href="#-how-classmates-can-remake--customize-this">Remake It Yourself</a> •
  <a href="#-cloud-sync-setup-supabase-optional">Cloud Sync</a>
</p>

---

## 👨‍💻 Creator & Author
* **Created by**: **Christian Ezekiel**
* **Project**: Computer Science & Information Technology University Course Reviewer
* **Architecture**: Zero-Build Vanilla Web (HTML5, Modern CSS3, ES6+ JavaScript, PWA Service Worker)

---

## 📚 Subjects & Curriculum Covered

This portal includes comprehensive study guides, quick reference cheat sheets, interactive flashcards, and **1,140 verified multiple-choice questions** across 4 major core subjects:

### 1. 🤖 Automata Theory & Formal Languages
* **Module 1**: *Automata, Computability & Complexity* (73 Questions) — Decidability, Turing machines, P vs NP, Chomsky hierarchy.
* **Module 2**: *Introduction to Automata & Formal Languages* (75 Questions) — Alphabets, strings, formal grammars, finite automata.
* **Module 3**: *The Central Concepts of Automata* (80 Questions) — DFA/NFA conversions, transitions, state diagrams, regular languages.

### 2. 💻 Operating System Configuration
* **Module 1**: *Introduction to Operating Systems* (88 Questions) — OS kernels, processes, memory virtualization, system architectures.
* **Module 2**: *Network Configuration in Windows OS* (90 Questions) — TCP/IP stacks, DNS, DHCP, subnetting, ipconfig, network troubleshooting.
* **Module 3**: *OS Structures & System Calls* (91 Questions) — Microkernels, monolithic kernels, system call interfaces, process control blocks.

### 3. 🛡️ Information Assurance & Security (IAS)
* **Module 1**: *Foundations & Threat Landscape (Weeks 1–2)* (77 Questions) — CIA Triad, threat vectors, malware taxonomy, social engineering.
* **Module 2**: *Governance & Risk Management (Weeks 3–4)* (79 Questions) — NIST CSF, ISO 27001, risk assessment formulas, security policies.
* **Module 3**: *Access Control Models & Principles* (71 Questions) — DAC, MAC, RBAC, ABAC, principle of least privilege, authentication factors.

### 4. 📊 Data Mining & Data Science
* **Module 1**: *Introduction to Data Science* (81 Questions) — Data science lifecycle, EDA, data types, normalization, correlation vs causation.
* **Module 2**: *Probabilities* (94 Questions) — Probability axioms, addition & multiplication rules, permutations, variations, combinations.
* **Module 3**: *Probability Distributions* (76 Questions) — Bernoulli, Binomial, Poisson, Uniform, Normal, Student's t, Chi-Squared, Exponential, Logistic, PDF/CDF, Empirical 68-95-99.7 rule.
* **Module 4**: *Sets, Events & Bayesian Inference* (75 Questions) — Set notation ($\\in, \\notin, \\forall, \\subseteq, \\emptyset$), Venn unions/intersections, conditional probability, Bayes' Rule, posterior odds.
* **Module 5**: *Traditional Data Techniques* (91 Questions) — 4-step data pipeline, class labeling arithmetic test, missing value imputation, class balancing/shuffling, BI hierarchy, Linear/Logistic regression, Clustering vs Factor analysis, ML foundations & LLM pre-training.

---

## ✨ Key Features

* 📱 **100% Offline-First PWA**: Installable as a native app on Windows, macOS, Android, and iOS. Works completely offline via `sw.js` caching.
* 🧮 **HD Display Math Worked Examples**: Over 64 step-by-step mathematical worked examples in ultra-wide (1,480px) responsive modals with vertical fraction rendering and 1-click fullscreen toggle (`⛶`).
* 🤖 **Offline AI Tutor (`chatbot.js`)**: In-browser AI assistant with full curriculum search, Jarvis-style voice synthesizer (Web Speech API), and on-demand quiz generation.
* ⚖️ **Academic Integrity & Distractor Balancing**: Every question has balanced option lengths to eliminate the "longest answer is correct" guessing exploit.
* 📝 **Interactive Canvas Whiteboard (`whiteboard.html`)**: In-app digital scratchpad with pen, highlighter, colors, line thickness, eraser, and instant PNG export.
* 🔐 **Mistake Vault**: Automatically captures questions answered incorrectly for focused remediation and retry sessions.
* ⏱️ **Floating Study Focus Timer**: Track study hours with automatic per-subject logging.
* 🌗 **Dark Mode & Light Mode**: Seamless glassmorphic design with system theme detection and persistent toggle.

---

## 🚀 How to Run Locally

Because this project uses a **zero-build vanilla architecture**, you don't need `npm install` or complex build tools to run it!

### Option A: Using Python (Simplest)
```bash
# Clone this repository
git clone https://github.com/Christian-Carvajal/Course-Mastery-Reviewer.git
cd Course-Mastery-Reviewer

# Start local static server
python -m http.server 8080
```
Then open your browser and navigate to: `http://localhost:8080`

### Option B: Using Node.js / npx serve
```bash
npx serve .
```

### Option C: VS Code Live Server
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension.
3. Right-click `index.html` and select **"Open with Live Server"**.

---

## 🛠️ How Classmates Can Remake & Customize This

If you want to use this template to build your own reviewer or study guide for other university subjects:

1. **Add Your Subjects & Lessons**:
   * Create a folder under `subject/yourSubjectName/Prelim/yourLesson.html`.
   * Follow the clean HTML template in any existing module (e.g. `subject/dataMining/Prelim/probabilities.html`).
2. **Add Your Own Questions**:
   * Inside your HTML file, update the `quizData` array:
   ```javascript
   const quizData = [
       {
           q: "Your question text here?",
           options: [
               "Option A description",
               "Option B description",
               "Option C description",
               "Option D description"
           ],
           correct: 0, // Index of correct option (0, 1, 2, or 3)
           explanation: "In-depth explanation of why option A is correct."
       }
   ];
   ```
3. **Register on Home Dashboard**:
   * Add a topic card in `index.html` linking to your new lesson.
   * Add your lesson to `STATIC_ASSETS` in `sw.js` for offline PWA caching.

---

## ☁️ Cloud Sync Setup (Supabase - Optional)

The app functions **100% offline out-of-the-box using browser LocalStorage**.

If you want multi-device cloud synchronization across your phone and laptop:
1. Create a free project at [supabase.com](https://supabase.com).
2. Open `supabaseClient.js` and input your project credentials:
   ```javascript
   const DEFAULT_SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   const DEFAULT_SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
3. Or simply paste your URL and Anon Key directly inside the app's settings modal.

---

## 📄 License & Academic Attribution
Created for educational and academic review purposes. Free to use, adapt, and study from for university students.

**Author**: [Christian Ezekiel](https://github.com/Christian-Carvajal)