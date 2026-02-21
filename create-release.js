import https from 'https';
import fs from 'fs';

const tokenMatch = fs.readFileSync('.env', 'utf8').match(/GITHUB_TOKEN=(.+)/);
const token = tokenMatch ? tokenMatch[1].trim() : null;

if (!token) {
    console.error('No GITHUB_TOKEN found in .env');
    process.exit(1);
}

const data = JSON.stringify({
    tag_name: 'v1.1.2',
    name: 'Release v1.1.2',
    body: '## Whats Changed\n- Optimized memory usage (freed createImageBitmap buffers)\n- Enabled AVIF WebAssembly encoder\n- Added batch state updates for the Queue\n- Extracted inline React components\n- Updated PWA caching limits for WASM',
    draft: false,
    prerelease: false,
    generate_release_notes: true
});

const options = {
    hostname: 'api.github.com',
    path: '/repos/rQC2Qm7p7U/image-compressor/releases',
    method: 'POST',
    headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'Node.js',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = https.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => responseBody += chunk);
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('Release created successfully!');
            console.log(JSON.parse(responseBody).html_url);
        } else {
            console.error('Failed to create release. Status:', res.statusCode);
            console.error(responseBody);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e.message);
});

req.write(data);
req.end();
