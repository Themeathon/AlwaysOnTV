const { execFileSync } = require('child_process');
const path = require('path');

const version = process.argv[2]?.replace(/^v/, '');

if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
    console.error('Usage: npm run set-version -- <major.minor.patch>');
    process.exit(1);
}

// npm version also updates package-lock.json
for (const dir of ['.', 'Client', 'Server']) {
    execFileSync('npm', ['version', version, '--no-git-tag-version', '--allow-same-version'], {
        cwd: path.join(__dirname, '..', dir),
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });
}

console.log(`\nVersion set to ${version}. Tag the release as v${version}.`);
