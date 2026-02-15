const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes', 'v1');

// Mapping old table names to new ones
const tableRenames = {
    'invitationGuests': 'guests',
    'events': 'guestbookEvents',
    'invitationContents': 'invitationPages',
    'wishes': 'invitationWishes'
};

// Get all .ts files in routes/v1
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
    const filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;

    // Only modify import lines
    const modifiedLines = lines.map(line => {
        if (line.includes('from \'@/db/schema\'') || line.includes('from "@/db/schema"')) {
            let newLine = line;
            Object.entries(tableRenames).forEach(([oldName, newName]) => {
                // Only replace in import statements, preserve as-is aliases
                const importPattern = new RegExp(`\\b${oldName}\\b(?!\\s+as)`, 'g');
                if (importPattern.test(newLine)) {
                    newLine = newLine.replace(importPattern, newName);
                    modified = true;
                }
            });
            return newLine;
        }
        return line;
    });

    if (modified) {
        fs.writeFileSync(filePath, modifiedLines.join('\n'), 'utf8');
        console.log(`✅ Updated imports in: ${file}`);
    }
});

console.log('\n✅ Import statements updated!');
console.log('⚠️  Note: You may need to update variable names manually where they conflict with new table names.');
