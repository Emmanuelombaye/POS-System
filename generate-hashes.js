const bcrypt = require('bcryptjs');

const passwords = {
  '@Kenya90!': 'Alice Cashier - Tamasha',
  '@Kenya80!': 'Bob Cashier - Reem',  
  '@Kenya70!': 'Carol Cashier - LungaLunga',
  '@Admin001Eden': 'Admin',
  '@Manager001Eden': 'Manager'
};

console.log('=== BCRYPT HASH GENERATION ===\n');

Object.entries(passwords).forEach(([pwd, desc]) => {
  const hash = bcrypt.hashSync(pwd, 10);
  console.log(`Password: ${pwd}`);
  console.log(`For: ${desc}`);
  console.log(`Hash: ${hash}\n`);
});
