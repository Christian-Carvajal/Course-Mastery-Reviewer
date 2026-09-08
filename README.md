# 🎓 Course Mastery Reviewer & Quiz Portal (PWA)

> **Live Production Portal**: [https://cec-reviewer.netlify.app](https://cec-reviewer.netlify.app)  
> **Current Version**: `v1.0.182` (`reviewer-pwa-v182`)  
> **Author**: Christian Ezekiel  
> **Target Audience**: University Students, Instructors, Software Engineers, and AI Builder Agents

---

## 🌟 Overview

The **Personal Course Reviewer** is a zero-build, offline-first Progressive Web Application (PWA) built specifically for Computer Science & Information Technology university students. It combines comprehensive Study Guides, high-yield Four-Pillar Exam Quick References, interactive multiple-choice quizzes (1,350 verified questions), HD mathematical worked examples, and an offline AI tutor.

---

## 📚 Curriculum & Subjects Covered (21 Modules)

| Subject | Modules | Key Topics & Focus |
| :--- | :--- | :--- |
| **🤖 Automata Theory, Computability & Complexity** | 3 Modules (228 Qs) | Decidability, Turing machines, Halting problem, P vs. NP, DFA/NFA conversions, Kleene closure, Chomsky hierarchy. |
| **💻 Operating Systems Configuration** | 3 Modules (269 Qs) | OS architectures, Dual-mode kernel traps, System calls (POSIX/Win32), Amdahl's Law, Subnetting math ($2^h - 2$), Windows CLI networking. |
| **🛡️ Information Assurance & Security (IAS)** | 4 Modules (226 Qs) | Prelim: CIA Triad, STRIDE, Access models (DAC/MAC/RBAC/ABAC), Bell-LaPadula/Biba, Quantitative risk.<br>Midterm: Cryptography Fundamentals, Kerckhoffs's principle, password salting/Argon2id/bcrypt, AEAD, TLS 1.3, Post-Quantum standards (ML-KEM, ML-DSA). |
| **📊 Data Mining & Data Science** | 8 Modules (417 Qs) | Prelim: CRISP-DM, 5 V's, Probability axioms, Bayes' Rule, ML pipelines.<br>Midterm: Statistics Fundamentals, Normal bell curve, Z-scores, CLT ($n \ge 30$), Standard Error ($\sigma/\sqrt{n}$), Confidence Intervals (Z & t, single/two-sample, pooled variance), Hypothesis Testing (Z & t tests, p-values, Type I/II errors), and 5-Part Derivation Solvers. |
| **✍️ English for the Profession** | 3 Modules (210 Qs) | Prelim: Workplace communication telemetry, the 8 Cs, Shannon-Weaver/Osgood-Schramm/Barnlund models, active voice sentence transformations, 5-stage writing process, diagnosing fragments/run-ons/comma splices, MEAL framework, and professional cover letters. |

---

## ✨ Key Features & Architecture

* 📱 **100% Offline-First PWA**: Installable on Windows, macOS, Android, and iOS via Service Worker (`sw.js`).
* 🎓 **Four-Pillar Exam Quick References**:
  1. **Core Terminology & Keyword Recall Grids** (Over 250 defined terms).
  2. **Formula Cards with Plain English Verbalizations** (111 formula cards with `🗣️ How to Read in English` guides).
  3. **High-Yield Comparative Analysis Matrices** (62 side-by-side matrices).
  4. **Common Exam Pitfalls & Fallacies** (80 exam traps and instructor tricks).
* 🗣️ **Plain English Formula Verbalizations**: Every mathematical equation across all subjects includes a clear, natural English pronunciation guide for intuitive exam recall.
* 🧮 **HD Display Math Engine**: Over 64 worked examples with true vertical fractions and calculation containers.
* 🤖 **Offline AI Tutor (`chatbot.js`)**: 100% in-browser NLP assistant with curriculum search, voice synthesis, and dynamic quiz generation.
* ⚖️ **Academic Integrity & Distractor Balancing**: 1,350 verified multiple-choice questions with balanced option lengths.
* 📝 **Interactive Canvas Whiteboard (`whiteboard.html`)**: In-app digital scratchpad with pen, highlighter, eraser, and PNG export.
* 🖨️ **Print & PDF Cheat-Sheet Export**: 1-click clean pagination export for rapid physical or digital cramming.
* 🌗 **Dark Mode & Light Mode**: WCAG-compliant Elite Dark (`#121215`) and Light modes with zero-flash initialization.

---

## 📖 Complete Documentation Hub

Detailed developer, architecture, and operation guides are located in the [`docs/`](./docs/) directory:

* [**Documentation Overview**](./docs/README.md)
* [**System Architecture & Data Flow**](./docs/ARCHITECTURE.md)
* [**Comprehensive Changelog & Version History**](./docs/CHANGELOG.md)
* [**Study Guides & Quiz Taxonomy**](./docs/STUDY_GUIDES_AND_QUIZ_BANK.md)
* [**Developer Guidelines & Rules for AI Builders**](./docs/DEVELOPER_RULES_AND_GUIDELINES.md)
* [**Deployment & Operations Guide**](./docs/DEPLOYMENT_AND_OPERATIONS.md)

---

## 🚀 How to Run Locally & Deploy
 
Because this project uses a zero-build vanilla web architecture, you can run it with any static HTTP server:
 
```bash
# 1. Run locally
npx serve .
# (or) python -m http.server 8080
```

### 🛑 Zero-Defect Pre-Deployment Verification
> **Strict Policy**: NEVER push or deploy to Netlify if there are active UI bugs, scroll-locks, unclosed DOM tags, or console errors.

```bash
# Run verification suite before deployment:
node --check global.js && node --check sw.js && node --check supabaseClient.js
python scratch/full_integrity_audit.py
python scratch/audit_academic_integrity.py

# Deploy to Netlify Production (Only when 100% clean):
npm run deploy
```
