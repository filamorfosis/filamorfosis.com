/**
 * server.js — Static file server with SPA fallback
 * Usage: node server.js [port]
 *
 * Serves static files from the current directory.
 * Any request that doesn't match a real file is served index.html
 * so the History API router handles clean URLs like /account, /checkout, etc.
 */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2], 10) || 8000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
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
  '.otf':  'font/otf',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.pdf':  'application/pdf',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml',
  '.webp': 'image/webp',
};

// Paths that should NOT fall back to index.html (real standalone pages)
const STANDALONE_PAGES = ['/admin.html', '/order-confirmation.html'];

function serveFile(res, filePath, statusCode) {
  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(statusCode || 200, { 'Content-Type': mime });
    res.end(data);
  });
}

const server = http.createServer(function (req, res) {
  // Strip query string and decode
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  // Resolve to a filesystem path
  const fsPath = path.join(ROOT, urlPath);

  // Security: prevent path traversal outside ROOT
  if (!fsPath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(fsPath, function (err, stat) {
    if (!err && stat.isFile()) {
      // Real file exists — serve it directly
      serveFile(res, fsPath);
      return;
    }

    if (!err && stat.isDirectory()) {
      // Directory — try index.html inside it
      const indexInDir = path.join(fsPath, 'index.html');
      fs.stat(indexInDir, function (err2, stat2) {
        if (!err2 && stat2.isFile()) {
          serveFile(res, indexInDir);
        } else {
          // SPA fallback
          serveFile(res, path.join(ROOT, 'index.html'));
        }
      });
      return;
    }

    // File not found — SPA fallback: serve index.html for all unknown paths
    // so the JS router can handle /account, /checkout, /tienda, etc.
    serveFile(res, path.join(ROOT, 'index.html'));
  });
});

server.listen(PORT, function () {
  console.log('Filamorfosis dev server running at http://localhost:' + PORT);
  console.log('SPA fallback active — all unknown paths serve index.html');
  console.log('Press Ctrl+C to stop.');
});
