// Script to fix all repository imports
// Run this file to update all import paths

const fs = require('fs');
const path = require('path');

const repositoriesDir = path.join(__dirname, 'src', 'repositories');
const servicesDir = path.join(__dirname, 'src', 'services-invitation');

function fixImports(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix supabase import
    content = content.replace(
        /import\s*{\s*getSupabaseClient\s*}\s*from\s*['"]@\/lib\/supabaseClient['"]/g,
        "import { getSupabaseClient } from '../lib/supabase';\nimport type { Env } from '../lib/types'"
    );

    // Fix repository imports (if any)
    content = content.replace(
        /@\/lib\/repositories\//g,
        '../repositories/'
    );

    // Fix service imports (if any)
    content = content.replace(
        /@\/lib\/services\//g,
        '../services-invitation/'
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${path.basename(filePath)}`);
}

// Fix all repository files
if (fs.existsSync(repositoriesDir)) {
    const files = fs.readdirSync(repositoriesDir).filter(f => f.endsWith('.ts'));
    files.forEach(file => {
        fixImports(path.join(repositoriesDir, file));
    });
}

// Fix all service files
if (fs.existsSync(servicesDir)) {
    const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));
    files.forEach(file => {
        fixImports(path.join(servicesDir, file));
    });
}

console.log('✅ All imports fixed!');
