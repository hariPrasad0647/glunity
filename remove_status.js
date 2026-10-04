const fs = require('fs');
const file = 'd:/glunity/glunity/modules/admin/controllers/admin.controller.js';
let content = fs.readFileSync(file, 'utf8');

// Remove status = 'accepted' from getUserDetails
content = content.replace(/AND status = \?/g, '');
content = content.replace(/\{ replacements: \[userId, 'accepted'\] \}/g, '{ replacements: [userId] }');

// Remove status = 'accepted' from getUserFollowers and getUserFollowing
content = content.replace(/AND status = 'accepted'/g, '');
content = content.replace(/AND f\.status = 'accepted'/g, '');

fs.writeFileSync(file, content);
console.log('Removed status checks from admin.controller.js');
