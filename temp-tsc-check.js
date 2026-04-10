const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, 'node_modules', 'typescript', 'lib', 'typescript.js'), 'utf8').split('\n');
for (let i = 128330; i <= 128390; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
