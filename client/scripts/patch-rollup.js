import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rollupNativePath = path.resolve(__dirname, '../node_modules/rollup/dist/native.js');

if (fs.existsSync(rollupNativePath)) {
  let content = fs.readFileSync(rollupNativePath, 'utf8');
  if (!content.includes("@rollup/wasm-node/dist/native.js")) {
    content = content.replace(
      /const nativeModule = requireWithFriendlyError\([\s\S]*?\);/,
      `let nativeModule;
try {
  nativeModule = requireWithFriendlyError(existsSync(path.join(__dirname, localName)) ? localName : \`@rollup/rollup-\${packageBase}\`);
} catch (err) {
  try {
    nativeModule = require('@rollup/wasm-node/dist/native.js');
  } catch {
    throw err;
  }
}`
    );
    fs.writeFileSync(rollupNativePath, content, 'utf8');
    console.log('✅ Rollup patched for WebAssembly fallback support.');
  }
}
