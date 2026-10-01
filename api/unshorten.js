/* ========================================
   JZINJECTLINK - Unshorten API
   Vercel Serverless Function
   Follow redirects & extract download links
   ======================================== */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// ---- Known File Hosting Domains ----
const FILE_HOST_DOMAINS = [
    'mediafire.com', 'drive.google.com', 'mega.nz', 'mega.co.nz',
    'pixeldrain.com', 'gofile.io', 'krakenfiles.com', 'anonfiles.com',
    'bayfiles.com', 'zippyshare.com', 'solidfiles.com', 'tusfiles.com',
    'racaty.net', 'fichier.com', 'uptobox.com', 'turbobit.net',
    'hitfile.net', 'hexupload.net', 'uploadhaven.com', 'file.io',
    'sfile.mobi', 'dropbox.com', 'onedrive.live.com', 'terabox.com',
    'uploadrar.com', 'hxfile.co', 'acefile.co', 'letsupload.io',
    'devuploads.com', 'download.gg', 'usercloud.com', 'userscloud.com',
    'sendit.cloud', 'uploadev.org', 'fastupload.io', 'shareupload.com',
    'docs.google.com', 'disk.yandex', 'cloud.mail.ru', 'files.fm',
    'workupload.com', 'depositfiles.com', 'ddownload.com',
    'katfile.com', 'earn4files.com', 'uploadbox.io'
];

function isFileHost(url) {
    try {
        const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
        return FILE_HOST_DOMAINS.some(d => hostname.includes(d));
    } catch {
        return false;
    }
}

function getFileHostInfo(url) {
    try {
        const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
        for (const domain of FILE_HOST_DOMAINS) {
            if (hostname.includes(domain)) {
                // Capitalize domain name for display
                const name = domain.split('.')[0];
                return name.charAt(0).toUpperCase() + name.slice(1);
            }
        }
    } catch {}
    return null;
}

// ---- HTTP Request Helper ----
function makeRequest(targetUrl, options = {}) {
    return new Promise((resolve, reject) => {
        let parsedUrl;
        try {
            parsedUrl = new URL(targetUrl);
        } catch (e) {
            return reject(new Error('Invalid URL: ' + targetUrl));
        }

        const mod = parsedUrl.protocol === 'https:' ? https : http;

        const reqOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
                'Accept-Encoding': 'identity',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                ...(options.headers || {})
            },
            timeout: options.timeout || 12000,
            // Don't follow redirects automatically
            maxRedirects: 0
        };

        const req = mod.request(reqOptions, (res) => {
            // Limit response size to 2MB
            const maxSize = 2 * 1024 * 1024;
            let body = '';
            let size = 0;

            res.setEncoding('utf8');

            res.on('data', (chunk) => {
                size += chunk.length;
                if (size <= maxSize) {
                    body += chunk;
                }
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });
        req.end();
    });
}

