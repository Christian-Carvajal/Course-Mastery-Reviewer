// ============================================================================
// SUPABASE CLIENT & API SERVICE LAYER (Zero-Build Vanilla Architecture)
// File: supabaseClient.js
// ============================================================================

(function(window) {
    'use strict';

    if (window.SupabaseService && window.__SUPABASE_CLIENT_SINGLETON__) {
        return; // Guard against duplicate script injection
    }

    // Default Project Credentials
    const DEFAULT_SUPABASE_URL = 'https://YOUR_SUPABASE_PROJECT_ID.supabase.co';
    const DEFAULT_SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

    // Helper: Safe LocalStorage Access
    function getStored(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function setStored(key, val) {
        try {
            if (val === null || val === undefined || val === '') localStorage.removeItem(key);
            else localStorage.setItem(key, val);
        } catch (e) {}
    }

    // Resolve Active Credentials (Custom Override or Project Default)
    function getActiveConfig() {
        const customUrl = getStored('supabase_custom_url');
        const customKey = getStored('supabase_custom_key');
        return {
            url: (customUrl || DEFAULT_SUPABASE_URL).trim().replace(/\/$/, ''),
            key: (customKey || DEFAULT_SUPABASE_KEY).trim(),
            isCustom: Boolean(customUrl || customKey)
        };
    }

    // Initialize Supabase SDK Client instance (Strict Singleton Pattern)
    let clientInstance = (typeof window !== 'undefined' && window.__SUPABASE_CLIENT_SINGLETON__) || null;
    let lastConfigKey = (typeof window !== 'undefined' && window.__SUPABASE_LAST_CONFIG_KEY__) || null;

    function initSupabase(forceReinit = false) {
        const cfg = getActiveConfig();
        const currentConfigKey = cfg.url + '::' + cfg.key;

        // Strict Singleton Guard: Prevent multiple GoTrueClient instances
        if (clientInstance && !forceReinit && lastConfigKey === currentConfigKey) {
            return clientInstance;
        }

        if (window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                clientInstance = window.supabase.createClient(cfg.url, cfg.key, {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                });
                window.__SUPABASE_CLIENT_SINGLETON__ = clientInstance;
                window.__SUPABASE_LAST_CONFIG_KEY__ = currentConfigKey;
                lastConfigKey = currentConfigKey;
            } catch (err) {
                console.warn('[SupabaseClient] Initialization warning:', err);
                clientInstance = null;
            }
        }
        return clientInstance;
    }

    // ========================================================================
    // Low-Level Parameterized RPC Invoker (Fallback-Safe via REST)
    // ========================================================================
    async function invokeRPC(functionName, params = {}) {
        const cfg = getActiveConfig();

        // 1. Try official supabase-js SDK if initialized
        if (clientInstance) {
            try {
                const { data, error } = await clientInstance.rpc(functionName, params);
                if (error) {
                    console.warn(`[SupabaseClient] RPC ${functionName} error:`, error);
                    return { success: false, error: error.message || 'RPC Execution Failed' };
                }
                return data;
            } catch (sdkErr) {
                console.warn(`[SupabaseClient] SDK RPC failed, falling back to direct REST:`, sdkErr);
            }
        }

        // 2. High-Performance Direct REST Fallback (Zero dependencies)
        const endpoint = `${cfg.url}/rest/v1/rpc/${functionName}`;
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': cfg.key,
                    'Authorization': `Bearer ${cfg.key}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(params)
            });

            if (!res.ok) {
                const errText = await res.text();
                return { success: false, error: `API Error (${res.status}): ${errText}` };
            }

            const data = await res.json();
            return data;
        } catch (fetchErr) {
            console.error(`[SupabaseClient] Network fetch ${functionName} failed:`, fetchErr);
            return { success: false, error: "Network connection failed. Please check internet connection." };
        }
    }

    // ========================================================================
    // Session & Auth State Management
    // ========================================================================
    const SessionManager = {
        STORAGE_KEY: 'student_active_session',

        getSession() {
            try {
                const raw = getStored(this.STORAGE_KEY);
                if (!raw) return null;
                const session = JSON.parse(raw);

                // Check 7-Day Session TTL
                if (session && session.session_expires_at) {
                    if (new Date(session.session_expires_at).getTime() <= Date.now()) {
                        this.clearSession(true);
                        return null;
                    }
                }
                return session;
            } catch (e) {
                return null;
            }
        },

        setSession(sessionData) {
            if (sessionData) {
                setStored(this.STORAGE_KEY, JSON.stringify(sessionData));
            } else {
                setStored(this.STORAGE_KEY, '');
            }
            if (window.SupabaseSync && typeof window.SupabaseSync.updateNavUI === 'function') {
                window.SupabaseSync.updateNavUI();
            }
        },

        clearSession(isExpired = false) {
            setStored(this.STORAGE_KEY, '');
            if (window.SupabaseSync && typeof window.SupabaseSync.updateNavUI === 'function') {
                window.SupabaseSync.updateNavUI();
            }
            if (isExpired && typeof window.showToast === 'function') {
                window.showToast("Your session has expired. Please sign in again.", "warning");
            }
        },

        verifyActiveSession() {
            const session = this.getSession();
            if (!session) return null;
            if (session.session_expires_at && new Date(session.session_expires_at).getTime() <= Date.now()) {
                this.clearSession(true);
                return null;
            }
            return session;
        }
    };

    // ========================================================================
    // Pure JS API Service Layer (All 12 Database RPC Stored Procedures)
    // ========================================================================
    const SupabaseService = {
        // --- Configuration Utilities ---
        getConfig() {
            return getActiveConfig();
        },

        setCustomConfig(url, key) {
            setStored('supabase_custom_url', (url || '').trim());
            setStored('supabase_custom_key', (key || '').trim());
            initSupabase(true);
        },

        resetConfigToDefaults() {
            setStored('supabase_custom_url', '');
            setStored('supabase_custom_key', '');
            initSupabase(true);
        },

        // --- Auth Stored Procedures ---
        async registerStudent(username, password, question, answer) {
            const res = await invokeRPC('rpc_register_student', {
                p_username: username,
                p_password: password,
                p_question: question,
                p_answer: answer
            });

            if (res && res.success) {
                SessionManager.setSession({
                    student_id: res.student_id,
                    username: res.username,
                    session_token: res.session_token,
                    session_expires_at: res.session_expires_at
                });
            }
            return res;
        },

        async loginStudent(username, password) {
            const res = await invokeRPC('rpc_login_student', {
                p_username: username,
                p_password: password
            });

            if (res && res.success) {
                SessionManager.setSession({
                    student_id: res.student_id,
                    username: res.username,
                    session_token: res.session_token,
                    session_expires_at: res.session_expires_at,
                    requires_password_change: Boolean(res.requires_password_change)
                });
            }
            return res;
        },

        async getSecurityQuestion(username) {
            return await invokeRPC('rpc_get_security_question', {
                p_username: username
            });
        },

        async verifySecurityAnswer(username, answer) {
            return await invokeRPC('rpc_verify_answer_and_issue_temp', {
                p_username: username,
                p_answer: answer
            });
        },

        async changePassword(studentId, token, newPassword) {
            const res = await invokeRPC('rpc_change_password', {
                p_student_id: studentId,
                p_session_token: token,
                p_new_password: newPassword
            });

            if (res && res.success) {
                const session = SessionManager.getSession();
                if (session) {
                    session.requires_password_change = false;
                    SessionManager.setSession(session);
                }
            }
            return res;
        },

        async deleteAccount(studentId, token) {
            const res = await invokeRPC('rpc_delete_account', {
                p_student_id: studentId,
                p_session_token: token
            });

            if (res && res.success) {
                SessionManager.clearSession(false);
            }
            return res;
        },

        // --- Progress Sync Stored Procedures ---
        async syncProgress(studentId, token, data) {
            return await invokeRPC('rpc_sync_progress', {
                p_student_id: studentId,
                p_session_token: token,
                p_topic_key: data.topicKey,
                p_answered_count: data.answered || 0,
                p_correct_count: data.correct || 0,
                p_total_questions: data.total || 0,
                p_user_answers: data.userAnswers || [],
                p_order_mode: data.orderMode || 'sequential',
                p_last_card_index: data.lastCardIndex || 0
            });
        },

        async getAllProgress(studentId, token) {
            return await invokeRPC('rpc_get_all_progress', {
                p_student_id: studentId,
                p_session_token: token
            });
        },

        async deleteProgress(studentId, token, topicKey = null) {
            return await invokeRPC('rpc_delete_progress', {
                p_student_id: studentId,
                p_session_token: token,
                p_topic_key: topicKey || 'ALL'
            });
        },

        // --- Mistake Vault Stored Procedures ---
        async syncMistake(studentId, token, mistakeData) {
            return await invokeRPC('rpc_sync_mistake', {
                p_student_id: studentId,
                p_session_token: token,
                p_topic_key: mistakeData.topicKey,
                p_topic_name: mistakeData.topicName || mistakeData.topicKey,
                p_question_text: mistakeData.questionText,
                p_user_selection: mistakeData.userSelection || '',
                p_correct_answer: mistakeData.correctAnswer || '',
                p_explanation: mistakeData.explanation || ''
            });
        },

        async getMistakes(studentId, token, topicKey = null) {
            return await invokeRPC('rpc_get_mistakes', {
                p_student_id: studentId,
                p_session_token: token,
                p_topic_key: topicKey || 'ALL'
            });
        },

        async deleteMistake(studentId, token, mistakeId) {
            return await invokeRPC('rpc_delete_mistake', {
                p_student_id: studentId,
                p_session_token: token,
                p_mistake_id: mistakeId
            });
        },

        // --- Whiteboard Cloud Storage Stored Procedures ---
        async saveWhiteboard(studentId, token, data) {
            return await invokeRPC('rpc_save_whiteboard', {
                p_student_id: studentId,
                p_session_token: token,
                p_whiteboard_id: data.whiteboardId || null,
                p_title: data.title || 'Untitled',
                p_canvas_data: data.canvasData || '',
                p_canvas_bg: data.canvasBg || '#ffffff'
            });
        },

        async getWhiteboards(studentId, token) {
            return await invokeRPC('rpc_get_whiteboards', {
                p_student_id: studentId,
                p_session_token: token
            });
        },

        async getWhiteboard(studentId, token, whiteboardId) {
            return await invokeRPC('rpc_get_whiteboard', {
                p_student_id: studentId,
                p_session_token: token,
                p_whiteboard_id: whiteboardId
            });
        },

        async deleteWhiteboard(studentId, token, whiteboardId) {
            return await invokeRPC('rpc_delete_whiteboard', {
                p_student_id: studentId,
                p_session_token: token,
                p_whiteboard_id: whiteboardId
            });
        },

        async clearAllWhiteboards(studentId, token) {
            return await invokeRPC('rpc_clear_all_whiteboards', {
                p_student_id: studentId,
                p_session_token: token
            });
        },

        async shareWhiteboard(studentId, token, data) {
            return await invokeRPC('rpc_share_whiteboard', {
                p_student_id: studentId,
                p_session_token: token,
                p_whiteboard_id: data.whiteboardId,
                p_permission: data.permission || 'edit',
                p_password: data.password || null,
                p_expires_in_hours: data.expiresInHours || null
            });
        },

        async getSharedWhiteboard(shareCode, password = null) {
            return await invokeRPC('rpc_get_shared_whiteboard', {
                p_share_code: shareCode,
                p_password: password
            });
        },

        async saveSharedWhiteboard(shareCode, password = null, data = {}) {
            return await invokeRPC('rpc_save_shared_whiteboard', {
                p_share_code: shareCode,
                p_password: password,
                p_canvas_data: data.canvasData || '',
                p_canvas_bg: data.canvasBg || '#ffffff'
            });
        },

        getClient() {
            if (!clientInstance) {
                initSupabase();
            }
            return clientInstance;
        }
    };

    // Auto-init on load
    initSupabase();

    // Expose Global Namespace
    window.SupabaseService = SupabaseService;
    window.SessionManager = SessionManager;

})(window);
