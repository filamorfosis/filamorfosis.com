/**
 * serve.js — Filamorfosis® local dev server
 *
 * Mimics the .htaccess SPA fallback: serves static files directly,
 * and falls back to index.html for any clean-URL route the router handles.
 *
 * Usage:  node serve.js [port]
 * Default port: 8000
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2], 10) || 8000;
const ROOT = __dirname;

// Routes that get a hard redirect to their .html file (non-SPA pages)
const HARD_PAGES = ['/admin', '/account', '/order-confirmation'];

// MIME types for static assets
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
    '.ttf':  'font/ttf',
    '.mp4':  'video/mp4',
    '.webm': 'video/webm',
    '.pdf':  'application/pdf',
};

function serveFile(res, filePath, status) {
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end('Internal Server Error');
            return;
        }
        res.writeHead(status || 200, { 'Content-Type': mime });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    // Strip query string and hash for file resolution
    const urlPath = req.url.split('?')[0].split('#')[0];

    // 1. Try to serve as a real file/directory first
    const fsPath = path.join(ROOT, urlPath);

    fs.stat(fsPath, (err, stat) => {
        if (!err && stat.isFile()) {
            // Exact file match — serve it directly
            serveFile(res, fsPath);
            return;
        }

        if (!err && stat.isDirectory()) {
            // Directory — try index.html inside it
            const indexPath = path.join(fsPath, 'index.html');
            fs.stat(indexPath, (err2, stat2) => {
                if (!err2 && stat2.isFile()) {
                    serveFile(res, indexPath);
                } else {
                    res.writeHead(403);
                    res.end('Forbidden');
                }
            });
            return;
        }

        // 2. Check for hard-page .html files (admin, account, etc.)
        for (const page of HARD_PAGES) {
            if (urlPath.startsWith(page)) {
                const htmlFile = path.join(ROOT, urlPath.replace(/\/?$/, '') + '.html');
                fs.stat(htmlFile, (e, s) => {
                    if (!e && s.isFile()) {
                        serveFile(res, htmlFile);
                    } else {
                        res.writeHead(404);
                        res.end('Not Found');
                    }
                });
                return;
            }
        }

        // 3. SPA fallback — serve index.html for all other routes
        serveFile(res, path.join(ROOT, 'index.html'));
    });
});

server.listen(PORT, () => {
    console.log(`Filamorfosis® dev server running at http://localhost:${PORT}`);
    console.log('SPA fallback active — all clean URLs serve index.html');
    console.log('Press Ctrl+C to stop.');
});
