const fs = require('fs');

let content = fs.readFileSync('ADMIN_DASHBOARD_API.md', 'utf8');

// Remove query params from dashboard
content = content.replace(/### Query Parameters[\s\S]*?### cURL Request/, '### cURL Request');

// Revert dashboard curl back to basic
content = content.replace(/curl -X GET "https:\/\/glunity.onrender.com\/api\/admin\/dashboard\?timeRange=1m"/, 'curl -X GET "https://glunity.onrender.com/api/admin/dashboard"');

// Remove userGrowth from dashboard response example
content = content.replace(/    "userGrowth": \[[\s\S]*?\],\n    "userActivity"/, '    "userActivity"');

// Add the new section for User Growth
const newSection = `

---

## 3. Get User Growth Chart Data

Retrieves the day-by-day (or grouped) user registration counts for a specified time range.

**Endpoint:** \`GET /api/admin/dashboard/user-growth\`
**Authentication:** Required

### Query Parameters
- \`timeRange\` (optional): Preset ranges. Values: \`7d\` (default), \`1m\`, \`3m\`, \`8m\`, \`1y\`.
- \`startDate\` & \`endDate\` (optional): Custom date range (e.g. \`startDate=2023-01-01&endDate=2023-12-31\`). Overrides \`timeRange\`.

### cURL Request
\`\`\`bash
curl -X GET "https://glunity.onrender.com/api/admin/dashboard/user-growth?timeRange=1m" \\
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \\
  -H "Content-Type: application/json"
\`\`\`

### Response Example

\`\`\`json
{
  "success": true,
  "data": {
    "userGrowth": [
      {
        "date": "2026-09-28",
        "count": 120
      },
      {
        "date": "2026-09-29",
        "count": 145
      },
      {
        "date": "2026-09-30",
        "count": 180
      }
    ]
  }
}
\`\`\`
`;

content = content + newSection;

// Fix numbers in ADMIN_USERS_API.md since they now collide (e.g. "3. Get All Users" -> "4. Get All Users")
// Actually it's better to just leave them or rename the dashboard ones.
// The user doesn't care that much about markdown headings numbers, but let's be clean.

fs.writeFileSync('ADMIN_DASHBOARD_API.md', content);
