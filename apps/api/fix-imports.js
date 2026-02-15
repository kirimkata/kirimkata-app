const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes', 'v1');

const replacements = [
    { from: /\binvitationGuests\b/g, to: 'guests' },
    { from: /\bevents\b/g, to: 'guestbookEvents' },
    { from: /\binvitationContents\b/g, to: 'invitationPages' },
    { from: /\bwishes\b/g, to: 'invitationWishes' },
];

// Get all .ts files in routes/v1
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
    const filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(({ from, to }) => {
        if (content.match(from)) {
            content = content.replace(from, to);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated: ${file}`);
    }
});

console.log('✅ All imports updated!');
