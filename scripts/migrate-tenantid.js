const fs = require('fs');
const path = require('path');

const root = 'e:\\web-demo-projects\\restaurant-managemnet-system';

const files = [
  'app\\dashboard\\tables\\page.tsx',
  'app\\dashboard\\staff\\page.tsx',
  'app\\dashboard\\reports\\page.tsx',
  'app\\dashboard\\orders\\page.tsx',
  'app\\dashboard\\orders\\kitchen\\page.tsx',
  'app\\dashboard\\menu\\page.tsx',
  'app\\dashboard\\menu\\categories\\page.tsx',
  'app\\dashboard\\inventory\\page.tsx',
  'app\\dashboard\\customers\\page.tsx',
  'app\\dashboard\\expenses\\page.tsx',
  'app\\dashboard\\billing\\page.tsx',
  'app\\dashboard\\orders\\new\\page.tsx',
];

for (const file of files) {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) { console.log('NOT FOUND:', file); continue; }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // 1. Add tenantId extraction after const { user } = useAuth(); line
  //    if it's not already there
  if (content.includes("const { user } = useAuth()") && !content.includes('const tenantId = user?.tenantId')) {
    content = content.replace(
      /const \{ user \} = useAuth\(\);?\n/,
      "const { user } = useAuth();\n  const tenantId = user?.tenantId || '';\n"
    );
  }

  // 2. Fix subscribeToCollection calls: subscribeToCollection<T>('col' → subscribeToCollection<T>(tenantId, 'col'
  content = content.replace(
    /subscribeToCollection<([^>]+)>\('([^']+)'/g,
    "subscribeToCollection<$1>(tenantId, '$2'"
  );

  // 3. Fix addDocument calls: addDocument('col' → addDocument(tenantId, 'col'
  content = content.replace(
    /addDocument<([^>]+)>\('([^']+)'/g,
    "addDocument<$1>(tenantId, '$2'"
  );
  content = content.replace(
    /await addDocument\('([^']+)'/g,
    "await addDocument(tenantId, '$1'"
  );

  // 4. Fix updateDocument calls: updateDocument('col' → updateDocument(tenantId, 'col'
  content = content.replace(
    /updateDocument<([^>]+)>\('([^']+)'/g,
    "updateDocument<$1>(tenantId, '$2'"
  );
  content = content.replace(
    /await updateDocument\('([^']+)'/g,
    "await updateDocument(tenantId, '$1'"
  );

  // 5. Fix deleteDocument calls: deleteDocument('col' → deleteDocument(tenantId, 'col'
  content = content.replace(
    /await deleteDocument\('([^']+)'/g,
    "await deleteDocument(tenantId, '$1'"
  );

  // 6. Fix getAllDocuments calls
  content = content.replace(
    /await getAllDocuments<([^>]+)>\('([^']+)'/g,
    "await getAllDocuments<$1>(tenantId, '$2'"
  );

  // 7. Fix getDocumentById calls
  content = content.replace(
    /await getDocumentById<([^>]+)>\('([^']+)'/g,
    "await getDocumentById<$1>(tenantId, '$2'"
  );

  // 8. Fix findCustomerByPhone calls
  content = content.replace(
    /await findCustomerByPhone\('([^']+)',/g,
    "await findCustomerByPhone(tenantId, '$1',"
  );
  content = content.replace(
    /findCustomerByPhone\(phone/g,
    "findCustomerByPhone(tenantId, phone"
  );

  // 9. Fix createOrUpdateCustomerFromOrder
  content = content.replace(
    /await createOrUpdateCustomerFromOrder\(/g,
    "await createOrUpdateCustomerFromOrder(tenantId, "
  );

  // 10. Fix updateCustomerStats
  content = content.replace(
    /await updateCustomerStats\(/g,
    "await updateCustomerStats(tenantId, "
  );

  // 11. Fix useEffect dependency to include tenantId
  content = content.replace(
    /\}, \[\]\);(\s*\/\/ .*firestore|$)/gm,
    "}, [tenantId]);$1"
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('UPDATED:', file);
  } else {
    console.log('NO CHANGE:', file);
  }
}

console.log('\nDone!');
