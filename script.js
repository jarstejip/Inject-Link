/* ========================================
   JZINJECTLINK - Core JavaScript
   Link Extraction & UI Logic
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements ----
    const linkInput = document.getElementById('link-input');
    const clearBtn = document.getElementById('clear-btn');
    const injectBtn = document.getElementById('inject-btn');
    const resultArea = document.getElementById('result-area');
    const resultSuccess = document.getElementById('result-success');
    const resultError = document.getElementById('result-error');
    const resultLink = document.getElementById('result-link');
    const fileHost = document.getElementById('file-host');
    const copyBtn = document.getElementById('copy-btn');
    const copyIcon = document.getElementById('copy-icon');
    const checkIcon = document.getElementById('check-icon');
    const openLinkBtn = document.getElementById('open-link-btn');
    const newLinkBtn = document.getElementById('new-link-btn');
    const retryBtn = document.getElementById('retry-btn');
    const errorMessage = document.getElementById('error-message');
    const btnText = injectBtn.querySelector('.btn-text');
    const btnLoader = injectBtn.querySelector('.btn-loader');
    const btnArrow = injectBtn.querySelector('.btn-arrow');

    // ---- Captcha Verification Elements ----
    const captchaBox = document.getElementById('captcha-box');
    const captchaCheckbox = document.getElementById('captcha-checkbox');
    const captchaSpinner = document.getElementById('captcha-spinner');
    const captchaCheckIcon = document.getElementById('captcha-check-icon');
    const captchaTitle = document.getElementById('captcha-title');
    const captchaSubtitle = document.getElementById('captcha-subtitle');
    const captchaWarning = document.getElementById('captcha-warning');

    // ---- Security Alert Modal Elements ----
    const securityAlertModal = document.getElementById('security-alert-modal');
    const alertModalBtn = document.getElementById('alert-modal-btn');
    const alertModalClose = document.getElementById('alert-modal-close');

    let isRobotVerified = false;
    let isVerifyingRobot = false;

    function showSecurityAlert() {
        if (securityAlertModal) {
            securityAlertModal.classList.remove('hidden');
        }
        if (captchaWarning) captchaWarning.classList.remove('hidden');
        if (captchaBox) {
            captchaBox.classList.remove('shake-warning');
            void captchaBox.offsetWidth; // trigger reflow
            captchaBox.classList.add('shake-warning', 'highlight-pulse');
        }
    }

    function hideSecurityAlert() {
        if (securityAlertModal) {
            securityAlertModal.classList.add('hidden');
        }
    }

    if (alertModalClose) {
        alertModalClose.addEventListener('click', hideSecurityAlert);
    }

    if (securityAlertModal) {
        securityAlertModal.addEventListener('click', (e) => {
            if (e.target === securityAlertModal) {
                hideSecurityAlert();
            }
        });
    }

    if (alertModalBtn) {
        alertModalBtn.addEventListener('click', () => {
            hideSecurityAlert();
            if (captchaBox) {
                captchaBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            triggerCaptchaVerification();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && securityAlertModal && !securityAlertModal.classList.contains('hidden')) {
            hideSecurityAlert();
        }
    });

    function resetCaptcha() {
        isRobotVerified = false;
        isVerifyingRobot = false;
        if (captchaCheckbox) {
            captchaCheckbox.classList.remove('verified');
            captchaCheckbox.setAttribute('aria-checked', 'false');
        }
        if (captchaCheckIcon) captchaCheckIcon.classList.add('hidden');
        if (captchaSpinner) captchaSpinner.classList.add('hidden');
        if (captchaBox) {
            captchaBox.classList.remove('verified', 'shake-warning', 'highlight-pulse');
        }
        if (captchaTitle) captchaTitle.textContent = 'Saya bukan robot';
        if (captchaSubtitle) captchaSubtitle.textContent = 'Klik untuk verifikasi keamanan';
        if (captchaWarning) captchaWarning.classList.add('hidden');
    }

    // ---- Navbar Scroll ----
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (currentScroll > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    });

    // ---- Mobile Navigation Hamburger ----
    const navHamburger = document.getElementById('nav-hamburger');
    const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    if (navHamburger && mobileNavDrawer) {
        navHamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            navHamburger.classList.toggle('active');
            mobileNavDrawer.classList.toggle('hidden');
        });

        // Close mobile drawer when a nav link is clicked
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                navHamburger.classList.remove('active');
                mobileNavDrawer.classList.add('hidden');
            });
        });

        // Close mobile drawer when clicking outside
        document.addEventListener('click', (e) => {
            if (!navbar.contains(e.target) && !mobileNavDrawer.classList.contains('hidden')) {
                navHamburger.classList.remove('active');
                mobileNavDrawer.classList.add('hidden');
            }
        });
    }

    // ---- Active Nav Link ----
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => link.classList.remove('active'));
                const id = entry.target.getAttribute('id');
                const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));

    // ---- Scroll Animations ----
    const animateElements = document.querySelectorAll('.feature-card, .step-card, .platform-group');
    
    const animateObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('animate-in');
                }, index * 100);
                animateObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    animateElements.forEach(el => animateObserver.observe(el));

    // ---- Clear Button ----
    linkInput.addEventListener('input', () => {
        clearBtn.classList.toggle('hidden', linkInput.value.length === 0);
    });

    clearBtn.addEventListener('click', () => {
        linkInput.value = '';
        clearBtn.classList.add('hidden');
        linkInput.focus();
        hideResults();
    });

    // ---- Robot Captcha Verification Logic ----
    function triggerCaptchaVerification() {
        if (isRobotVerified || isVerifyingRobot) return;

        isVerifyingRobot = true;
        if (captchaWarning) captchaWarning.classList.add('hidden');
        if (captchaBox) captchaBox.classList.remove('shake-warning');

        // UI state: verifying
        if (captchaSpinner) captchaSpinner.classList.remove('hidden');
        if (captchaCheckIcon) captchaCheckIcon.classList.add('hidden');
        if (captchaTitle) captchaTitle.textContent = 'Memverifikasi...';
        if (captchaSubtitle) captchaSubtitle.textContent = 'Memeriksa sidik browser & bot...';

        // Simulate security challenge verification delay
        setTimeout(() => {
            isVerifyingRobot = false;
            isRobotVerified = true;

            if (captchaSpinner) captchaSpinner.classList.add('hidden');
            if (captchaCheckIcon) captchaCheckIcon.classList.remove('hidden');
            if (captchaCheckbox) {
                captchaCheckbox.classList.add('verified');
                captchaCheckbox.setAttribute('aria-checked', 'true');
            }
            if (captchaBox) captchaBox.classList.add('verified');

            if (captchaTitle) captchaTitle.textContent = 'Saya bukan robot';
            if (captchaSubtitle) captchaSubtitle.textContent = 'Terverifikasi aman ✓';
        }, 1100);
    }

    if (captchaCheckbox) {
        captchaCheckbox.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerCaptchaVerification();
        });
    }

    if (captchaBox) {
        captchaBox.addEventListener('click', () => {
            triggerCaptchaVerification();
        });
    }

    // ---- Inject Button ----
    injectBtn.addEventListener('click', () => {
        // 1. Wajib verifikasi robot sebelum convert link!
        if (!isRobotVerified) {
            showSecurityAlert();
            return;
        }

        // 2. Cek apakah URL sudah diisi
        const url = linkInput.value.trim();
        if (!url) {
            linkInput.focus();
            shakeInput();
            return;
        }

        processLink(url);
    });

    // ---- Enter Key ----
    linkInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            injectBtn.click();
        }
    });

    // ---- New Link / Retry ----
    newLinkBtn.addEventListener('click', () => {
        linkInput.value = '';
        clearBtn.classList.add('hidden');
        hideResults();
        resetCaptcha();
        linkInput.focus();
    });

    retryBtn.addEventListener('click', () => {
        hideResults();
        if (!isRobotVerified) {
            showSecurityAlert();
            return;
        }
        if (linkInput.value.trim()) {
            processLink(linkInput.value.trim());
        }
    });

    // ---- Copy Button ----
    copyBtn.addEventListener('click', () => {
        const link = resultLink.value;
        navigator.clipboard.writeText(link).then(() => {
            copyBtn.classList.add('copied');
            copyIcon.classList.add('hidden');
            checkIcon.classList.remove('hidden');
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyIcon.classList.remove('hidden');
                checkIcon.classList.add('hidden');
            }, 2000);
        });
    });

    // ---- Counter Animation ----
    function animateCounter() {
        const statEl = document.getElementById('stat-extracted');
        let count = 10000;
        const target = 12847;
        const duration = 2000;
        const steps = 60;
        const increment = (target - count) / steps;
        
        const interval = setInterval(() => {
            count += increment;
            if (count >= target) {
                count = target;
                clearInterval(interval);
            }
            statEl.textContent = Math.floor(count).toLocaleString();
        }, duration / steps);
    }

    // Trigger counter when visible
    const heroStats = document.querySelector('.hero-stats');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter();
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    if (heroStats) counterObserver.observe(heroStats);

    // ========================================
    //  CORE: Link Processing Engine
    // ========================================

    /**
     * Known file hosting patterns and their display names
     */
    const FILE_HOSTS = {
        'mediafire.com': { name: 'MediaFire', color: '#326ce5' },
        'drive.google.com': { name: 'Google Drive', color: '#4285f4' },
        'docs.google.com': { name: 'Google Docs', color: '#4285f4' },
        'mega.nz': { name: 'Mega.nz', color: '#cc0000' },
        'mega.co.nz': { name: 'Mega.nz', color: '#cc0000' },
        'zippyshare.com': { name: 'Zippyshare', color: '#e8730e' },
        'krakenfiles.com': { name: 'KrakenFiles', color: '#1a1a2e' },
        'pixeldrain.com': { name: 'Pixeldrain', color: '#4caf50' },
        'gofile.io': { name: 'Gofile', color: '#ffc107' },
        'anonfiles.com': { name: 'AnonFiles', color: '#42a5f5' },
        'bayfiles.com': { name: 'BayFiles', color: '#0d47a1' },
        'file.io': { name: 'File.io', color: '#2196f3' },
        'uploadhaven.com': { name: 'UploadHaven', color: '#ff5722' },
        'solidfiles.com': { name: 'SolidFiles', color: '#2196f3' },
        'tusfiles.com': { name: 'TusFiles', color: '#ff9800' },
        'racaty.net': { name: 'Racaty', color: '#e91e63' },
        'fichier.com': { name: '1Fichier', color: '#333' },
        'uptobox.com': { name: 'Uptobox', color: '#0d6efd' },
        'turbobit.net': { name: 'Turbobit', color: '#e53935' },
        'hitfile.net': { name: 'HitFile', color: '#ff6f00' },
        'hexupload.net': { name: 'HexUpload', color: '#7c4dff' },
        'sfile.mobi': { name: 'SFile', color: '#4caf50' },
        'sfile.co': { name: 'SFile', color: '#4caf50' },
        'hxfile.co': { name: 'HXFile', color: '#ff5722' },
        'acefile.co': { name: 'AceFile', color: '#2196f3' },
        'letsupload.io': { name: 'LetsUpload', color: '#673ab7' },
        'dropbox.com': { name: 'Dropbox', color: '#0061ff' },
        'onedrive.live.com': { name: 'OneDrive', color: '#0078d4' },
        'terabox.com': { name: 'Terabox', color: '#2962ff' },
        'uploadrar.com': { name: 'UploadRar', color: '#f44336' },
        'download.gg': { name: 'Download.gg', color: '#7c4dff' },
        'devuploads.com': { name: 'DevUploads', color: '#00bcd4' },
        'usercloud.com': { name: 'UserCloud', color: '#8bc34a' },
        'userscloud.com': { name: 'UsersCloud', color: '#8bc34a' },
        'sendit.cloud': { name: 'SendIt', color: '#ff9800' },
        'uploadev.org': { name: 'UploadEv', color: '#607d8b' },
        'fastupload.io': { name: 'FastUpload', color: '#00e676' },
        'workupload.com': { name: 'WorkUpload', color: '#3f51b5' },
        'depositfiles.com': { name: 'DepositFiles', color: '#ff5252' },
        'ddownload.com': { name: 'DDownload', color: '#1565c0' },
        'katfile.com': { name: 'KatFile', color: '#f50057' },
        'disk.yandex': { name: 'Yandex Disk', color: '#ffcc00' },
        'cloud.mail.ru': { name: 'Mail.ru Cloud', color: '#005ff9' },
        'files.fm': { name: 'Files.fm', color: '#00c853' },
        'uploadbox.io': { name: 'UploadBox', color: '#9c27b0' },
    };

    /**
     * Known safelink/shortener patterns
     */
    const SAFELINK_PATTERNS = [
        // Base64 encoded in query params
        { regex: /[?&](?:url|link|go|r|redirect|out|target|dest|destination|d|u|l|ref|src|file|download)=([A-Za-z0-9+/=]{20,})/i, type: 'base64-param' },
        // URL encoded in query params
        { regex: /[?&](?:url|link|go|r|redirect|out|target|dest|destination|d|u|l|ref|src|file|download)=(https?%3A[^&]+)/i, type: 'url-encoded-param' },
        // Plain URL in query params
        { regex: /[?&](?:url|link|go|r|redirect|out|target|dest|destination|d|u|l|ref|src|file|download)=(https?:\/\/[^&]+)/i, type: 'plain-url-param' },
        // Safelinku patterns
        { regex: /safelinku?\.com.*[?&](?:url|link)=([^&]+)/i, type: 'safelinku' },
        // SafeFile/Safefile patterns
        { regex: /safe-?file[^/]*\/.*[?&](?:url|link|code)=([^&]+)/i, type: 'safefile' },
        // Safelink converter patterns  
        { regex: /safelink[^/]*\/.*[?&](?:url|link|code|id)=([^&]+)/i, type: 'safelink-converter' },
        // Semawur patterns (Indonesian)
        { regex: /semawur\.com.*[?&](?:url|link|go)=([^&]+)/i, type: 'semawur' },
        // Teknogram patterns (Indonesian)
        { regex: /teknogram\.id.*[?&](?:url|link|go)=([^&]+)/i, type: 'teknogram' },
        // ouo.io and similar
        { regex: /ouo\.(?:io|press)\/([A-Za-z0-9]+)/i, type: 'ouo' },
        // GPLinks
        { regex: /gplinks\.(?:co|in)\/([A-Za-z0-9]+)/i, type: 'gplinks' },
        // Exe.io / exey.io
        { regex: /exe[y]?\.io\/([A-Za-z0-9]+)/i, type: 'exe-io' },
        // Shrinkme / ShrinkEarn
        { regex: /(?:shrinkme|shrinkearn)\.(?:io|com)\/([A-Za-z0-9]+)/i, type: 'shrinkme' },
        // Droplink
        { regex: /droplink\.co\/([A-Za-z0-9]+)/i, type: 'droplink' },
        // Link1s
        { regex: /link1s?\.com\/([A-Za-z0-9]+)/i, type: 'link1s' },
        // ShrtFly
        { regex: /shrtfly\.com\/([A-Za-z0-9]+)/i, type: 'shrtfly' },
        // Za.gl
        { regex: /za\.gl\/([A-Za-z0-9]+)/i, type: 'za-gl' },
        // fc.lc
        { regex: /fc\.lc\/([A-Za-z0-9]+)/i, type: 'fc-lc' },
        // General base64 in hash/fragment
        { regex: /#([A-Za-z0-9+/=]{20,})$/i, type: 'base64-hash' },
        // General base64 in path
        { regex: /\/(?:go|link|out|redirect|visit|dl|download|get|file|open)\/([A-Za-z0-9+/=]{20,})/i, type: 'base64-path' },
        // Double-encoded base64
        { regex: /[?&](?:url|link|r)=([A-Za-z0-9%+/=]{20,})/i, type: 'double-encoded' },
        // Any remaining query param with long value (catch-all)
        { regex: /[?&][a-z]+=([A-Za-z0-9+/=_-]{30,})/i, type: 'catch-all-param' },
    ];

    /**
     * Known URL shortener domains (need server-side redirect following)
     */
    const SHORTENER_DOMAINS = [
        'bit.ly', 'bitly.com', 'tinyurl.com', 'is.gd', 'v.gd',
        't.co', 'ow.ly', 'goo.gl', 'cutt.ly', 'rb.gy',
        's.id', 'pndk.to', 'pendek.to', 'clfrm.com',
        'link.tl', 'shorturl.at', 'tiny.cc', 'rebrand.ly',
        'bl.ink', 'hfrm.link', 'linktr.ee', 'lnk.to',
        'short.io', 'hyp.ae', 'qps.ru', 'clck.ru',
        'ouo.io', 'ouo.press', 'exe.io', 'exey.io',
        'gplinks.co', 'gplinks.in', 'shrinkme.io',
        'shrinkearn.com', 'droplink.co', 'link1s.com',
        'shrtfly.com', 'za.gl', 'fc.lc',
        'sub4unlock.co', 'sfl.gl', 'sub2unlock.com',
        'sub2get.com', 'sub4unlock.com',
    ];

    /**
     * Check if URL is a known shortener that needs API
     */
    function isKnownShortener(url) {
        try {
            const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
            return SHORTENER_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
        } catch {
            return false;
        }
    }

    /**
     * Detect file hosting service from URL
     */
    function detectFileHost(url) {
        try {
            const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
            for (const [domain, info] of Object.entries(FILE_HOSTS)) {
                if (hostname.includes(domain)) {
                    return info;
                }
            }
        } catch (e) {
            // Not a valid URL
        }
        return null;
    }

    /**
     * Try to decode base64 string (handles padding issues)
     */
    function tryBase64Decode(str) {
        try {
            // Remove URL encoding first
            let decoded = decodeURIComponent(str);
            
            // Fix base64 padding
            while (decoded.length % 4 !== 0) {
                decoded += '=';
            }
            
            // Try standard base64
            let result = atob(decoded);
            
            // Check if result looks like a URL
            if (result.match(/^https?:\/\//i)) {
                return result;
            }

            // Try URL-safe base64 (replace - with + and _ with /)
            decoded = str.replace(/-/g, '+').replace(/_/g, '/');
            while (decoded.length % 4 !== 0) {
                decoded += '=';
            }
            result = atob(decoded);
            
            if (result.match(/^https?:\/\//i)) {
                return result;
            }
        } catch (e) {
            // Not valid base64
        }
        return null;
    }

    /**
     * Extract link from URL using various methods
     */
    function extractLink(inputUrl) {
        let url = inputUrl.trim();
        
        // Ensure URL has protocol
        if (!url.match(/^https?:\/\//i)) {
            url = 'https://' + url;
        }

        // 1. Check if the URL is already a direct file host link
        const directHost = detectFileHost(url);
        if (directHost) {
            return { url: url, host: directHost, method: 'direct' };
        }

        // 2. Try each safelink pattern
        for (const pattern of SAFELINK_PATTERNS) {
            const match = url.match(pattern.regex);
            if (match && match[1]) {
                let extracted = match[1];

                // Try URL decoding
                try {
                    const urlDecoded = decodeURIComponent(extracted);
                    if (urlDecoded.match(/^https?:\/\//i)) {
                        const host = detectFileHost(urlDecoded);
                        return { url: urlDecoded, host: host, method: pattern.type };
                    }
                } catch (e) {}

                // Try base64 decoding
                const base64Result = tryBase64Decode(extracted);
                if (base64Result) {
                    const host = detectFileHost(base64Result);
                    return { url: base64Result, host: host, method: pattern.type + '+base64' };
                }

                // If it looks like a URL already
                if (extracted.match(/^https?:\/\//i)) {
                    const host = detectFileHost(extracted);
                    return { url: extracted, host: host, method: pattern.type };
                }
            }
        }

        // 3. Scan all query parameters for encoded URLs
        try {
            const parsedUrl = new URL(url);
            for (const [key, value] of parsedUrl.searchParams.entries()) {
                // Check URL-encoded values
                try {
                    const decoded = decodeURIComponent(value);
                    if (decoded.match(/^https?:\/\//i) && detectFileHost(decoded)) {
                        return { url: decoded, host: detectFileHost(decoded), method: 'query-scan' };
                    }
                } catch (e) {}

                // Check base64-encoded values
                if (value.length >= 20) {
                    const base64Result = tryBase64Decode(value);
                    if (base64Result && detectFileHost(base64Result)) {
                        return { url: base64Result, host: detectFileHost(base64Result), method: 'query-base64-scan' };
                    }
                }
            }
        } catch (e) {}

        // 4. Scan the entire URL for base64 encoded URLs
        const base64Matches = url.match(/[A-Za-z0-9+/=_-]{30,}/g);
        if (base64Matches) {
            for (const match of base64Matches) {
                const result = tryBase64Decode(match);
                if (result && result.match(/^https?:\/\//i)) {
                    const host = detectFileHost(result);
                    return { url: result, host: host, method: 'full-scan-base64' };
                }
            }
        }

        // 5. Check for nested URL in the URL path/query (expanded list)
        const fileHostPattern = Object.keys(FILE_HOSTS).map(d => d.replace(/\./g, '\\.')).join('|');
        const nestedRegex = new RegExp('(https?:\\/\\/(?:www\\.)?(?:' + fileHostPattern + ')[^\\s&"\'<>]*)', 'i');
        const nestedUrlMatch = url.match(nestedRegex);
        if (nestedUrlMatch) {
            const host = detectFileHost(nestedUrlMatch[1]);
            return { url: nestedUrlMatch[1], host: host, method: 'nested-url' };
        }

        return null;
    }

    /**
     * Call server-side Unshorten API (Vercel Serverless)
     */
    async function callUnshortenApi(targetUrl) {
        const apiUrl = `/api/unshorten?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return await response.json();
    }

    /**
     * Fallback: Use public CORS proxy to follow redirects
     */
    async function tryPublicProxy(targetUrl) {
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
        ];

        for (const proxyUrl of proxies) {
            try {
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    signal: AbortSignal.timeout(10000)
                });

                if (!response.ok) continue;

                // Check if the final URL (after proxy redirect) is a file host
                const finalUrl = response.url;
                if (finalUrl && detectFileHost(finalUrl)) {
                    return { url: finalUrl, host: detectFileHost(finalUrl), method: 'proxy-redirect' };
                }

                // Scan response text for file host links
                const text = await response.text();
                const fileHostPattern = Object.keys(FILE_HOSTS).map(d => d.replace(/\./g, '\\.')).join('|');
                const linkRegex = new RegExp('https?://(?:www\\.)?(?:' + fileHostPattern + ')[^\\s"\'>\\)\\]]*', 'gi');
                const matches = text.match(linkRegex);

                if (matches && matches.length > 0) {
                    const found = matches[0];
                    return { url: found, host: detectFileHost(found), method: 'proxy-html-scan' };
                }
            } catch {
                continue;
            }
        }
        return null;
    }

    /**
     * Main process function - Multi-strategy extraction
     */
    async function processLink(url) {
        // Show loading
        setLoading(true);
        hideResults();

        // Short delay for UX feel
        await sleep(600 + Math.random() * 400);

        try {
            // ===== STRATEGY 1: Client-side extraction (instant) =====
            const clientResult = extractLink(url);
            if (clientResult && clientResult.url) {
                showSuccess(clientResult);
                incrementStat();
                return;
            }

            // ===== STRATEGY 2: Server-side API (for shorteners/redirects) =====
            try {
                updateLoadingText('Mengikuti redirect...');
                const apiResult = await callUnshortenApi(url);
                if (apiResult && apiResult.success && apiResult.url) {
                    const host = detectFileHost(apiResult.url);
                    showSuccess({
                        url: apiResult.url,
                        host: host || { name: apiResult.host || 'Link Ditemukan', color: '#2196f3' },
                        method: apiResult.method
                    });
                    incrementStat();
                    return;
                }
            } catch (apiErr) {
                console.warn('Server API fallback skipped:', apiErr.message);
            }

            // ===== STRATEGY 3: Public CORS proxy fallback =====
            try {
                updateLoadingText('Mencoba proxy alternatif...');
                const proxyResult = await tryPublicProxy(url);
                if (proxyResult && proxyResult.url) {
                    showSuccess(proxyResult);
                    incrementStat();
                    return;
                }
            } catch (proxyErr) {
                console.warn('Proxy fallback skipped:', proxyErr.message);
            }

            // ===== SEMUA STRATEGI GAGAL =====
            showError('Link tidak dapat diekstrak. Pastikan URL yang dimasukkan berisi link download (MediaFire, Mega, Google Drive, dll). Jika ini adalah URL shortener, coba deploy web ini di Vercel agar API redirect bisa berfungsi.');

        } catch (err) {
            showError('Terjadi kesalahan saat memproses link. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    }

    // ========================================
    //  UI Helpers
    // ========================================

    function setLoading(loading) {
        injectBtn.disabled = loading;
        btnText.textContent = loading ? 'Memproses...' : 'Inject Link';
        btnLoader.classList.toggle('hidden', !loading);
        btnArrow.classList.toggle('hidden', loading);
    }

    function updateLoadingText(text) {
        if (btnText) btnText.textContent = text;
    }

    function hideResults() {
        resultArea.classList.add('hidden');
        resultSuccess.classList.add('hidden');
        resultError.classList.add('hidden');
    }

    function showSuccess(result) {
        resultArea.classList.remove('hidden');
        resultSuccess.classList.remove('hidden');
        resultError.classList.add('hidden');

        resultLink.value = result.url;
        openLinkBtn.href = result.url;

        if (result.host) {
            fileHost.textContent = result.host.name;
        } else {
            fileHost.textContent = 'Link Ditemukan';
        }

        // Scroll to result
        resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function showError(message) {
        resultArea.classList.remove('hidden');
        resultSuccess.classList.add('hidden');
        resultError.classList.remove('hidden');
        errorMessage.textContent = message;
    }

    function shakeInput() {
        const card = document.getElementById('inject-card');
        card.style.animation = 'none';
        card.offsetHeight; // Trigger reflow
        card.style.animation = 'shake 0.5s ease-in-out';
    }

    function incrementStat() {
        const statEl = document.getElementById('stat-extracted');
        const current = parseInt(statEl.textContent.replace(/,/g, ''));
        statEl.textContent = (current + 1).toLocaleString();
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Add shake animation dynamically
    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
    `;
    document.head.appendChild(shakeStyle);

    // ---- Smooth scroll for nav links ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ========================================
    //  AI Chat Assistant (Gemini & GPT)
    // ========================================
    const aiChatToggle = document.getElementById('ai-chat-toggle');
    const aiToggleIcon = document.getElementById('ai-toggle-icon');
    const aiToggleClose = document.getElementById('ai-toggle-close');
    const aiChatPanel = document.getElementById('ai-chat-panel');
    const aiCloseBtn = document.getElementById('ai-close-btn');
    const aiSettingsBtn = document.getElementById('ai-settings-btn');
    const aiSettingsPanel = document.getElementById('ai-settings-panel');
    const aiSettingsClose = document.getElementById('ai-settings-close');
    const aiActiveModelTag = document.getElementById('ai-active-model-tag');

    const btnProviderGemini = document.getElementById('btn-provider-gemini');
    const btnProviderOpenai = document.getElementById('btn-provider-openai');
    const aiGeminiConfig = document.getElementById('ai-gemini-config');
    const aiOpenaiConfig = document.getElementById('ai-openai-config');
    const aiGeminiKeyInput = document.getElementById('ai-gemini-key');
    const aiOpenaiKeyInput = document.getElementById('ai-openai-key');
    const aiSaveSettingsBtn = document.getElementById('ai-save-settings-btn');

    const aiMessages = document.getElementById('ai-messages');
    const aiInput = document.getElementById('ai-input');
    const aiSendBtn = document.getElementById('ai-send-btn');
    const aiSuggestions = document.getElementById('ai-suggestions');

    // Load saved settings
    let aiProvider = localStorage.getItem('jz_ai_provider') || 'gemini';
    let geminiKey = localStorage.getItem('jz_gemini_key') || '';
    let openaiKey = localStorage.getItem('jz_openai_key') || '';
    let isAiResponding = false;

    if (aiGeminiKeyInput) aiGeminiKeyInput.value = geminiKey;
    if (aiOpenaiKeyInput) aiOpenaiKeyInput.value = openaiKey;

    function updateAiUiState() {
        if (aiProvider === 'gemini') {
            btnProviderGemini?.classList.add('active');
            btnProviderOpenai?.classList.remove('active');
            aiGeminiConfig?.classList.remove('hidden');
            aiOpenaiConfig?.classList.add('hidden');
            if (aiActiveModelTag) aiActiveModelTag.textContent = geminiKey ? 'Gemini 1.5 Flash' : 'Google Gemini (Demo)';
        } else {
            btnProviderGemini?.classList.remove('active');
            btnProviderOpenai?.classList.add('active');
            aiGeminiConfig?.classList.add('hidden');
            aiOpenaiConfig?.classList.remove('hidden');
            if (aiActiveModelTag) aiActiveModelTag.textContent = openaiKey ? 'GPT-4o Mini' : 'OpenAI GPT (Demo)';
        }
    }
    updateAiUiState();

    // Toggle Chat Window
    function toggleAiChat() {
        const isHidden = aiChatPanel.classList.contains('hidden');
        if (isHidden) {
            aiChatPanel.classList.remove('hidden');
            aiToggleIcon?.classList.add('hidden');
            aiToggleClose?.classList.remove('hidden');
            setTimeout(() => aiInput?.focus(), 150);
        } else {
            aiChatPanel.classList.add('hidden');
            aiToggleIcon?.classList.remove('hidden');
            aiToggleClose?.classList.add('hidden');
            aiSettingsPanel?.classList.add('hidden');
        }
    }

    if (aiChatToggle) aiChatToggle.addEventListener('click', toggleAiChat);
    if (aiCloseBtn) aiCloseBtn.addEventListener('click', toggleAiChat);

    // Settings Panel Toggles
    if (aiSettingsBtn) {
        aiSettingsBtn.addEventListener('click', () => {
            aiSettingsPanel?.classList.toggle('hidden');
        });
    }
    if (aiSettingsClose) {
        aiSettingsClose.addEventListener('click', () => {
            aiSettingsPanel?.classList.add('hidden');
        });
    }

    // Provider Selector
    if (btnProviderGemini) {
        btnProviderGemini.addEventListener('click', () => {
            aiProvider = 'gemini';
            updateAiUiState();
        });
    }
    if (btnProviderOpenai) {
        btnProviderOpenai.addEventListener('click', () => {
            aiProvider = 'openai';
            updateAiUiState();
        });
    }

    // Save Settings
    if (aiSaveSettingsBtn) {
        aiSaveSettingsBtn.addEventListener('click', () => {
            geminiKey = aiGeminiKeyInput?.value.trim() || '';
            openaiKey = aiOpenaiKeyInput?.value.trim() || '';
            localStorage.setItem('jz_ai_provider', aiProvider);
            localStorage.setItem('jz_gemini_key', geminiKey);
            localStorage.setItem('jz_openai_key', openaiKey);

            aiSaveSettingsBtn.textContent = 'Tersimpan! ✓';
            setTimeout(() => {
                aiSaveSettingsBtn.textContent = 'Simpan Pengaturan';
                aiSettingsPanel?.classList.add('hidden');
                updateAiUiState();
            }, 900);
        });
    }

    // Quick suggestion chips
    if (aiSuggestions) {
        aiSuggestions.addEventListener('click', (e) => {
            const chip = e.target.closest('.ai-chip');
            if (chip && chip.dataset.query) {
                const query = chip.dataset.query;
                aiSuggestions.classList.add('hidden');
                sendAiMessage(query);
            }
        });
    }

    // Send Message Event
    if (aiSendBtn) {
        aiSendBtn.addEventListener('click', () => {
            const text = aiInput.value.trim();
            if (text) sendAiMessage(text);
        });
    }

    if (aiInput) {
        aiInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const text = aiInput.value.trim();
                if (text) sendAiMessage(text);
            }
        });
    }

    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-msg ${sender === 'user' ? 'ai-msg-user' : 'ai-msg-bot'}`;

        const bubble = document.createElement('div');
        bubble.className = 'ai-msg-bubble';

        if (sender === 'bot') {
            const avatar = document.createElement('div');
            avatar.className = 'ai-msg-avatar';
            avatar.textContent = 'JZ';
            msgDiv.appendChild(avatar);
            bubble.innerHTML = formatMarkdown(text);
        } else {
            bubble.textContent = text;
        }

        msgDiv.appendChild(bubble);
        aiMessages.appendChild(msgDiv);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'ai-msg ai-msg-bot';
        indicator.id = 'ai-typing-indicator';
        indicator.innerHTML = `
            <div class="ai-msg-avatar">JZ</div>
            <div class="ai-typing-bubble">
                <span class="ai-typing-dot"></span>
                <span class="ai-typing-dot"></span>
                <span class="ai-typing-dot"></span>
            </div>
        `;
        aiMessages.appendChild(indicator);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('ai-typing-indicator');
        if (indicator) indicator.remove();
    }

    function formatMarkdown(text) {
        let escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Bold **text**
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Inline code `code`
        escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Newlines
        escaped = escaped.replace(/\n/g, '<br>');
        return escaped;
    }

    // Built-in intelligent answering knowledge base
    function getBuiltinKnowledgeResponse(query) {
        const q = query.toLowerCase();

        if (q.includes('cara kerja') || q.includes('cara bypass') || q.includes('bagaimana cara')) {
            return "Cara menggunakan **JZINJECTLINK** sangat mudah:\n1. Copy link safelink / URL shortener yang kamu miliki.\n2. Paste link ke kolom input di atas.\n3. Centang verifikasi keamanan **'Saya bukan robot'**.\n4. Klik **'Inject Link'**.\n5. Sistem otomatis mendekode base64 & parameter tersembunyi hingga menemukan link asli (seperti MediaFire atau Google Drive) tanpa harus melewati iklan!";
        }

        if (q.includes('platform') || q.includes('didukung') || q.includes('hosting')) {
            return "JZINJECTLINK mendukung berbagai platform populer:\n• **Safelink**: SafelinkU, SafeFile, Safelink Converter, Bit.ly, Ouo.io, GPLinks, dsb.\n• **File Hosting**: MediaFire, Google Drive, Mega.nz, Zippyshare, Pixeldrain, Krakenfiles, Gofile, dll.\n\nJika ada platform tertentu yang ingin ditambahkan, silakan beri tahu!";
        }

        if (q.includes('api key') || q.includes('setting') || q.includes('pengaturan') || q.includes('gemini') || q.includes('gpt')) {
            return "Untuk menghubungkan AI dengan **Google Gemini** atau **OpenAI (GPT)**:\n1. Klik ikon ⚙️ **Pengaturan** di kanan atas kotak chat ini.\n2. Pilih provider: **Google Gemini** atau **OpenAI (GPT)**.\n3. Masukkan API Key kamu (bisa didapatkan gratis di Google AI Studio).\n4. Klik **Simpan Pengaturan**.\n\nSetelah tersimpan, kamu bisa ngobrol bebas tentang apapun dengan AI!";
        }

        if (q.includes('gagal') || q.includes('error') || q.includes('tidak bisa')) {
            return "Jika link gagal diekstrak:\n1. Pastikan link yang dimasukkan lengkap dengan `http://` atau `https://`.\n2. Pastikan safelink tersebut memang berisi link download yang tersimpan di parameter URL atau kode Base64.\n3. Bila safelink memiliki proteksi captcha server, coba buka safelink satu langkah hingga muncul URL redirectnya, lalu masukkan URL tersebut ke JZINJECTLINK.";
        }

        if (q.includes('halo') || q.includes('hai') || q.includes('pagi') || q.includes('siang') || q.includes('malam')) {
            return "Halo! Ada yang bisa saya bantu seputar web **JZINJECTLINK** atau ekstraksi link download hari ini? 😊";
        }

        return "Terima kasih atas pertanyaannya! Saat ini saya beroperasi dalam mode asisten pintar bawaan **JZINJECTLINK**.\n\n💡 **Tip**: Ingin bertanya apa saja secara luas? Kamu bisa memasukkan **Google Gemini API Key** (gratis di Google AI Studio) atau **OpenAI GPT Key** melalui menu ⚙️ **Pengaturan** di atas!";
    }

    // Call Google Gemini API
    async function callGeminiApi(prompt, apiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const systemContext = "Kamu adalah JZ AI Assistant, asisten ramah dan pintar untuk website JZINJECTLINK (web bypass link dan ekstraksi link download MediaFire/Google Drive dari safelink). Jawab dengan bahasa Indonesia yang jelas, ringkas, dan ramah.";

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${systemContext}\n\nPertanyaan pengguna: ${prompt}` }]
                }]
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, tidak ada respon dari Gemini.";
    }

    // Call OpenAI GPT API
    async function callOpenAiApi(prompt, apiKey) {
        const url = 'https://api.openai.com/v1/chat/completions';
        const systemContext = "Kamu adalah JZ AI Assistant, asisten ramah dan pintar untuk website JZINJECTLINK (web bypass link dan ekstraksi link download MediaFire/Google Drive dari safelink). Jawab dengan bahasa Indonesia yang jelas, ringkas, dan ramah.";

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemContext },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 600
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "Maaf, tidak ada respon dari OpenAI.";
    }

    // Send AI Message Workflow
    async function sendAiMessage(text) {
        if (isAiResponding) return;

        appendMessage('user', text);
        aiInput.value = '';
        isAiResponding = true;
        showTypingIndicator();

        try {
            let botReply = '';

            if (aiProvider === 'gemini' && geminiKey) {
                botReply = await callGeminiApi(text, geminiKey);
            } else if (aiProvider === 'openai' && openaiKey) {
                botReply = await callOpenAiApi(text, openaiKey);
            } else {
                // Built-in intelligent assistant simulation delay
                await sleep(700 + Math.random() * 500);
                botReply = getBuiltinKnowledgeResponse(text);
            }

            hideTypingIndicator();
            appendMessage('bot', botReply);
        } catch (err) {
            hideTypingIndicator();
            appendMessage('bot', `⚠️ **Error saat menghubungi ${aiProvider === 'gemini' ? 'Google Gemini' : 'OpenAI GPT'}**: ${err.message}.\n\nSilakan periksa kembali API Key kamu di menu ⚙️ Pengaturan.`);
        } finally {
            isAiResponding = false;
        }
    }
});
