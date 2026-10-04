const fs = require('fs');
const file = 'd:/glunity/glunity/modules/admin/controllers/admin.controller.js';
let content = fs.readFileSync(file, 'utf8');

// The issue is unescaped backticks inside template literals.
// Let's just blindly escape all backticks that are NOT the start or end of a template literal.
// A simpler way: we know exactly which column names we backticked.
const columns = ['createdAt', 'updatedAt', 'userId', 'followerId', 'followingId', 'finalScore'];

columns.forEach(col => {
    // Replace unescaped backtick + colname + unescaped backtick
    // Wait, regex might be tricky.
    // Let's just do:
    content = content.replace(new RegExp(`\\\`${col}\\\``, 'g'), col); // First remove all backticks we added
});

// Now let's carefully add them back safely.
// In sequelize, we don't strictly need to quote them IF we ensure exact casing in MySQL, but TiDB might be tricky.
// Wait, the original error was "Unknown column 'createdat' in 'where clause'". This means the SQL parser lowercased it.
// If we just use quotes around the column names, they won't be lowercased.
// Let's replace 'createdAt' with '\\`createdAt\\`' when inside a template literal, and '\`createdAt\`' when inside a single quote.
// A bulletproof way: instead of raw SQL queries where possible, but it's too late.
// Let's just add escaped backticks.
columns.forEach(col => {
    // If the query is in single quotes:
    content = content.replace(new RegExp(`WHERE ${col}`, 'g'), `WHERE \\\`${col}\\\``);
    content = content.replace(new RegExp(`AND ${col}`, 'g'), `AND \\\`${col}\\\``);
    content = content.replace(new RegExp(`u.${col} as joined`, 'g'), `u.\\\`${col}\\\` as joined`);
    content = content.replace(new RegExp(`ORDER BY u.${col}`, 'g'), `ORDER BY u.\\\`${col}\\\``);
    content = content.replace(new RegExp(`DATE\\(${col}\\)`, 'g'), `DATE(\\\`${col}\\\`)`);
    
    // For aliases:
    content = content.replace(new RegExp(`pt.${col} =`, 'g'), `pt.\\\`${col}\\\` =`);
    content = content.replace(new RegExp(`ts.${col} =`, 'g'), `ts.\\\`${col}\\\` =`);
    content = content.replace(new RegExp(`p.${col} =`, 'g'), `p.\\\`${col}\\\` =`);
    content = content.replace(new RegExp(`ts.${col}`, 'g'), `ts.\\\`${col}\\\``);
    content = content.replace(new RegExp(`SELECT ${col} FROM`, 'g'), `SELECT \\\`${col}\\\` FROM`);
});

fs.writeFileSync(file, content);
console.log('Fixed quotes properly!');
