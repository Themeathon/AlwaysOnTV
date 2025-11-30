const fs = require('fs');
const path = require('path');

const clientDistPath = path.join(__dirname, '../Client/dist');
const serverPublicPath = path.join(__dirname, '../Server/public');

function copyFolderSync(from, to) {
    if (!fs.existsSync(to)) {
        fs.mkdirSync(to, { recursive: true });
    }

    fs.readdirSync(from).forEach(element => {
        const stats = fs.lstatSync(path.join(from, element));

        if (stats.isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else if (stats.isDirectory()) {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });
}

function deleteFolderRecursive(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file, index) => {
            const curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
    }
}

console.log('--- Deploying Client to Server ---');

if (!fs.existsSync(clientDistPath)) {
    console.error(`Error: Client build folder not found at ${clientDistPath}. Did you run 'npm run build' in the Client folder?`);
    process.exit(1);
}

if (!fs.existsSync(serverPublicPath)) {
    fs.mkdirSync(serverPublicPath, { recursive: true });
}

console.log('Copying files...');
try {
    copyFolderSync(clientDistPath, serverPublicPath);
    console.log('✅ Success! Client files copied to Server/public.');
} catch (err) {
    console.error('❌ Error copying files:', err);
    process.exit(1);
}