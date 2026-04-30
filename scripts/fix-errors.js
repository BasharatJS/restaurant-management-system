const fs = require('fs');
const path = require('path');

const root = 'e:\\web-demo-projects\\restaurant-managemnet-system';

// Fix specific pages with wrong subscribeToCollection arg order
// The script already added tenantId in wrong place for some patterns like:
// subscribeToCollection<T>(  'collName', (data) => ...
// (where tenantId was NOT injected because pattern matched differently)

const fixes = [
  // Orders page
  {
    file: 'app\\dashboard\\orders\\page.tsx',
    from: /subscribeToCollection<Order>\(\s*\n?\s*'orders',\s*\n?\s*\(data\)/,
    to: "subscribeToCollection<Order>(\n      tenantId,\n      'orders',\n      (data)"
  },
  // Kitchen page
  {
    file: 'app\\dashboard\\orders\\kitchen\\page.tsx',
    from: /subscribeToCollection<Order>\(\s*\n?\s*'orders',\s*\n?\s*\(data\)/,
    to: "subscribeToCollection<Order>(\n      tenantId,\n      'orders',\n      (data)"
  },
  // Expenses page
  {
    file: 'app\\dashboard\\expenses\\page.tsx',
    from: /subscribeToCollection<Expense>\(\s*\n?\s*'expenses',/,
    to: "subscribeToCollection<Expense>(\n      tenantId,\n      'expenses',"
  },
];

for (const fix of fixes) {
  const filePath = path.join(root, fix.file);
  if (!fs.existsSync(filePath)) { console.log('NOT FOUND:', fix.file); continue; }
  let content = fs.readFileSync(filePath, 'utf8');
  const updated = content.replace(fix.from, fix.to);
  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log('FIXED:', fix.file);
  } else {
    console.log('NO MATCH:', fix.file, '— checking content...');
    // Print relevant section
    const idx = content.indexOf('subscribeToCollection');
    console.log('  Context:', content.substring(idx, idx + 200));
  }
}

// Fix user.id → user.uid in all pages
const allPages = [
  'app\\dashboard\\page.tsx',
  'app\\dashboard\\orders\\new\\page.tsx',
  'app\\dashboard\\expenses\\page.tsx',
  'app\\dashboard\\billing\\generate\\page.tsx',
  'app\\dashboard\\orders\\[orderId]\\page.tsx',
];

for (const file of allPages) {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) { console.log('NOT FOUND:', file); continue; }
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  // user.id → user.uid (but not user.isActive, user.role etc.)
  content = content.replace(/user\?\.id\b/g, 'user?.uid');
  content = content.replace(/user\.id\b/g, 'user.uid');
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('FIXED user.id->uid:', file);
  }
}

// Fix authStore.ts - update any old-style calls
const storePath = path.join(root, 'store\\authStore.ts');
if (fs.existsSync(storePath)) {
  let content = fs.readFileSync(storePath, 'utf8');
  // The store probably has old subscription-based calls with wrong arg count
  // Let's just check what's there
  console.log('\nauthStore.ts snippet:', content.substring(0, 400));
}

console.log('\nDone!');
