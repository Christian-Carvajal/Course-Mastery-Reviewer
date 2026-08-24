const CACHE_NAME = 'reviewer-pwa-v146';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/global.css',
    '/global.js',
    '/chatbot.js',
    '/heroCanvas.js',
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
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
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

// Immediate skipWaiting on install
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[Service Worker] Pre-caching latest deployment:', CACHE_NAME);

            // Fetch fresh copies of static assets
            const localPromises = STATIC_ASSETS.map(async (asset) => {
                try {
                    const res = await fetch(asset, { cache: 'reload' });
                    if (res && res.ok) {
                        await cache.put(asset, res);
                    }
                } catch (e) {
                    console.warn('[Service Worker] Non-blocking cache note for:', asset);
                }
            });

            const cdnPromises = CDN_ASSETS.map(async (cdnUrl) => {
                try {
                    const res = await fetch(cdnUrl, { mode: 'cors' });
                    if (res && res.ok) {
                        await cache.put(cdnUrl, res);
                    }
                } catch (e) {
                    console.warn('[Service Worker] Non-blocking CDN cache note for:', cdnUrl);
                }
            });

            await Promise.allSettled([...localPromises, ...cdnPromises]);
        })
    );
});

// Immediate claim and clean up old caches on activate
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Retiring outdated cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Message Event - Skip Waiting on demand
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Fetch Event - Network-First for all local assets to ensure 100% instant auto-updates
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;

    const requestUrl = event.request.url;

    // 1. Supabase Live REST API calls - Network only, never cache
    if (requestUrl.includes('supabase.co') && requestUrl.includes('/rest/v1/')) {
        return;
    }

    // 2. version.json - Network only with cached fallback
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

    // 3. CDN Dependencies - Cache-First with Network fallback
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

    // 4. All Local Pages, HTML, JS, CSS, JSON - NETWORK-FIRST (Always serves fresh Netlify deploys!)
    event.respondWith(
        fetch(event.request, { cache: 'no-cache' })
            .then(async (networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, responseClone);
                }
                return networkResponse;
            })
            .catch(async () => {
                // If offline or network fails, instantly serve from offline cache!
                let cached = await caches.match(event.request, { ignoreSearch: true });
                if (!cached) {
                    const matchedKey = findMatchingCachedKey(requestUrl);
                    if (matchedKey) {
                        cached = await caches.match(matchedKey, { ignoreSearch: true });
                    }
                }
                if (cached) return cached;

                // Fallback for HTML navigations when offline
                if (event.request.mode === 'navigate' || requestUrl.endsWith('.html')) {
                    const indexCached = await caches.match('/index.html', { ignoreSearch: true });
                    if (indexCached) return indexCached;
                }

                return new Response('Offline - No Cached Version Available', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
    );
});
