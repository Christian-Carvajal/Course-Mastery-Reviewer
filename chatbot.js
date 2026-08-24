// ============================================================================
// GLOBAL OFFLINE AI STUDY ASSISTANT & GEMINI-STYLE INTERACTIVE QUIZ BOT (v3)
// File: chatbot.js
// 100% Client-Side, Zero-Latency, Works Offline on All Pages & Devices
// ============================================================================

(function(window) {
    'use strict';

    if (window.StudyChatbot) {
        return; // Prevent duplicate instantiation
    }

    // ========================================================================
    // 1. COMPREHENSIVE MULTI-SUBJECT KNOWLEDGE & FORMULA GRAPH
    // ========================================================================
    const KNOWLEDGE_GRAPH = [
        // --- FORMULAS (DATA MINING & PROBABILITY) ---
        {
            id: 'formula_probability_classical',
            type: 'FORMULA',
            subject: 'Data Mining',
            topic: 'Probabilities',
            aliases: ['probability', 'probability formula', 'formula for probability', 'formula of probability', 'classical probability', 'prabability', 'probablity', 'what is the formula for probability', 'calculate probability'],
            title: 'Classical Probability Formula',
            summary: `**Classical (Theoretical) Probability Definition**:\n\n\\[ P(A) = \\frac{n(A)}{n(S)} = \\frac{\\text{Number of Favorable Outcomes}}{\\text{Total Number of Possible Outcomes in Sample Space}} \\]\n\n• **P(A)**: Probability of event A occurring \\( (0 \\le P(A) \\le 1) \\)\n• **n(A)**: Count of outcomes favorable to event A\n• **n(S)**: Total count of equally likely outcomes in sample space \\( S \\)\n\n### Axioms of Probability:\n• \\( 0 \\le P(A) \\le 1 \\) (0% to 100%)\n• \\( P(\\emptyset) = 0 \\) (Impossible event)\n• \\( P(S) = 1.0 \\) (Certain event)\n• \\( \\sum P(\\text{all basic outcomes}) = 1.0 \\)`,
            clues: 'Use when all outcomes in a sample space are equally likely (e.g. rolling dice, tossing coins, drawing cards). Look for keywords: "Find the probability of...", "Chance of outcome...", "Equally likely".',
            example: 'Rolling an even number on a 6-sided die:\n• Sample space S = {1, 2, 3, 4, 5, 6}, n(S) = 6\n• Event A (Even) = {2, 4, 6}, n(A) = 3\n• P(Even) = 3 / 6 = 0.50 (50%)',
            link: '/subject/dataMining/prelim/probabilities.html'
        },
        {
            id: 'formula_probability_empirical',
            type: 'FORMULA',
            subject: 'Data Mining',
            topic: 'Probabilities',
            aliases: ['empirical probability', 'relative frequency', 'experimental probability', 'frequency probability'],
            title: 'Empirical (Experimental) Probability Formula',
            summary: `**Empirical / Relative Frequency Probability Definition**:\n\n\\[ P(A) = \\frac{f}{N} = \\frac{\\text{Frequency of Event A Observed}}{\\text{Total Number of Trials / Observations}} \\]\n\n• **f**: Observed frequency of event A\n• **N**: Total number of trials/observations\n\n• **Law of Large Numbers**: As \\( N \\to \\infty \\), the empirical probability \\( P(A) \\) converges to the theoretical classical probability.`,
            clues: 'Use when probability is calculated from historical data tables, recorded test results, or laboratory experiments. Look for keywords: "Based on survey...", "Observed in past records...", "Experimental trials".',
            example: 'A factory tests 500 light bulbs and finds 15 defective:\n• P(Defective) = 15 / 500 = 0.03 (3%)',
            link: '/subject/dataMining/prelim/probabilities.html'
        },
        {
            id: 'formula_complement',
            type: 'FORMULA',
            subject: 'Data Mining',
            topic: 'Probabilities',
            aliases: ['complement rule', 'complement formula', 'not a', 'p not a', 'at least one'],
            title: 'The Complement Probability Rule',
            summary: `**Complement Probability Rule**:\n\n\\[ P(A') = 1 - P(A) \\quad \\text{or} \\quad P(\\text{not } A) = 1 - P(A) \\]\n\n\\[ P(\\text{at least one success}) = 1 - P(\\text{all failures}) \\]\n\n• **P(A)**: Probability that event A occurs\n• **P(A\')**: Probability that event A does NOT occur\n• \\( P(A) + P(A') = 1.0 \\)`,
            clues: 'Use whenever calculating "at least one", "none", or when finding the opposite event is much easier than computing all positive combinations.',
            example: 'If probability of rain is 0.35, probability of NO rain is:\n• P(No Rain) = 1 - 0.35 = 0.65 (65%)',
            link: '/subject/dataMining/prelim/probabilities.html'
        },
        {
            id: 'formula_addition_rule',
            type: 'FORMULA',
            subject: 'Data Mining',
            topic: 'Sets & Events',
            aliases: ['addition rule', 'union formula', 'p a or b', 'p a union b', 'mutually exclusive'],
            title: 'Addition Rule for Probability (Union)',
            summary: `**General Addition Rule (Any two events A and B)**:\n\n\\[ P(A \\cup B) = P(A) + P(B) - P(A \\cap B) \\]\n\n**Special Rule for Mutually Exclusive (Disjoint) Events \\( (A \\cap B = \\emptyset) \\)**:\n\n\\[ P(A \\cup B) = P(A) + P(B) \\]`,
            clues: 'Use when the question asks for the probability of "A OR B" occurring. Look for the keyword "or" or "either".',
            example: 'Drawing a King or a Heart from a standard 52-card deck:\n• P(King) = 4/52, P(Heart) = 13/52, P(King ∩ Heart) = 1/52\n• P(King ∪ Heart) = 4/52 + 13/52 - 1/52 = 16/52 = 4/13 ≈ 0.3077',
            link: '/subject/dataMining/prelim/setsEventsBayesianInference.html'
        },
        {
            id: 'formula_conditional_probability',
            type: 'FORMULA',
            subject: 'Data Mining',
            topic: 'Sets & Events',
            aliases: ['conditional probability', 'p a given b', 'given that', 'conditional probability formula'],
            title: 'Conditional Probability Formula',
            summary: `**Conditional Probability of A Given B**:\n\n\\[ P(A | B) = \\frac{P(A \\cap B)}{P(B)} \\quad [\\text{where } P(B) > 0] \\]\n\n• **P(A|B)**: Probability of event A occurring given that event B has already occurred\n• **P(A ∩ B)**: Joint probability of both A and B occurring\n• **P(B)**: Probability of the conditioning event B (the reduced sample space)`,
            clues: 'Use when prior information or condition is given. Look for keywords: "given that...", "if it is known that...", "among those who...".',
            example: 'In a class, 30% play soccer and basketball, and 50% play soccer. Probability a student plays basketball given they play soccer:\n• P(Basketball | Soccer) = 0.30 / 0.50 = 0.60 (60%)',
            link: '/subject/dataMining/prelim/setsEventsBayesianInference.html'
        },
        {
            id: 'formula_bayes_theorem',
            type: 'FORMULA',
            subject: 'Data Mining',
            topic: 'Bayesian Inference',
            aliases: ['bayes', 'bayes theorem', 'bayesian formula', 'posterior probability', 'bayes law', 'what is bayes theorem'],
            title: 'Bayes\' Theorem & Inverse Probability',
            summary: `**Bayes\' Theorem Formula**:\n\n\\[ P(H | E) = \\frac{P(E | H) \\cdot P(H)}{P(E)} = \\frac{P(E | H) \\cdot P(H)}{\\sum_{i} P(E | H_i) \\cdot P(H_i)} \\]\n\n• **P(H|E)**: Posterior Probability (updated probability of hypothesis after seeing evidence)\n• **P(E|H)**: Likelihood (probability of evidence given hypothesis is true)\n• **P(H)**: Prior Probability (initial belief before evidence)\n• **P(E)**: Marginal Probability of Evidence (Total Probability Law)`,
            clues: 'Use for medical test diagnostics (true/false positive rates), spam filtering, or reversing conditional probability direction (e.g. given P(B|A), find P(A|B)).',
            example: 'Disease prevalence P(D) = 0.01. Test accuracy P(+|D) = 0.95. False positive P(+|D\') = 0.05.\n• P(+) = (0.95)(0.01) + (0.05)(0.99) = 0.0095 + 0.0495 = 0.059\n• P(D|+) = (0.95 * 0.01) / 0.059 = 0.0095 / 0.059 ≈ 0.161 (16.1%)',
            link: '/subject/dataMining/prelim/setsEventsBayesianInference.html'
        },
        {
            id: 'formula_binomial_distribution',
            type: 'FORMULA',
            subject: 'Data Mining',
            topic: 'Probability Distributions',
            aliases: ['binomial distribution', 'binomial formula', 'bernoulli trials', 'binomial mean', 'binomial variance'],
            title: 'Binomial Probability Distribution Formula',
            summary: `**Binomial Distribution Formula**:\n\n\\[ P(X = k) = \\binom{n}{k} p^k (1 - p)^{n - k} = \\frac{n!}{k!(n - k)!} p^k (1 - p)^{n - k} \\]\n\n• **n**: Total number of independent trials\n• **k**: Number of successful trials \\( (k = 0, 1, 2, \\dots, n) \\)\n• **p**: Probability of success on a single trial\n• **(1 - p) or q**: Probability of failure on a single trial\n\n### Key Statistical Properties:\n• **Mean (Expected Value)**: \\( \\mu = n \\cdot p \\)\n• **Variance**: \\( \\sigma^2 = n \\cdot p \\cdot (1 - p) \\)\n• **Standard Deviation**: \\( \\sigma = \\sqrt{n \\cdot p \\cdot (1 - p)} \\)`,
            clues: 'Use when there are a fixed number of n independent trials, exactly two outcomes (success/failure), and constant probability p.',
            link: '/subject/dataMining/prelim/probabilityDistribution.html'
        },
        {
            id: 'formula_poisson_distribution',
            type: 'FORMULA',
            subject: 'Data Mining',
            topic: 'Probability Distributions',
            aliases: ['poisson distribution', 'poisson formula', 'poisson rate', 'poisson mean variance'],
            title: 'Poisson Probability Distribution Formula',
            summary: `**Poisson Distribution Formula**:\n\n\\[ P(X = k) = \\frac{e^{-\\lambda} \\lambda^k}{k!} \\]\n\n• **λ (lambda)**: Average arrival rate / expected number of occurrences per interval\n• **k**: Number of occurrences \\( (k = 0, 1, 2, \\dots) \\)\n• **e**: Euler\'s constant \\( \\approx 2.71828 \\)\n\n### Special Property:\n• **Mean**: \\( \\mu = \\lambda \\)\n• **Variance**: \\( \\sigma^2 = \\lambda \\) *(Mean strictly equals Variance!)*\n• **Standard Deviation**: \\( \\sigma = \\sqrt{\\lambda} \\)`,
            clues: 'Use for counting rare events occurring in a fixed continuous interval of time, area, or volume. Look for keywords: "average rate of arrivals per hour", "defects per square meter".',
            link: '/subject/dataMining/prelim/probabilityDistribution.html'
        },
        {
            id: 'formula_normalization',
            type: 'FORMULA',
            subject: 'Data Mining',
            topic: 'Data Preprocessing',
            aliases: ['normalization formula', 'min max normalization', 'z score formula', 'standardization formula', 'z score', 'min-max'],
            title: 'Data Normalization: Min-Max Scaling & Z-Score Standardization',
            summary: `• **Min-Max Normalization** (rescales data to range [new_min, new_max], typically [0, 1]):\n\n\\[ v' = \\frac{v - \\min_A}{\\max_A - \\min_A} \\times (\\text{new\\_max}_A - \\text{new\\_min}_A) + \\text{new\\_min}_A \\]\n\n• **Z-Score Standardization** (transforms data to mean \\( \\mu = 0 \\), standard deviation \\( \\sigma = 1 \\)):\n\n\\[ z = \\frac{x - \\mu}{\\sigma} \\]\n\n• **IQR Outlier Detection**:\n  - \\( \\text{IQR} = Q3 - Q1 \\)\n  - Outlier lower bound: \\( Q1 - 1.5 \\times \\text{IQR} \\)\n  - Outlier upper bound: \\( Q3 + 1.5 \\times \\text{IQR} \\)`,
            clues: 'Use when scaling numerical features for distance-based ML models (KNN/K-Means) or standardizing normal distributions.',
            link: '/subject/dataMining/prelim/traditionalDataTechniques.html'
        },

        // --- PIONEERS & HISTORICAL FIGURES ---
        {
            id: 'alan_turing',
            type: 'CONCEPT',
            subject: 'Automata Theory',
            topic: 'Pioneers in Computing',
            aliases: ['alan turing', 'turing', 'who is alan turing', 'father of computer science', 'turing machine inventor'],
            title: 'Alan Turing (1912–1954) — Father of Theoretical Computer Science',
            summary: `**Alan Mathison Turing** was an English mathematician, computer scientist, and logician regarded as the father of modern computer science and AI.\n\n• **Turing Machine (1936)**: Introduced the universal abstract model of digital computation with an infinite tape and read/write head.\n• **Halting Problem**: Proved via diagonalization that there exist mathematically undecidable problems that no algorithm can ever solve.\n• **Enigma Codebreaker**: Designed the electro-mechanical *Bombe* machine at Bletchley Park, cracking the German WWII Enigma ciphers.\n• **Turing Test (1950)**: Proposed the standard operational test for evaluating machine intelligence.`,
            clues: 'Questions asking who invented the Turing Machine, proved undecidability of the Halting Problem, broke the Enigma cipher, or proposed the Turing Test.',
            link: '/subject/automataTheory/prelim/automataComputabilityAndComplexity.html'
        },
        {
            id: 'noam_chomsky',
            type: 'CONCEPT',
            subject: 'Automata Theory',
            topic: 'Pioneers in Computing',
            aliases: ['noam chomsky', 'chomsky', 'who is chomsky', 'chomsky hierarchy'],
            title: 'Noam Chomsky — Formal Language Theory & Grammars',
            summary: `**Noam Chomsky** is an American linguist and scientist who formulated the **Chomsky Hierarchy (1956)**, classifying formal languages and automata into 4 levels:\n\n1. **Type 3 (Regular Languages)**: Recognized by Finite Automata (DFA/NFA) / Regular Expressions.\n2. **Type 2 (Context-Free Languages)**: Recognized by Pushdown Automata (PDA) using a stack / CFGs.\n3. **Type 1 (Context-Sensitive Languages)**: Recognized by Linear Bounded Automata (LBA).\n4. **Type 0 (Recursively Enumerable Languages)**: Recognized by Turing Machines (Unrestricted Grammars).`,
            clues: 'Questions classifying formal grammars or matching machine architectures to language classes.',
            link: '/subject/automataTheory/prelim/introductionToAutomataTheoryFormalLanguages.html'
        },

        // --- OPERATING SYSTEM CONFIGURATION ---
        {
            id: 'what_is_os',
            type: 'CONCEPT',
            subject: 'Operating System Configuration',
            topic: 'OS Fundamentals',
            aliases: ['what is an os', 'what is os', 'operating system definition', 'what is operating system', 'os definition', 'role of os'],
            title: 'What is an Operating System (OS)?',
            summary: `An **Operating System (OS)** is system software that acts as an intermediary between computer hardware and user application programs.\n\n### Primary Core Roles:\n1. **Resource Manager**: Manages and allocates CPU time (Scheduling), RAM Memory (Paging/Virtual Memory), File Systems, and I/O devices.\n2. **Hardware Abstraction Layer**: Exposes standardized APIs called **System Calls** (e.g. \`open()\`, \`read()\`, \`fork()\`), shielding applications from hardware differences.\n3. **Protection & Isolation**: Enforces **Dual-Mode Execution** (User Mode Ring 3 vs Kernel Mode Ring 0) to prevent buggy apps from crashing the machine.`,
            clues: 'Questions asking for the definition, roles, or architectural purpose of an operating system.',
            link: '/subject/operatingSystemConfiguration/prelim/introductionToOperatingSystems.html'
        },
        {
            id: 'cpu_scheduling',
            type: 'CONCEPT',
            subject: 'Operating System Configuration',
            topic: 'CPU Scheduling',
            aliases: ['cpu scheduling', 'scheduling algorithms', 'fcfs', 'sjf', 'round robin', 'srtf', 'convoy effect', 'time quantum'],
            title: 'CPU Scheduling Algorithms (FCFS, SJF, SRTF, Round Robin)',
            summary: `• **FCFS (First-Come First-Served)**: Non-preemptive, simple, but suffers from the **Convoy Effect** (short processes wait behind long ones).\n• **SJF (Shortest Job First)**: Non-preemptive, provably **optimal minimum average waiting time**, but risks starvation of long jobs.\n• **SRTF (Shortest Remaining Time First)**: Preemptive SJF.\n• **Round Robin (RR)**: Preemptive, allocates fixed **Time Quantum (q)** in circular FIFO queue. High responsiveness.\n\n### Scheduling Formulas:\n• **Turnaround Time** = Completion Time - Arrival Time\n• **Waiting Time** = Turnaround Time - Burst Time`,
            clues: 'Questions on Gantt chart calculations, average waiting times, convoy effect, or time quantum tuning.',
            link: '/subject/operatingSystemConfiguration/prelim/osStructuresAndSystemCalls.html'
        },

        // --- AUTOMATA THEORY ---
        {
            id: 'dfa_vs_nfa',
            type: 'CONCEPT',
            subject: 'Automata Theory',
            topic: 'Finite Automata',
            aliases: ['dfa', 'nfa', 'dfa vs nfa', 'difference between dfa and nfa', 'subset construction', 'deterministic finite automata'],
            title: 'Deterministic vs Non-Deterministic Finite Automata (DFA vs NFA)',
            summary: `• **DFA (Deterministic Finite Automata)**:\n  - 5-tuple \\( M = (Q, \\Sigma, \\delta, q_0, F) \\)\n  - Transition function \\( \\delta: Q \\times \\Sigma \\to Q \\)\n  - Exactly ONE transition per state and symbol. No ε-transitions.\n\n• **NFA (Non-Deterministic Finite Automata)**:\n  - Transition function \\( \\delta: Q \\times \\Sigma \\to 2^Q \\)\n  - Can transition to 0, 1, or multiple states. Allows ε-transitions.\n\n• **Power Equivalence**:\n  - NFAs and DFAs have identical recognition power (both accept Type 3 Regular Languages).\n  - Any NFA with n states converts to an equivalent DFA with at most **2ⁿ states** via Subset Construction.`,
            clues: 'Questions comparing DFA and NFA, defining transition functions, or calculating maximum DFA states (2ⁿ).',
            link: '/subject/automataTheory/prelim/automataComputabilityAndComplexity.html'
        },

        // --- INFORMATION ASSURANCE & SECURITY ---
        {
            id: 'cia_triad',
            type: 'CONCEPT',
            subject: 'Information Assurance & Security',
            topic: 'Security Foundations',
            aliases: ['cia triad', 'cia', 'confidentiality', 'integrity', 'availability', 'non-repudiation', 'defense in depth'],
            title: 'The CIA Triad & Core Security Principles',
            summary: `• **Confidentiality**: Prevents unauthorized disclosure of information (Encryption AES/RSA, ACLs, Data Masking).\n• **Integrity**: Prevents unauthorized modification or tampering of data (Cryptographic Hashes SHA-256, Digital Signatures).\n• **Availability**: Ensures timely and reliable access for authorized users (Redundancy, Backups, RAID, DDoS Mitigation).\n\n• **Non-Repudiation**: Inability of a sender to deny an action/message (Digital Signatures, PKI, Audit Logs).\n• **Defense in Depth**: Layered security across physical, technical, and administrative controls.`,
            clues: 'Questions categorizing security incidents, data breaches, or compliance requirements under CIA principles.',
            link: '/subject/informationAssuranceAndSecurity/prelim/week1And2.html'
        }
    ];

    // ========================================================================
    // 2. GEMINI-STYLE INTERACTIVE QUIZ BANK
    // ========================================================================
    const QUIZ_BANK = [
        {
            id: 'q_at_turing',
            subject: 'Automata Theory',
            topic: 'Computability',
            question: 'Which pioneering computer scientist introduced the concept of an abstract machine with an infinite tape in 1936 and proved the undecidability of the Halting Problem?',
            options: [
                'Noam Chomsky (formulated the 4-level grammar hierarchy)',
                'Alan Turing (formulated universal computation & undecidability)',
                'John von Neumann (designed stored-program architecture)',
                'Claude Shannon (established modern mathematical information theory)'
            ],
            correct: 1,
            explanation: 'Alan Turing introduced the Turing Machine in his 1936 paper and proved that the Halting Problem cannot be solved by any universal algorithm.'
        },
        {
            id: 'q_os_def',
            subject: 'Operating System Configuration',
            topic: 'OS Fundamentals',
            question: 'What is the primary architectural purpose of an Operating System executing in Dual-Mode (User Mode vs. Kernel Mode)?',
            options: [
                'To accelerate compilation of C programs via hardware pipeline parallelism',
                'To prevent errant user applications from corrupting hardware or system memory',
                'To automatically format secondary disk storage partitions during system boot',
                'To eliminate the need for device driver kernel modules and interrupt handlers'
            ],
            correct: 1,
            explanation: 'Dual-Mode operation isolates user applications in unprivileged Ring 3, requiring hardware traps/system calls to access Ring 0 kernel operations, protecting system stability.'
        },
        {
            id: 'q_dm_bayes',
            subject: 'Data Mining',
            topic: 'Bayes Theorem',
            question: 'In Bayesian inference, what does the term P(E|H) represent in the formula P(H|E) = [P(E|H) * P(H)] / P(E)?',
            options: [
                'Posterior Probability (updated belief given observed evidence)',
                'Prior Probability (initial baseline hypothesis belief)',
                'Likelihood (probability of observing evidence given hypothesis)',
                'Marginal Evidence (total probability across all hypotheses)'
            ],
            correct: 2,
            explanation: 'P(E|H) is the Likelihood — the probability of observing the evidence E given that the hypothesis H is true.'
        },
        {
            id: 'q_dm_prob_def',
            subject: 'Data Mining',
            topic: 'Probabilities',
            question: 'What is the Classical Probability formula for an event A in a finite sample space S of equally likely outcomes?',
            options: [
                'P(A) = n(S) / n(A) [Total outcomes divided by favorable outcomes]',
                'P(A) = n(A) / n(S) [Favorable outcomes divided by total sample space outcomes]',
                'P(A) = n(A) * n(S) [Favorable outcomes multiplied by total sample space outcomes]',
                'P(A) = 1 - n(A)    [Complement of favorable outcomes in sample space]'
            ],
            correct: 1,
            explanation: 'The Classical Probability formula is P(A) = n(A) / n(S), where n(A) is favorable outcomes and n(S) is total sample space outcomes.'
        }
    ];

    // ========================================================================
    // 3. ADVANCED NLP MATCHER WITH TYPO TOLERANCE & LEVENSHTEIN DISTANCE
    // ========================================================================
    const TYPO_MAP = {
        'whatss': 'what is',
        'whats': 'what is',
        'wat': 'what',
        'prabability': 'probability',
        'probablity': 'probability',
        'probbability': 'probability',
        'formla': 'formula',
        'formuls': 'formula',
        'equasion': 'equation',
        'turingg': 'turing',
        'allan': 'alan',
        'chomsky': 'chomsky',
        'schedulin': 'scheduling',
        'shedule': 'schedule',
        'noramlization': 'normalization',
        'noraml': 'normal',
        'posson': 'poisson',
        'poison': 'poisson',
        'binomal': 'binomial'
    };

    function normalizeQuery(str) {
        let clean = (str || '').toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Apply typo correction
        const words = clean.split(' ').map(w => TYPO_MAP[w] || w);
        return words.join(' ');
    }

    function levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    function searchKnowledgeBase(query, subjectFilter = 'all') {
        const norm = normalizeQuery(query);
        const tokens = norm.split(' ').filter(t => t.length > 1 && !['the', 'is', 'for', 'and', 'are', 'what', 'who', 'how'].includes(t));
        const isFormulaQuery = norm.includes('formula') || norm.includes('equation') || norm.includes('calculate');

        let bestMatch = null;
        let highestScore = 0;

        for (const item of KNOWLEDGE_GRAPH) {
            if (subjectFilter !== 'all' && item.subject.toLowerCase() !== subjectFilter.toLowerCase()) {
                continue;
            }

            let score = 0;

            // Prioritize FORMULA type if user explicitly asked for formula
            if (isFormulaQuery && item.type === 'FORMULA') {
                score += 25;
            } else if (!isFormulaQuery && item.type === 'FORMULA') {
                score -= 10;
            }

            // Direct alias matching (Exact or substring)
            if (item.aliases) {
                for (const alias of item.aliases) {
                    if (norm === alias || norm.includes(alias)) {
                        score += 50;
                    } else if (alias.includes(norm)) {
                        score += 30;
                    } else {
                        // Fuzzy check for close alias match
                        const dist = levenshteinDistance(norm, alias);
                        if (dist <= 2) score += 40;
                    }
                }
            }

            // Token matching
            const itemText = (item.title + ' ' + item.topic + ' ' + item.summary + ' ' + (item.aliases ? item.aliases.join(' ') : '')).toLowerCase();
            for (const token of tokens) {
                if (itemText.includes(token)) {
                    score += 8;
                } else {
                    // Check fuzzy token match
                    for (const itemWord of itemText.split(' ')) {
                        if (itemWord.length >= 4 && token.length >= 4 && levenshteinDistance(token, itemWord) <= 1) {
                            score += 5;
                            break;
                        }
                    }
                }
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = item;
            }
        }

        return highestScore >= 12 ? bestMatch : null;
    }

    function getQuizQuestions(subjectFilter = 'all', count = 1, requestedTopic = null) {
        let pool = QUIZ_BANK;
        if (subjectFilter !== 'all') {
            pool = pool.filter(q => q.subject.toLowerCase().includes(subjectFilter.toLowerCase()));
        }

        if (requestedTopic) {
            const topicNorm = normalizeQuery(requestedTopic);
            const topicFiltered = pool.filter(q => 
                normalizeQuery(q.topic).includes(topicNorm) || 
                normalizeQuery(q.question).includes(topicNorm) ||
                normalizeQuery(q.subject).includes(topicNorm)
            );
            if (topicFiltered.length > 0) pool = topicFiltered;
        }

        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    // ========================================================================
    // 4. CHATBOT UI CONTROLLER & WHITEBOARD EMBED
    // ========================================================================
    class StudyChatbotController {
        constructor() {
            this.isOpen = false;
            this.currentSubject = 'all';
            this.messages = [];
            this.sessionScore = { correct: 0, total: 0 };
            this.ttsVoice = null;
            this.isSpeaking = false;
            this.isWhiteboard = window.location.pathname.toLowerCase().includes('whiteboard');

            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.mount());
            } else {
                this.mount();
            }
        }

        mount() {
            if (document.getElementById('ai-study-chatbot-root')) return;

            const root = document.createElement('div');
            root.id = 'ai-study-chatbot-root';
            root.innerHTML = this.renderTemplate();
            document.body.appendChild(root);

            this.bindElements();
            this.loadSessionState();
            this.initJarvisVoice();

            if (this.messages.length === 0) {
                this.addBotMessage(
                    "👋 **Hello Scholar!** I am your **100% Offline AI Study Assistant & Quiz Tutor**.\n\nI have the complete knowledge base of your reviewer across **Data Mining**, **Automata Theory**, **IAS Security**, and **OS Configuration**.\n\n💡 **Try asking me:**\n• *\"What is the formula for probability?\"*\n• *\"Who is Alan Turing?\"*\n• *\"What is an OS?\"*\n• *\"Quiz me on Bayes Theorem\"*",
                    true
                );
            }
        }

        renderTemplate() {
            const triggerClass = this.isWhiteboard ? 'ai-chat-trigger ai-trigger-whiteboard' : 'ai-chat-trigger';
            const triggerContent = this.isWhiteboard 
                ? `<span class="ai-trigger-icon" title="Ask AI Study Assistant">🤖</span>` 
                : `<span class="ai-trigger-icon">🤖</span><span class="ai-trigger-label">Ask AI Tutor</span><span class="ai-trigger-badge">Offline ⚡</span>`;

            return `
            <!-- Floating Trigger Button -->
            <button id="ai-chat-trigger" class="${triggerClass}" aria-label="Open AI Study Assistant">
                ${triggerContent}
            </button>

            <!-- Modern Glassmorphic Chat Drawer / Modal -->
            <div id="ai-chat-modal" class="ai-chat-modal" style="display: none;">
                <!-- Header -->
                <div class="ai-chat-header">
                    <div class="ai-chat-header-info">
                        <div class="ai-avatar">🤖</div>
                        <div class="ai-header-titles">
                            <div class="ai-title">AI Study Assistant <span class="ai-badge-chip">100% Local</span></div>
                            <div class="ai-subtitle" id="ai-score-status">Score: 0/0 (0%) • All Subjects</div>
                        </div>
                    </div>
                    <div class="ai-header-actions">
                        <select id="ai-subject-filter" class="ai-subject-select" title="Filter by Subject">
                            <option value="all">📚 All Subjects</option>
                            <option value="Data Mining">📊 Data Mining</option>
                            <option value="Automata Theory">🤖 Automata Theory</option>
                            <option value="Information Assurance & Security">🔒 IAS Security</option>
                            <option value="Operating System Configuration">⚙️ OS Config</option>
                        </select>
                        <button id="ai-btn-halt" class="ai-hdr-btn ai-halt-btn" style="display: none;" title="Halt Voice (Stop Speaking)" aria-label="Halt Voice">⏹️ Halt</button>
                        <button id="ai-btn-clear" class="ai-hdr-btn" title="Clear Chat" aria-label="Clear chat">🗑️</button>
                        <button id="ai-btn-close" class="ai-hdr-btn ai-close-btn" title="Close Chat" aria-label="Close">✕</button>
                    </div>
                </div>

                <!-- Quick Action Prompt Chips -->
                <div class="ai-quick-chips">
                    <button class="ai-chip" data-prompt="What is the formula for probability?">📐 Probability Formula</button>
                    <button class="ai-chip" data-prompt="What is Bayes Theorem?">📊 Bayes Formula</button>
                    <button class="ai-chip" data-prompt="Who is Alan Turing?">🧠 Alan Turing</button>
                    <button class="ai-chip" data-prompt="What is an Operating System?">💻 What is an OS?</button>
                    <button class="ai-chip" data-prompt="Explain DFA vs NFA in Automata">🤖 DFA vs NFA</button>
                    <button class="ai-chip" data-prompt="Quiz me with random questions">🎲 Quick Quiz</button>
                </div>

                <!-- Chat Stream Body -->
                <div id="ai-chat-messages" class="ai-chat-messages"></div>

                <!-- Input Footer -->
                <div class="ai-chat-footer">
                    <div class="ai-input-wrap">
                        <textarea id="ai-chat-input" class="ai-chat-input" placeholder="Ask anything or 'quiz me on...' (Enter to send)" rows="1"></textarea>
                        <button id="ai-btn-send" class="ai-btn-send" aria-label="Send message">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }

        bindElements() {
            this.triggerBtn = document.getElementById('ai-chat-trigger');
            this.modal = document.getElementById('ai-chat-modal');
            this.closeBtn = document.getElementById('ai-btn-close');
            this.clearBtn = document.getElementById('ai-btn-clear');
            this.haltBtn = document.getElementById('ai-btn-halt');
            this.subjectSelect = document.getElementById('ai-subject-filter');
            this.messagesContainer = document.getElementById('ai-chat-messages');
            this.chatInput = document.getElementById('ai-chat-input');
            this.sendBtn = document.getElementById('ai-btn-send');
            this.scoreStatus = document.getElementById('ai-score-status');

            this.triggerBtn.addEventListener('click', () => this.toggleModal());
            this.closeBtn.addEventListener('click', () => this.closeModal());

            // Bind Whiteboard Top Bar & Mobile Menu Buttons
            const wbTopBtn = document.getElementById('btn-ai-tutor-wb');
            if (wbTopBtn) {
                wbTopBtn.addEventListener('click', () => this.toggleModal());
            }
            const wbMobBtn = document.getElementById('mob-btn-ai-tutor');
            if (wbMobBtn) {
                wbMobBtn.addEventListener('click', () => {
                    const mobModal = document.getElementById('wb-mobile-menu-modal');
                    if (mobModal) mobModal.classList.remove('open');
                    this.toggleModal();
                });
            }
            this.clearBtn.addEventListener('click', () => this.clearChat());
            this.haltBtn.addEventListener('click', () => this.haltSpeech());

            this.subjectSelect.addEventListener('change', (e) => {
                this.currentSubject = e.target.value;
                this.updateScoreBadge();
            });

            document.querySelectorAll('.ai-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const prompt = chip.getAttribute('data-prompt');
                    if (prompt) this.handleUserInput(prompt);
                });
            });

            this.sendBtn.addEventListener('click', () => this.submitInput());
            this.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.submitInput();
                }
            });

            this.chatInput.addEventListener('input', () => {
                this.chatInput.style.height = 'auto';
                this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 100) + 'px';
            });
        }

        toggleModal() {
            this.isOpen = !this.isOpen;
            this.modal.style.display = this.isOpen ? 'flex' : 'none';
            this.triggerBtn.style.display = this.isOpen ? 'none' : 'flex';
            if (this.isOpen) {
                this.scrollToBottom();
                setTimeout(() => this.chatInput.focus(), 150);
            } else {
                this.haltSpeech();
            }
        }

        closeModal() {
            this.isOpen = false;
            this.modal.style.display = 'none';
            this.triggerBtn.style.display = 'flex';
            this.haltSpeech();
        }

        submitInput() {
            const text = this.chatInput.value.trim();
            if (!text) return;

            this.chatInput.value = '';
            this.chatInput.style.height = 'auto';
            this.handleUserInput(text);
        }

        handleUserInput(userText) {
            this.addUserMessage(userText);

            const norm = normalizeQuery(userText);
            const quizTriggers = ['quiz', 'test', 'question', 'exam', 'practice', 'test me', 'quiz me'];
            const isQuizIntent = quizTriggers.some(t => norm.includes(t));

            setTimeout(() => {
                if (isQuizIntent) {
                    this.generateQuizResponse(userText, norm);
                } else {
                    this.generateKnowledgeResponse(userText, norm);
                }
            }, 80);
        }

        generateQuizResponse(originalQuery, norm) {
            const questions = getQuizQuestions(this.currentSubject, 1, norm);
            if (questions.length === 0) {
                const fallback = getQuizQuestions(this.currentSubject, 1, null);
                if (fallback.length > 0) this.renderInteractiveQuizCard(fallback[0]);
                return;
            }
            this.renderInteractiveQuizCard(questions[0]);
        }

        renderInteractiveQuizCard(q) {
            const cardId = 'quiz_card_' + Math.random().toString(36).substring(2, 9);
            
            let html = `
            <div class="ai-quiz-card" id="${cardId}">
                <div class="ai-quiz-hdr">
                    <span class="ai-quiz-badge">🎯 ${q.subject} • ${q.topic}</span>
                </div>
                <div class="ai-quiz-q">${this.formatMarkdown(q.question)}</div>
                <div class="ai-quiz-opts">
            `;

            const letters = ['A', 'B', 'C', 'D'];
            q.options.forEach((opt, idx) => {
                html += `
                    <button class="ai-quiz-opt" data-opt-idx="${idx}">
                        <span class="ai-opt-letter">${letters[idx]}</span>
                        <span class="ai-opt-text">${opt}</span>
                    </button>
                `;
            });

            html += `
                </div>
                <div class="ai-quiz-feedback" style="display: none;"></div>
                <div class="ai-quiz-actions" style="display: none;">
                    <button class="ai-btn-quiz-next">➡️ Next Question</button>
                    <button class="ai-btn-quiz-mistake">➕ Save to Mistakes</button>
                </div>
            </div>
            `;

            const msgDiv = document.createElement('div');
            msgDiv.className = 'ai-msg ai-msg-bot';
            msgDiv.innerHTML = html;
            this.messagesContainer.appendChild(msgDiv);
            this.scrollToBottom();

            const cardEl = msgDiv.querySelector(`#${cardId}`);
            const optBtns = cardEl.querySelectorAll('.ai-quiz-opt');
            const feedbackEl = cardEl.querySelector('.ai-quiz-feedback');
            const actionsEl = cardEl.querySelector('.ai-quiz-actions');
            const nextBtn = cardEl.querySelector('.ai-btn-quiz-next');
            const mistakeBtn = cardEl.querySelector('.ai-btn-quiz-mistake');

            let answered = false;

            optBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (answered) return;
                    answered = true;

                    const chosenIdx = parseInt(btn.getAttribute('data-opt-idx'), 10);
                    const isCorrect = (chosenIdx === q.correct);

                    this.sessionScore.total++;
                    if (isCorrect) this.sessionScore.correct++;
                    this.updateScoreBadge();

                    optBtns.forEach((b, i) => {
                        b.disabled = true;
                        if (i === q.correct) b.classList.add('correct');
                        else if (i === chosenIdx && !isCorrect) b.classList.add('incorrect');
                    });

                    feedbackEl.style.display = 'block';
                    if (isCorrect) {
                        feedbackEl.className = 'ai-quiz-feedback correct';
                        feedbackEl.innerHTML = `<strong>✅ Correct!</strong> ${this.formatMarkdown(q.explanation)}`;
                        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
                    } else {
                        feedbackEl.className = 'ai-quiz-feedback incorrect';
                        feedbackEl.innerHTML = `<strong>❌ Incorrect.</strong> Correct answer is <strong>${letters[q.correct]}) ${q.options[q.correct]}</strong>.<br><br>${this.formatMarkdown(q.explanation)}`;
                        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
                    }

                    actionsEl.style.display = 'flex';
                    this.speakJarvis(isCorrect ? `Correct! ${q.explanation}` : `Incorrect. The correct answer is ${letters[q.correct]}. ${q.explanation}`);
                    this.saveSessionState();
                });
            });

            nextBtn.addEventListener('click', () => {
                this.generateQuizResponse("next question", "quiz");
            });

            mistakeBtn.addEventListener('click', () => {
                this.saveQuestionToMistakes(q);
                mistakeBtn.disabled = true;
                mistakeBtn.textContent = '✅ Saved';
            });
        }

        saveQuestionToMistakes(q) {
            try {
                const mistakes = JSON.parse(localStorage.getItem('student_mistakes_notebook') || '[]');
                mistakes.push({
                    id: 'mistake_' + Date.now(),
                    subject: q.subject,
                    topic: q.topic,
                    question: q.question,
                    correctAnswer: q.options[q.correct],
                    explanation: q.explanation,
                    dateAdded: new Date().toISOString()
                });
                localStorage.setItem('student_mistakes_notebook', JSON.stringify(mistakes));
                if (window.toast) window.toast('📓 Saved to Mistakes');
            } catch (e) {}
        }

        generateKnowledgeResponse(query, norm) {
            const match = searchKnowledgeBase(query, this.currentSubject);

            if (match) {
                let response = `### 📖 **${match.title}**\n*Subject: ${match.subject} • Topic: ${match.topic}*\n\n${match.summary}\n\n`;
                if (match.clues) {
                    response += `> **🎯 When to Use / Question Clues:**\n> ${match.clues}\n\n`;
                }
                if (match.example) {
                    response += `> **💡 Worked Example:**\n> ${match.example}\n\n`;
                }
                if (match.link) {
                    response += `🔗 **[Open Module Study Guide](${match.link})**\n\n`;
                }
                response += `💡 *Tip: Ask me to \"Quiz me on ${match.topic}\" to test yourself!*`;

                this.addBotMessage(response);
            } else {
                this.addBotMessage(
                    `I couldn't find an exact match for **"${query}"**.\n\nTry asking me:\n• **Formulas**: *What is the formula for probability?*, *Bayes Theorem formula*, *Z-score formula*\n• **Pioneers**: *Who is Alan Turing?*, *Who is Noam Chomsky?*\n• **Concepts**: *What is an OS?*, *CPU Scheduling*, *DFA vs NFA*, *CIA Triad*\n\nOr click **🎲 Quick Quiz** to challenge yourself!`
                );
            }
        }

        addUserMessage(text) {
            this.messages.push({ role: 'user', content: text });
            const msgDiv = document.createElement('div');
            msgDiv.className = 'ai-msg ai-msg-user';
            msgDiv.innerHTML = `<div class="ai-msg-bubble">${this.escapeHtml(text)}</div>`;
            this.messagesContainer.appendChild(msgDiv);
            this.scrollToBottom();
            this.saveSessionState();
        }

        addBotMessage(markdownText, isGreeting = false) {
            this.messages.push({ role: 'bot', content: markdownText });
            const msgDiv = document.createElement('div');
            msgDiv.className = 'ai-msg ai-msg-bot';
            
            const bubbleHtml = `
                <div class="ai-msg-bubble">
                    ${this.formatMarkdown(markdownText)}
                    <div class="ai-msg-tools">
                        <button class="ai-msg-speak-btn" title="Speak response">🔊 Listen</button>
                    </div>
                </div>
            `;
            msgDiv.innerHTML = bubbleHtml;
            this.messagesContainer.appendChild(msgDiv);
            this.scrollToBottom();
            this.saveSessionState();

            const speakBtn = msgDiv.querySelector('.ai-msg-speak-btn');
            if (speakBtn) {
                speakBtn.addEventListener('click', () => {
                    const cleanText = markdownText.replace(/[*_#>`\\[\\]]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
                    this.speakJarvis(cleanText);
                });
            }

            if (!isGreeting) {
                const cleanText = markdownText.replace(/[*_#>`\\[\\]]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
                this.speakJarvis(cleanText);
            }
        }

        formatMarkdown(md) {
            if (!md) return '';
            let html = md;
            
            // Display math formatting
            html = html.replace(/\\\[([\s\S]*?)\\\]/g, '<div class="ai-math-display">$1</div>');
            html = html.replace(/\\\(([\s\S]*?)\\\)/g, '<span class="ai-math-inline">$1</span>');

            html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
            html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
            html = html.replace(/### (.*?)\n/g, '<h4 class="ai-md-h4">$1</h4>');
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
            html = html.replace(/> (.*?)\n/g, '<blockquote class="ai-md-quote">$1</blockquote>');
            html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="ai-md-link" target="_self">$1</a>');
            html = html.replace(/\n/g, '<br>');
            return html;
        }

        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        scrollToBottom() {
            setTimeout(() => {
                if (this.messagesContainer) {
                    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
                }
            }, 50);
        }

        updateScoreBadge() {
            if (!this.scoreStatus) return;
            const pct = this.sessionScore.total > 0 ? Math.round((this.sessionScore.correct / this.sessionScore.total) * 100) : 0;
            const subjName = this.currentSubject === 'all' ? 'All Subjects' : this.currentSubject;
            this.scoreStatus.textContent = `Score: ${this.sessionScore.correct}/${this.sessionScore.total} (${pct}%) • ${subjName}`;
        }

        clearChat() {
            this.haltSpeech();
            this.messages = [];
            this.messagesContainer.innerHTML = '';
            this.sessionScore = { correct: 0, total: 0 };
            this.updateScoreBadge();
            sessionStorage.removeItem('study_chatbot_history');
            this.addBotMessage("Chat history cleared. What topic shall we master next?", true);
            if (window.toast) window.toast('🗑️ Chat cleared');
        }

        saveSessionState() {
            try {
                sessionStorage.setItem('study_chatbot_history', JSON.stringify({
                    messages: this.messages.slice(-25),
                    score: this.sessionScore,
                    subject: this.currentSubject
                }));
            } catch (e) {}
        }

        loadSessionState() {
            try {
                const saved = sessionStorage.getItem('study_chatbot_history');
                if (saved) {
                    const data = JSON.parse(saved);
                    if (data.score) this.sessionScore = data.score;
                    if (data.subject) {
                        this.currentSubject = data.subject;
                        if (this.subjectSelect) this.subjectSelect.value = data.subject;
                    }
                    this.updateScoreBadge();

                    if (data.messages && Array.isArray(data.messages)) {
                        data.messages.forEach(msg => {
                            if (msg.role === 'user') this.addUserMessage(msg.content);
                            else this.addBotMessage(msg.content, true);
                        });
                    }
                }
            } catch (e) {}
        }

        initJarvisVoice() {
            if (!('speechSynthesis' in window)) return;

            const setJarvisVoice = () => {
                const voices = window.speechSynthesis.getVoices();
                if (!voices || voices.length === 0) return;

                this.ttsVoice = voices.find(v => 
                    (v.name.includes('Ryan') || v.name.includes('George') || v.name.includes('Oliver') || v.name.includes('Daniel') || v.name.includes('Arthur')) && 
                    (v.lang.startsWith('en-GB') || v.lang.startsWith('en'))
                ) || voices.find(v => v.lang === 'en-GB' || v.name.includes('UK English'))
                  || voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David')))
                  || voices[0];
            };

            setJarvisVoice();
            window.speechSynthesis.onvoiceschanged = setJarvisVoice;
        }

        speakJarvis(text) {
            if (!('speechSynthesis' in window)) return;
            this.haltSpeech();

            try {
                const utter = new SpeechSynthesisUtterance(text);
                if (this.ttsVoice) utter.voice = this.ttsVoice;
                utter.rate = 1.02;
                utter.pitch = 0.92;

                utter.onstart = () => {
                    this.isSpeaking = true;
                    if (this.haltBtn) this.haltBtn.style.display = 'inline-flex';
                };

                utter.onend = () => {
                    this.isSpeaking = false;
                    if (this.haltBtn) this.haltBtn.style.display = 'none';
                };

                utter.onerror = () => {
                    this.isSpeaking = false;
                    if (this.haltBtn) this.haltBtn.style.display = 'none';
                };

                window.speechSynthesis.speak(utter);
            } catch (e) {}
        }

        haltSpeech() {
            if ('speechSynthesis' in window) {
                try {
                    window.speechSynthesis.cancel();
                } catch (e) {}
            }
            this.isSpeaking = false;
            if (this.haltBtn) this.haltBtn.style.display = 'none';
        }
    }

    // Expose global controller
    window.StudyChatbot = new StudyChatbotController();

})(window);
