const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.ogg': 'audio/ogg',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.pdf': 'application/pdf',
    '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Mock API for WordPress / Contact Form 7 endpoints
    if (req.url.includes('/wp-json/') || req.url.includes('/wp-admin/admin-ajax.php')) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'mail_sent', message: 'Hospitality inquiry received. Our discovery team will reach out.' }));
        return;
    }

    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath.endsWith('/')) reqPath += 'index.html';
    let safePath = path.normalize(path.join(PUBLIC_DIR, reqPath));

    if (!safePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Check if index.html exists in that directory
            if (stats && stats.isDirectory()) {
                const subIndex = path.join(safePath, 'index.html');
                if (fs.existsSync(subIndex)) {
                    serveFile(subIndex, req, res);
                    return;
                }
            }
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`404 Not Found: ${reqPath}`);
            return;
        }

        serveFile(safePath, req, res);
    });
});

function serveFile(filePath, req, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    // Handle HTTP 206 Partial Content for media (audio/video)
    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunkSize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': contentType
        });
        fileStream.pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': stat.size,
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes'
        });
        fs.createReadStream(filePath).pipe(res);
    }
}

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 8080;
let currentPort = DEFAULT_PORT;

function startServer(port) {
    currentPort = port;
    server.listen(port, () => {
        console.log(`\n🌊 Jazak Voda Local Server running at http://localhost:${port}\n`);
    });
}

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        currentPort++;
        console.log(`Port ${currentPort - 1} is busy, trying http://localhost:${currentPort}...`);
        startServer(currentPort);
    } else {
        console.error('Server error:', err);
    }
});

startServer(DEFAULT_PORT);
