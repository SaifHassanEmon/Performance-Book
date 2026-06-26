const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');

// Clean and recreate www directory
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });

const itemsToCopy = ['index.html', 'manifest.json', 'sw.js', 'css', 'js', 'icons'];

itemsToCopy.forEach(item => {
  const srcPath = path.join(srcDir, item);
  const destPath = path.join(destDir, item);
  
  if (fs.existsSync(srcPath)) {
    fs.cpSync(srcPath, destPath, { recursive: true });
    console.log(`Copied ${item} to www/`);
  } else {
    console.warn(`Warning: ${item} not found.`);
  }
});

console.log('Build completed successfully!');
