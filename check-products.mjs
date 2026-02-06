import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://glskbegsmdrylrhczpyy.supabase.co';
const supabaseKey = 'sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, category')
      .limit(20);
    
    if (error) throw error;
    
    console.log('\n=== PRODUCTS IN DATABASE ===\n');
    if (data && data.length > 0) {
      // Show all products
      data.forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.name.padEnd(20)} | Category: "${p.category}"`);
      });
      
      // Extract unique categories
      const categories = new Set(data.map(p => p.category));
      console.log('\n=== UNIQUE CATEGORIES ===\n');
      Array.from(categories).forEach(cat => {
        console.log(`  - "${cat}"`);
      });
      
      console.log('\n=== UPDATE NEEDED FOR ShiftStock.tsx ===\n');
      console.log('Change MEAT_CATEGORIES to:');
      const meatLikeCategories = Array.from(categories).filter(c => 
        c && (c.toLowerCase().includes('meat') || c.toLowerCase().includes('beef') || 
              c.toLowerCase().includes('goat') || c.toLowerCase().includes('chicken') ||
              c.toLowerCase().includes('liver') || c.toLowerCase().includes('offal') ||
              c.toLowerCase().includes('matumbo'))
      );
      
      if (meatLikeCategories.length > 0) {
        console.log(`const MEAT_CATEGORIES = [${meatLikeCategories.map(c => `'${c.toLowerCase()}'`).join(', ')}];`);
      } else {
        console.log('const MEAT_CATEGORIES = [' + Array.from(categories).map(c => `'${c.toLowerCase()}'`).join(', ') + '];');
      }
    } else {
      console.log('No products found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkProducts();
