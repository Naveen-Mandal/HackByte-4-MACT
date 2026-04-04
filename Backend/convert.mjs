import fs from 'fs';
import path from 'path';

function convertFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Convert destructured requires: const { a, b } = require('./c');
    content = content.replace(/const\s+{\s*([^}]+?)\s*}\s*=\s*require\((['"])(.*?)\2\);/g, (match, vars, quote, src) => {
        if (src.startsWith('.') && !src.endsWith('.js')) {
            src += '.js';
        }
        return `import { ${vars.trim()} } from "${src}";`;
    });

    // Convert default requires: const a = require('./c');
    content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*require\((['"])(.*?)\2\);/g, (match, varName, quote, src) => {
        if (src.startsWith('.') && !src.endsWith('.js')) {
            src += '.js';
        }
        return `import ${varName} from "${src}";`;
    });

    // Convert module.exports = { a, b };
    content = content.replace(/module\.exports\s*=\s*{([^}]+)};/g, 'export { $1 };');

    // Convert module.exports = myFunction;
    content = content.replace(/module\.exports\s*=\s*([a-zA-Z0-9_]+);/g, 'export default $1;');

    fs.writeFileSync(filePath, content, 'utf8');
}

const dir = 'src/services';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
files.forEach(f => convertFile(path.join(dir, f)));

console.log("Converted files.");
