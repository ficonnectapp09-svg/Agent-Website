const fs = require('fs');
const cp = require('child_process');

if (fs.existsSync('./frontend/package.json')) {
  console.log('Installing dependencies from repository root...');
  cp.execSync('npm install --prefix frontend', { stdio: 'inherit' });
  if (fs.existsSync('./backend/package.json')) {
    cp.execSync('npm install --prefix backend', { stdio: 'inherit' });
  }
} else {
  console.log('Installing dependencies from frontend directory...');
  cp.execSync('npm install', { stdio: 'inherit' });
}
