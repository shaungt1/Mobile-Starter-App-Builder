import fs from 'node:fs';
import path from 'node:path';

const appRoot = path.resolve(process.argv[2] ?? '');
const dependencyRoot = path.join(appRoot, 'node_modules');
if (!appRoot || appRoot === path.parse(appRoot).root) {
  throw new Error(`Refusing unsafe application root: ${appRoot || '(empty)'}`);
}
if (!fs.existsSync(path.join(appRoot, 'package.json'))) {
  throw new Error(`Refusing cleanup without package.json in ${appRoot}`);
}
if (path.dirname(dependencyRoot) !== appRoot || path.basename(dependencyRoot) !== 'node_modules') {
  throw new Error(`Refusing unsafe dependency path: ${dependencyRoot}`);
}

fs.rmSync(dependencyRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
console.log(`Removed derived dependency tree: ${dependencyRoot}`);
