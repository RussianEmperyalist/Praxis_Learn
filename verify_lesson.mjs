const fs = require('fs');
const h = fs.readFileSync('lesson.html', 'utf-8');
console.log('checkBtn async:', h.includes('checkBtn.onclick = async'));
console.log('parseDockerfile import:', h.includes("await import('./scripts/dockerfile-parser.js')"));
console.log('createDockerfilePlayground:', h.includes('createDockerfilePlayground'));

// Check syntax by extracting the script block
const scriptMatch = h.match(/<script type="module">([\s\S]*?)<\/script>/);
if (scriptMatch) {
  const code = scriptMatch[1];
  console.log('Script block length:', code.length, 'chars');
  
  // Check for await without async
  const lines = code.split('\n');
  let issues = 0;
  lines.forEach((line, i) => {
    if (line.includes('await ') && !line.includes('async')) {
      // Check if parent function is async
      if (!line.match(/async\s*\(/) && !line.match(/async\s*\(/)) {
        console.log('  Line ' + (i+1) + ' has await but no async in same line');
        issues++;
      }
    }
  });
  console.log('Potential async/await issues:', issues);
}
