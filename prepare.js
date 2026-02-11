const { copyFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');

const www = join(__dirname, 'www');
if (!existsSync(www)) mkdirSync(www);

// Web files (keep originals with different names for backend)
copyFileSync(join(__dirname, 'index.html'), join(www, 'landing.html'));
console.log('✓ index.html → www/landing.html');
copyFileSync(join(__dirname, 'app.html'), join(www, 'app.html'));
console.log('✓ app.html → www/app.html');

// Mobile app: mobile.html becomes index.html (Capacitor entry point)
copyFileSync(join(__dirname, 'mobile.html'), join(www, 'index.html'));
console.log('✓ mobile.html → www/index.html (Capacitor entry point)');
