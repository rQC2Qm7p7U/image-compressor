import https from 'https';

// Token must be passed as an environment variable:
//   RELEASE_TOKEN=<your_token> node create-release.js
// Never store tokens in files — use environment variables or CI secrets.
const token = process.env.RELEASE_TOKEN;

if (!token) {
    console.error('Error: RELEASE_TOKEN environment variable is not set.');
    console.error('Usage: RELEASE_TOKEN=<your_token> node create-release.js');
    process.exit(1);
}

const data = JSON.stringify({
    tag_name: 'v1.2.1',
    name: 'Release v1.2.1',
    body: '## Bug Fixes\n- Fix stray `$` symbol displayed in savings text\n- Fix stale settings closure — compression now always uses current settings via useRef\n- Fix fractional pixel dimensions in resize (Math.round)\n- Remove dead `saveToFolder` code after Queue tab removal\n- Replace `error: any` with `error: unknown` in worker',
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
