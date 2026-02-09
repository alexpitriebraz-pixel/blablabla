const { copyFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');

const www = join(__dirname, 'www');
if (!existsSync(www)) mkdirSync(www);

['index.html', 'app.html'].forEach(f => {
  copyFileSync(join(__dirname, f), join(www, f));
  console.log(`✓ ${f} → www/`);
});
