// End-to-end boot smoke test: launch the REAL app in --shot mode (full main +
// renderer + canvas pipeline), then assert it produced a non-trivial render and
// exited cleanly. Catches overlay/renderer crashes that the node unit tests can't.
// Run: npm run test:boot
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const electron = require('electron'); // resolves to the electron binary path
const png = path.join(root, '_render.png');

try { fs.unlinkSync(png); } catch { /* fresh */ }

try {
  execFileSync(electron, ['.', '--shot', '--state=sit', '--disable-gpu'], { cwd: root, stdio: 'inherit', timeout: 60000 });
} catch (e) {
  console.error('BOOT TEST FAILED: electron exited with an error:', e.message);
  process.exit(1);
}

if (!fs.existsSync(png) || fs.statSync(png).size < 1000) {
  console.error('BOOT TEST FAILED: no/empty render produced (overlay or renderer likely crashed)');
  process.exit(1);
}
console.log('boot test OK —', fs.statSync(png).size, 'byte render');
try { fs.unlinkSync(png); } catch { /* ignore */ }
