const CACHE_NAME = 'reviewer-pwa-v140';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/global.css',
    '/global.js',
    '/chatbot.js',
    '/supabaseClient.js',
    '/manifest.json',
    '/favicon.ico',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/version.json',
    '/whiteboard.html',
    '/subject/automataTheory/prelim/automataComputabilityAndComplexity.html',
    '/subject/automataTheory/prelim/introductionToAutomataTheoryFormalLanguages.html',
    '/subject/automataTheory/prelim/theCentralConceptsOfAutomata.html',
    '/subject/informationAssuranceAndSecurity/prelim/accessControl.html',
    '/subject/informationAssuranceAndSecurity/prelim/week1And2.html',
    '/subject/informationAssuranceAndSecurity/prelim/week3And4.html',
    '/subject/dataMining/prelim/introductionToDataScience.html',
    '/subject/dataMining/prelim/probabilities.html',
    '/subject/dataMining/prelim/probabilityDistribution.html',
    '/subject/dataMining/prelim/setsEventsBayesianInference.html',
    '/subject/dataMining/prelim/traditionalDataTechniques.html',
    '/subject/operatingSystemConfiguration/prelim/introductionToOperatingSystems.html',
    '/subject/operatingSystemConfiguration/prelim/networkConfigurationInWindowsOS.html',
    '/subject/operatingSystemConfiguration/prelim/osStructuresAndSystemCalls.html'
];

// External CDN dependencies required for full offline capability
const CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// Helper to normalize and match any local page path
function findMatchingCachedKey(requestUrlStr) {
    try {
        const url = new URL(requestUrlStr, self.location.origin);
        let path = url.pathname.toLowerCase().replace(/\/$/, '');
        if (!path || path === '') return '/index.html';

        if (!path.startsWith('/subject/') && (path.includes('/prelim/') || path.includes('/midterm/') || path.includes('/finals/'))) {
            path = '/subject' + path;
        }

        for (const asset of STATIC_ASSETS) {
            const assetLower = asset.toLowerCase().replace(/\/$/, '');
            if (path === assetLower || 
                path.replace(/\.html$/, '') === assetLower.replace(/\.html$/, '') ||
                path + '.html' === assetLower ||
                path === assetLower + '.html') {
                return asset;
            }
        }
    } catch (e) {}
    return null;
}

// Message Event - Skip Waiting on demand
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Install Event - Safe Atomic Pre-caching with seamless migration
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[Service Worker] Atomic Pre-caching for', CACHE_NAME);

            // Step 1: Copy over all assets from any existing older caches
            // This ensures 0 offline downtime even if the user drops offline mid-update!
            try {
                const oldCacheNames = await caches.keys();
                for (const oldName of oldCacheNames) {
                    if (oldName !== CACHE_NAME) {
                        const oldCache = await caches.open(oldName);
                        const oldKeys = await oldCache.keys();
                        for (const req of oldKeys) {
                            const oldRes = await oldCache.match(req);
                            if (oldRes && oldRes.ok) {
                                await cache.put(req, oldRes.clone());
                            }
                        }
                    }
                }
            } catch (migErr) {
                console.warn('[Service Worker] Cache migration note:', migErr);
            }

            // Step 2: Fetch fresh copies of all static assets in parallel
            const localPromises = STATIC_ASSETS.map(async (asset) => {
                try {
                    const res = await fetch(asset, { cache: 'reload' });
                    if (res && res.ok) {
                        await cache.put(asset, res);
                    }
                } catch (err) {
                    console.warn('[Service Worker] Pre-cache note for asset:', asset);
                }
            });

            // Step 3: Fetch CDN assets
            const cdnPromises = CDN_ASSETS.map(async (cdnUrl) => {
                try {
                    const res = await fetch(cdnUrl, { mode: 'cors' });
                    if (res && res.ok) {
                        await cache.put(cdnUrl, res);
                    }
                } catch (err) {
                    console.warn('[Service Worker] Pre-cache note for CDN:', cdnUrl);
                }
            });

            await Promise.allSettled([...localPromises, ...cdnPromises]);
        }).catch((err) => {
            console.warn('[Service Worker] Pre-cache warning:', err);
        })
    );
});

// Activate Event - Clean up obsolete caches only after new cache is verified
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Safely retiring old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Stale-While-Revalidate for 100% Offline Availability
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;

    const requestUrl = event.request.url;

    // Supabase Live REST API calls - Network only, never cache
    if (requestUrl.includes('supabase.co') && requestUrl.includes('/rest/v1/')) {
        return;
    }

    // version.json - Network only with cached fallback
    if (requestUrl.includes('version.json')) {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' }).catch(async () => {
                const cached = await caches.match('/version.json', { ignoreSearch: true });
                return cached || new Response('{}', {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // CDN Dependencies (Supabase JS, html2pdf, Google Fonts) - Cache First
    if (requestUrl.includes('cdn.jsdelivr.net') || 
        requestUrl.includes('cdnjs.cloudflare.com') || 
        requestUrl.includes('fonts.googleapis.com') || 
        requestUrl.includes('fonts.gstatic.com')) {
        event.respondWith(
            caches.match(event.request, { ignoreSearch: true }).then(async (cached) => {
                if (cached && cached.type !== 'opaque') {
                    return cached;
                }
                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse && networkResponse.ok) {
                        const responseClone = networkResponse.clone();
                        const cache = await caches.open(CACHE_NAME);
                        cache.put(event.request, responseClone);
                    }
                    return networkResponse;
                } catch (netErr) {
                    if (cached) return cached;
                    return new Response('/* CDN asset offline fallback */', {
                        status: 200,
                        headers: { 'Content-Type': 'application/javascript' }
                    });
                }
            })
        );
        return;
    }

    // All Local Pages, CSS, JS, Images - Stale-While-Revalidate with Multi-Tier Fallback
    event.respondWith(
        (async () => {
            // 1. Check exact match in all caches (ignoring query strings)
            let cached = await caches.match(event.request, { ignoreSearch: true });

            // 2. If not found, try normalized path matching
            if (!cached) {
                const matchedKey = findMatchingCachedKey(requestUrl);
                if (matchedKey) {
                    cached = await caches.match(matchedKey, { ignoreSearch: true });
                }
            }

            // If found in cache, serve immediately and update in background if online
            if (cached) {
                // Background revalidation (non-blocking)
                fetch(event.request).then(async (networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        const cache = await caches.open(CACHE_NAME);
                        cache.put(event.request, responseClone);
                    }
                }).catch(() => {
                    // Silent offline catch: cached version is already served!
                });

                return cached;
            }

            // 3. Not in cache: fetch from network
            try {
                const networkResponse = await fetch(event.request);
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, responseClone);
                }
                return networkResponse;
            } catch (netErr) {
                // 4. Network failed & not in cache: Navigation fallback to cached index.html
                if (event.request.mode === 'navigate') {
                    const indexCached = await caches.match('/index.html', { ignoreSearch: true }) || await caches.match('/');
                    if (indexCached) return indexCached;
                }

                return new Response('Offline - Content not available', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain' }
                });
            }
        })()
    );
});
