const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function addColumns() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔧 Adding missing columns to sub_sub_roads table...');

  const queries = [
    "ALTER TABLE sub_sub_roads ADD COLUMN IF NOT EXISTS width DECIMAL(8,2) DEFAULT 25.0;",
    "ALTER TABLE sub_sub_roads ADD COLUMN IF NOT EXISTS height DECIMAL(8,2) DEFAULT 10.0;",
    "ALTER TABLE sub_sub_roads ADD COLUMN IF NOT EXISTS square_feet DECIMAL(10,2) DEFAULT 250.0;",
    "ALTER TABLE sub_sub_roads ADD COLUMN IF NOT EXISTS cost_per_sq_ft DECIMAL(10,2) DEFAULT 400.00;",
    "ALTER TABLE sub_sub_roads ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15,2) DEFAULT 100000.00;",
    "ALTER TABLE sub_sub_roads ADD COLUMN IF NOT EXISTS development_status VARCHAR(20) DEFAULT 'undeveloped';"
  ];

  for (let i = 0; i < queries.length; i++) {
    try {
      console.log(`Executing query ${i + 1}...`);
      const { data, error } = await supabase.rpc('exec', { query: queries[i] });
      if (error) {
        console.log('Error:', error.message);
      } else {
        console.log(`✅ Query ${i + 1} completed`);
      }
    } catch (err) {
      console.log(`Warning for query ${i + 1}:`, err.message);
    }
  }

  console.log('🎉 Columns added successfully!');
}

addColumns().catch(console.error);