// ---- Follow Redirects Chain ----
async function followRedirects(startUrl, maxHops = 15) {
    const chain = [startUrl];
    let currentUrl = startUrl;

    for (let i = 0; i < maxHops; i++) {
        let response;
        try {
            response = await makeRequest(currentUrl);
        } catch (err) {
            // If request fails, return what we have
            return { finalUrl: currentUrl, chain, html: '', error: err.message };
        }

        // ---- Check HTTP redirect (301, 302, 303, 307, 308) ----
        if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
            let nextUrl = response.headers.location;

            // Handle relative URLs
            if (!nextUrl.startsWith('http')) {
                try {
                    nextUrl = new URL(nextUrl, currentUrl).toString();
                } catch {
                    return { finalUrl: currentUrl, chain, html: response.body };
                }
            }

            chain.push(nextUrl);

            // Check if redirect target is a file host → early exit
            if (isFileHost(nextUrl)) {
                return { finalUrl: nextUrl, chain, html: '' };
            }

            currentUrl = nextUrl;
            continue;
        }

        // ---- Check HTML meta refresh redirect ----
        const metaRefreshPatterns = [
            /<meta[^>]*http-equiv\s*=\s*["']refresh["'][^>]*content\s*=\s*["']\d+;\s*url\s*=\s*([^"'\s>]+)["']/i,
            /<meta[^>]*content\s*=\s*["']\d+;\s*url\s*=\s*([^"'\s>]+)["'][^>]*http-equiv\s*=\s*["']refresh["']/i
        ];

        let metaUrl = null;
        for (const pattern of metaRefreshPatterns) {
            const match = response.body.match(pattern);
            if (match && match[1]) {
                metaUrl = match[1];
                break;
            }
        }

        if (metaUrl) {
            if (!metaUrl.startsWith('http')) {
                try { metaUrl = new URL(metaUrl, currentUrl).toString(); } catch { break; }
            }
            chain.push(metaUrl);
            if (isFileHost(metaUrl)) {
                return { finalUrl: metaUrl, chain, html: '' };
            }
            currentUrl = metaUrl;
            continue;
        }

        // ---- Check JavaScript redirects ----
        const jsRedirectPatterns = [
            /window\.location(?:\.href)?\s*=\s*["']([^"']+)["']/i,
            /location\.replace\s*\(\s*["']([^"']+)["']\s*\)/i,
            /location\.href\s*=\s*["']([^"']+)["']/i,
            /window\.open\s*\(\s*["']([^"']+)["']/i,
            /document\.location\s*=\s*["']([^"']+)["']/i,
            /top\.location\s*=\s*["']([^"']+)["']/i
        ];

        let jsUrl = null;
        for (const pattern of jsRedirectPatterns) {
            const match = response.body.match(pattern);
            if (match && match[1] && match[1].startsWith('http')) {
                jsUrl = match[1];
                break;
            }
        }

        if (jsUrl) {
            chain.push(jsUrl);
            if (isFileHost(jsUrl)) {
                return { finalUrl: jsUrl, chain, html: '' };
            }
            currentUrl = jsUrl;
            continue;
        }

        // ---- No more redirects found ----
        return { finalUrl: currentUrl, chain, html: response.body };
    }

    return { finalUrl: currentUrl, chain, html: '' };
}

// ---- Scan HTML for File Host Links ----
function scanHtmlForFileLinks(html) {
    if (!html) return [];

    const foundUrls = new Set();

    // 1. Scan href/src attributes for file host URLs
    const attrPatterns = [
        /(?:href|src|data-url|data-href|data-link|data-src|action)\s*=\s*["']([^"']*)/gi,
    ];

    for (const pattern of attrPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
            const url = match[1];
            if (url.startsWith('http') && isFileHost(url)) {
                foundUrls.add(url);
            }
        }
    }

    // 2. Scan for any URLs in the page that match file hosts
    const fileHostDomainPattern = FILE_HOST_DOMAINS.map(d => d.replace(/\./g, '\\.')).join('|');
    const urlInTextRegex = new RegExp(`https?://(?:www\\.)?(?:${fileHostDomainPattern})[^\\s"'<>\\)\\]]*`, 'gi');
    let match;
    while ((match = urlInTextRegex.exec(html)) !== null) {
        foundUrls.add(match[0]);
    }

    // 3. Scan for base64 encoded URLs
    const base64Regex = /(?:atob|decode|base64)\s*\(\s*["']([A-Za-z0-9+/=]{20,})["']\s*\)/g;
    while ((match = base64Regex.exec(html)) !== null) {
        try {
            const decoded = Buffer.from(match[1], 'base64').toString('utf8');
            if (decoded.match(/^https?:\/\//i) && isFileHost(decoded)) {
                foundUrls.add(decoded);
            }
        } catch {}
    }

    // 4. Scan for standalone base64 strings that decode to URLs
    const standaloneB64 = /["']([A-Za-z0-9+/=]{30,})["']/g;
    while ((match = standaloneB64.exec(html)) !== null) {
        try {
            let b64 = match[1];
            while (b64.length % 4 !== 0) b64 += '=';
            const decoded = Buffer.from(b64, 'base64').toString('utf8');
            if (decoded.match(/^https?:\/\//i) && isFileHost(decoded)) {
                foundUrls.add(decoded);
            }
        } catch {}
    }

    // 5. Scan for URL-encoded URLs
    const encodedUrlRegex = /(https?%3A%2F%2F[^\s"'<>]+)/gi;
    while ((match = encodedUrlRegex.exec(html)) !== null) {
        try {
            const decoded = decodeURIComponent(match[1]);
            if (isFileHost(decoded)) {
                foundUrls.add(decoded);
            }
        } catch {}
    }

    return [...foundUrls];
}

// ---- Also try client-side-style extraction on URL itself ----
function tryClientSideExtraction(url) {
    // Check if URL contains encoded download links in params
    try {
        const parsedUrl = new URL(url);

        // Scan query parameters
        for (const [key, value] of parsedUrl.searchParams.entries()) {
            // URL-encoded value
            try {
                const decoded = decodeURIComponent(value);
                if (decoded.match(/^https?:\/\//i) && isFileHost(decoded)) {
                    return decoded;
                }
            } catch {}

            // Base64 value
            if (value.length >= 20) {
                try {
                    let b64 = value;
                    while (b64.length % 4 !== 0) b64 += '=';
                    const decoded = Buffer.from(b64, 'base64').toString('utf8');
                    if (decoded.match(/^https?:\/\//i) && isFileHost(decoded)) {
                        return decoded;
                    }
                } catch {}
            }
        }

        // Scan hash/fragment
        if (parsedUrl.hash && parsedUrl.hash.length > 20) {
            try {
                let b64 = parsedUrl.hash.slice(1);
                while (b64.length % 4 !== 0) b64 += '=';
                const decoded = Buffer.from(b64, 'base64').toString('utf8');
                if (decoded.match(/^https?:\/\//i) && isFileHost(decoded)) {
                    return decoded;
                }
            } catch {}
        }
    } catch {}

    return null;
}

// ========================================
//  MAIN HANDLER
// ========================================
module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Get target URL from query or body
    const targetUrl = req.query.url || (req.body && req.body.url);

    if (!targetUrl) {
        return res.status(400).json({
            success: false,
            error: 'Parameter "url" wajib diisi'
        });
    }

    // Validate URL format
    let validatedUrl;
    try {
        // Add protocol if missing
        let urlToValidate = targetUrl;
        if (!urlToValidate.match(/^https?:\/\//i)) {
            urlToValidate = 'https://' + urlToValidate;
        }
        validatedUrl = new URL(urlToValidate).toString();
    } catch {
        return res.status(400).json({
            success: false,
            error: 'Format URL tidak valid'
        });
    }

    // Security: Block internal/private network URLs
    try {
        const parsed = new URL(validatedUrl);
        const hostname = parsed.hostname.toLowerCase();
        if (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '0.0.0.0' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.') ||
            hostname.endsWith('.local') ||
            hostname.endsWith('.internal')
        ) {
            return res.status(400).json({
                success: false,
                error: 'URL internal/private tidak diizinkan'
            });
        }
    } catch {}

    try {
        // Step 0: Quick check - try client-side extraction on the URL itself
        const quickResult = tryClientSideExtraction(validatedUrl);
        if (quickResult) {
            return res.json({
                success: true,
                url: quickResult,
                host: getFileHostInfo(quickResult),
                method: 'url-param-extraction'
            });
        }

        // Step 1: Check if the URL itself is already a file host
        if (isFileHost(validatedUrl)) {
            return res.json({
                success: true,
                url: validatedUrl,
                host: getFileHostInfo(validatedUrl),
                method: 'direct'
            });
        }

        // Step 2: Follow redirects
        const result = await followRedirects(validatedUrl);

        // Check if final URL is a file host
        if (isFileHost(result.finalUrl)) {
            return res.json({
                success: true,
                url: result.finalUrl,
                host: getFileHostInfo(result.finalUrl),
                method: 'redirect',
                chain: result.chain
            });
        }

        // Check entire redirect chain for file host URLs
        for (const chainUrl of result.chain) {
            if (isFileHost(chainUrl)) {
                return res.json({
                    success: true,
                    url: chainUrl,
                    host: getFileHostInfo(chainUrl),
                    method: 'redirect-chain',
                    chain: result.chain
                });
            }
        }

        // Step 3: Scan page HTML for download links
        if (result.html) {
            // Try client-side extraction on the final URL too
            const paramResult = tryClientSideExtraction(result.finalUrl);
            if (paramResult) {
                return res.json({
                    success: true,
                    url: paramResult,
                    host: getFileHostInfo(paramResult),
                    method: 'final-url-extraction',
                    chain: result.chain
                });
            }

            // Scan HTML content
            const foundLinks = scanHtmlForFileLinks(result.html);
            if (foundLinks.length > 0) {
                return res.json({
                    success: true,
                    url: foundLinks[0],
                    host: getFileHostInfo(foundLinks[0]),
                    method: 'html-scan',
                    allFound: foundLinks.length > 1 ? foundLinks : undefined,
                    chain: result.chain
                });
            }
        }

        // Step 4: Nothing found
        return res.json({
            success: false,
            finalUrl: result.finalUrl,
            chain: result.chain,
            error: 'Tidak ditemukan link file hosting di dalam URL ini. Pastikan link berisi tautan ke MediaFire, Mega, Google Drive, atau file hosting lainnya.'
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: 'Gagal memproses link: ' + err.message
        });
    }
};
