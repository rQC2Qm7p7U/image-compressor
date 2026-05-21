#!/usr/bin/env node

/**
 * Release Automation Script
 * Automates:
 * 1. Git branch check (main only)
 * 2. Git working tree clean check
 * 3. Version bump (package.json & package-lock.json)
 * 4. Automatic release notes generation from git history
 * 5. Production build and lint checks (npm run lint && npm run build)
 * 6. Local commit and tag
 * 7. Git push to origin
 * 8. Creating GitHub Release via REST API
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const readline = require('readline');

// Parse CLI Arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isNonInteractive = args.includes('--non-interactive');

const bumpArgIndex = args.indexOf('--bump');
const bumpType = bumpArgIndex !== -1 ? args[bumpArgIndex + 1] : null;

const versionArgIndex = args.indexOf('--version');
const customVersion = versionArgIndex !== -1 ? args[versionArgIndex + 1] : null;

const tokenArgIndex = args.indexOf('--token');
let githubToken = tokenArgIndex !== -1 ? args[tokenArgIndex + 1] : null;

const repoOwner = 'rQC2Qm7p7U';
const repoName = 'image-compressor';

// Color logging helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function errorLog(msg) {
  console.error(`${colors.red}${colors.bright}Error: ${msg}${colors.reset}`);
}

// Check git presence and state
function runGit(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (err) {
    throw new Error(`Git command failed: ${cmd}`);
  }
}

// Prompt helper
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans.trim());
  }));
}

// Main execution function
async function main() {
  log('==================================================', colors.cyan);
  log('       🚀  GITHUB RELEASE AUTOMATION SUITE         ', colors.cyan + colors.bright);
  log('==================================================', colors.cyan);

  try {
    // 1. Safety Checks
    log('\n🔍 Running pre-release safety checks...', colors.yellow);

    // Check if git repository
    if (!fs.existsSync(path.join(__dirname, '../.git'))) {
      throw new Error('Not a git repository. Please run this from the project root.');
    }

    // Check current branch (must be main)
    const currentBranch = runGit('git rev-parse --abbrev-ref HEAD');
    log(`Current branch: ${currentBranch}`, colors.blue);
    if (currentBranch !== 'main') {
      throw new Error('Releases must be initiated from the "main" branch.');
    }

    // Check clean working tree
    const status = runGit('git status --porcelain');
    if (status) {
      log('Uncommitted changes detected:\n' + status, colors.red);
      throw new Error('Working directory is not clean. Please commit or stash changes before releasing.');
    }
    log('✓ Git working tree is clean.', colors.green);

    // 2. Load package.json version
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageLockJsonPath = path.join(__dirname, '../package-lock.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found.');
    }

    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const oldVersion = packageData.version;
    log(`Current version: ${oldVersion}`, colors.blue);

    // 3. Determine next version
    let newVersion = '';
    if (customVersion) {
      newVersion = customVersion;
    } else if (bumpType) {
      newVersion = bumpVersion(oldVersion, bumpType);
    } else if (isNonInteractive) {
      newVersion = bumpVersion(oldVersion, 'patch'); // Default to patch for non-interactive
    } else {
      // Interactive version prompt
      log('\nSelect version bump type:', colors.cyan);
      log(`1. Patch (→ ${bumpVersion(oldVersion, 'patch')})`);
      log(`2. Minor (→ ${bumpVersion(oldVersion, 'minor')})`);
      log(`3. Major (→ ${bumpVersion(oldVersion, 'major')})`);
      log('4. Custom version');
      
      const choice = await askQuestion('Enter choice (1-4, default 1): ');
      if (choice === '2') {
        newVersion = bumpVersion(oldVersion, 'minor');
      } else if (choice === '3') {
        newVersion = bumpVersion(oldVersion, 'major');
      } else if (choice === '4') {
        newVersion = await askQuestion('Enter custom version (e.g. 1.6.0): ');
        if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(newVersion)) {
          throw new Error('Invalid version format. Use semver format (X.Y.Z).');
        }
      } else {
        newVersion = bumpVersion(oldVersion, 'patch');
      }
    }

    log(`Target release version: ${newVersion}`, colors.cyan + colors.bright);

    // Verify tag does not already exist
    const tagExists = runGit(`git tag -l "v${newVersion}"`);
    if (tagExists) {
      throw new Error(`Git tag v${newVersion} already exists locally.`);
    }

    // 4. Retrieve Github Token
    if (!githubToken) {
      // Try env vars
      githubToken = process.env.RELEASE_TOKEN || process.env.GITHUB_TOKEN;
    }

    if (!githubToken) {
      // Try loading from .env
      const envPath = path.join(__dirname, '../.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/^\s*(?!#)(?:RELEASE_TOKEN|GITHUB_TOKEN)\s*=\s*(.+)/m);
        if (match) {
          githubToken = match[1].trim().replace(/['"]/g, '');
        }
      }
    }

    if (!githubToken && !isDryRun) {
      if (isNonInteractive) {
        throw new Error('GitHub token not found. Please set GITHUB_TOKEN or RELEASE_TOKEN env variable.');
      } else {
        githubToken = await askQuestion('GitHub Personal Access Token not found. Please enter it: ');
        if (!githubToken) {
          throw new Error('GitHub token is required to create a remote release.');
        }
      }
    }

    // 5. Build and Lint Gate
    log('\n🏗 Running compilation and linting tests...', colors.yellow);
    try {
      log('Running: npm run lint', colors.blue);
      execSync('npm run lint', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      log('✓ Lint verification passed.', colors.green);

      log('Running: npm run build', colors.blue);
      execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      log('✓ Production build passed.', colors.green);
    } catch (buildErr) {
      throw new Error('Linting or Build verification failed. Please fix compile errors before releasing.');
    }

    // 6. Generate Release Notes in User's Signature Style
    log('\n📝 Auto-generating release notes from git history...', colors.yellow);
    
    let lastTag = '';
    try {
      lastTag = runGit('git describe --tags --abbrev=0');
    } catch (err) {
      log('No previous tags found. Generating release notes from initial commit.', colors.yellow);
    }

    const logCmd = lastTag ? `git log ${lastTag}..HEAD --oneline` : 'git log --oneline';
    const commits = runGit(logCmd).split('\n').filter(Boolean);
    
    const features = [];
    const fixes = [];
    const polish = [];

    commits.forEach(commit => {
      const msg = commit.substring(8); // Strip commit hash
      const lower = msg.toLowerCase();
      if (lower.startsWith('feat') || msg.includes('✨')) {
        features.push(msg);
      } else if (lower.startsWith('fix') || lower.startsWith('bug') || msg.includes('🐞')) {
        fixes.push(msg);
      } else {
        polish.push(msg);
      }
    });

    // Make signature style notes
    let releaseBody = '';
    
    if (features.length > 0) {
      releaseBody += '✨ New Features\n';
      features.forEach(f => {
        const cleaned = formatCommitMessage(f);
        releaseBody += `- ${cleaned}\n`;
      });
      releaseBody += '\n';
    }

    if (polish.length > 0) {
      releaseBody += '🚀 UX/UI Polish & Performance\n';
      polish.forEach(p => {
        const cleaned = formatCommitMessage(p);
        releaseBody += `- ${cleaned}\n`;
      });
      releaseBody += '\n';
    }

    if (fixes.length > 0) {
      releaseBody += '🐞 Bug Fixes & Stability\n';
      fixes.forEach(f => {
        const cleaned = formatCommitMessage(f);
        releaseBody += `- ${cleaned}\n`;
      });
      releaseBody += '\n';
    }

    if (lastTag) {
      releaseBody += `Full Changelog: ${lastTag}...v${newVersion}`;
    } else {
      releaseBody += 'Initial Release';
    }

    const releaseTitle = `Release v${newVersion} - ${getReleaseTitleSnippet(features, polish, fixes)}`;

    log('\n--- Release Notes Preview ---', colors.cyan);
    log(`Title: ${releaseTitle}`, colors.bright);
    log(`Body:\n${releaseBody}`);
    log('-----------------------------\n', colors.cyan);

    // Save temporary release notes for review
    const tempNotesPath = path.join(__dirname, '../.github/RELEASE_NOTES_TEMP.md');
    fs.mkdirSync(path.dirname(tempNotesPath), { recursive: true });
    fs.writeFileSync(tempNotesPath, `# ${releaseTitle}\n\n${releaseBody}`, 'utf8');
    log(`Draft release notes saved to: .github/RELEASE_NOTES_TEMP.md`, colors.blue);

    // 7. Interactive Confirmation
    if (!isNonInteractive) {
      const confirm = await askQuestion(`Proceed with creating release v${newVersion}? (y/N): `);
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        log('Release aborted by user.', colors.yellow);
        cleanupTempNotes();
        return;
      }
    }

    // 8. Commit and Tag Process
    log('\n💾 Executing version bump and tagging...', colors.yellow);
    
    // Update package.json
    packageData.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2) + '\n', 'utf8');

    // Update package-lock.json if it exists
    if (fs.existsSync(packageLockJsonPath)) {
      try {
        const lockData = JSON.parse(fs.readFileSync(packageLockJsonPath, 'utf8'));
        lockData.version = newVersion;
        if (lockData.packages && lockData.packages['']) {
          lockData.packages[''].version = newVersion;
        }
        fs.writeFileSync(packageLockJsonPath, JSON.stringify(lockData, null, 2) + '\n', 'utf8');
      } catch (err) {
        log('Warning: Failed to update version in package-lock.json', colors.yellow);
      }
    }

    try {
      log('Staging files...', colors.blue);
      runGit('git add package.json package-lock.json');
      
      log('Creating version bump commit...', colors.blue);
      runGit(`git commit -m "chore: bump version to ${newVersion}"`);
      
      log('Creating local tag...', colors.blue);
      runGit(`git tag -a "v${newVersion}" -m "Release v${newVersion}"`);
      log(`✓ Tag v${newVersion} created locally.`, colors.green);
    } catch (gitErr) {
      // Rollback changes
      errorLog('Failed during git operations. Rolling back version files...');
      execSync('git checkout package.json package-lock.json');
      throw gitErr;
    }

    // 9. Push changes & Remote tagging
    if (isDryRun) {
      log('\n⚠️ DRY-RUN MODE: Skipping git push and GitHub API release creation.', colors.yellow + colors.bright);
      log('Rolling back local commit and tag to leave working directory clean...', colors.blue);
      runGit(`git tag -d "v${newVersion}"`);
      runGit('git reset --hard HEAD~1');
      log('✓ Local changes reverted successfully.', colors.green);
      cleanupTempNotes();
      return;
    }

    log('\n📤 Pushing changes to remote origin...', colors.yellow);
    try {
      runGit('git push origin main');
      runGit(`git push origin "v${newVersion}"`);
      log('✓ Pushed to GitHub successfully.', colors.green);
    } catch (pushErr) {
      errorLog('Pushing to remote origin failed.');
      log('Initiating rollback of local commit and tag...', colors.yellow);
      runGit(`git tag -d "v${newVersion}"`);
      runGit('git reset --hard HEAD~1');
      throw new Error(`Failed to push tag/commits: ${pushErr.message}`);
    }

    // 10. Call GitHub API to create release
    log('\n🌐 Creating GitHub Release via API...', colors.yellow);
    await createGithubRelease(githubToken, newVersion, releaseTitle, releaseBody);
    
    log('\n🎉 RELEASE COMPLETED SUCCESSFULLY!', colors.green + colors.bright);
    log(`Release URL: https://github.com/${repoOwner}/${repoName}/releases/tag/v${newVersion}`, colors.cyan);
    
    cleanupTempNotes();
  } catch (err) {
    errorLog(err.message);
    process.exit(1);
  }
}

// Clean up temporary release notes
function cleanupTempNotes() {
  const tempNotesPath = path.join(__dirname, '../.github/RELEASE_NOTES_TEMP.md');
  if (fs.existsSync(tempNotesPath)) {
    try {
      fs.unlinkSync(tempNotesPath);
    } catch (e) {
      // Ignore
    }
  }
}

// Bumps semver version string
function bumpVersion(version, type) {
  const parts = version.split('.');
  let major = parseInt(parts[0], 10);
  let minor = parseInt(parts[1], 10);
  let patch = parseInt(parts[2], 10);

  if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

// Parse/Format commit message for release notes
function formatCommitMessage(msg) {
  let cleaned = msg.trim();
  
  // Strip conventional commit prefix if exists
  cleaned = cleaned.replace(/^(feat|fix|docs|style|refactor|perf|test|chore|ci)(?:\([^)]+\))?:\s*/i, '');
  
  // Capitalize first letter
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  
  // Format bold key nouns/features
  cleaned = cleaned.replace(/`([^`]+)`/g, '**$1**');
  
  return cleaned;
}

// Generates a short descriptive release title suffix
function getReleaseTitleSnippet(feats, polish, fixes) {
  const words = [];
  if (feats.length > 0) words.push('New Features');
  if (polish.length > 0) words.push('UI/UX Polish');
  if (fixes.length > 0) words.push('Stability Fixes');
  
  return words.join(' & ') || 'Update';
}

// GitHub API call to create release
function createGithubRelease(token, version, title, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      tag_name: `v${version}`,
      target_commitish: 'main',
      name: title,
      body: body,
      draft: false,
      prerelease: false
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${repoOwner}/${repoName}/releases`,
      method: 'POST',
      headers: {
        'User-Agent': 'NodeJS-Release-Script',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          log(`✓ GitHub Release created. (HTTP ${res.statusCode})`, colors.green);
          resolve();
        } else {
          reject(new Error(`GitHub API returned error ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Network error creating GitHub release: ${e.message}`));
    });

    req.write(postData);
    req.end();
  });
}

// Run main
main();
