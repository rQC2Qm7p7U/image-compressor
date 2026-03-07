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
    tag_name: 'v1.1.5',
    name: 'Release v1.1.5',
    body: '## Improvements\n- Replace `forEach(async)` with `Promise.allSettled` for robust parallel processing\n- Extract `buildOutputFilename()` utility, eliminating 3x code duplication\n- Add `WorkerPool.terminate()` method for proper memory cleanup\n- Move `.spin` CSS animation from DOM injection into `index.css`\n- Add Toast notification system replacing all `alert()` calls\n- Fix `useEffect` dependencies to use derived counters instead of full `files` array\n- Add `min`/`max` constraints to maxWidth input\n- Remove `console.log` from Service Worker callbacks\n- Remove `as any` casts, improve TypeScript strictness',
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
