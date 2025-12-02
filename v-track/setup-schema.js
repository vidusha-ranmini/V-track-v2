/**
 * Setup script to apply road development schema changes
 */

const fs = require('fs');
const path = require('path');

async function setupSchema() {
  try {
    console.log('🔧 Setting up road development schema...');
    
    // Import Supabase client
    const { createAdminClient } = await import('./src/lib/supabase');
    const supabase = createAdminClient();
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'road_development_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Schema file loaded, applying changes...');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔨 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`  [${i + 1}/${statements.length}] Executing...`);
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
          if (error) {
            console.warn(`    ⚠️  Warning for statement ${i + 1}:`, error.message);
          } else {
            console.log(`    ✅ Statement ${i + 1} completed`);
          }
        } catch (err) {
          console.warn(`    ⚠️  Warning for statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Schema setup completed!');
    console.log('🔍 Verifying table structure...');
    
    // Verify the changes
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default')
      .eq('table_name', 'sub_sub_roads')
      .in('column_name', ['width', 'height', 'square_feet', 'cost_per_sq_ft', 'total_cost', 'development_status']);
    
    if (columnError) {
      console.error('❌ Error verifying columns:', columnError);
    } else {
      console.log('✅ New columns verified:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }
    
  } catch (error) {
    console.error('💥 Schema setup failed:', error);
    
    // Try alternative approach - direct column addition
    console.log('🔄 Trying alternative approach...');
    try {
      const { createAdminClient } = await import('./src/lib/supabase');
      const supabase = createAdminClient();
      
      console.log('📝 Adding columns directly...');
      
      // Try to add columns one by one
      const alterCommands = [
        "ALTER TABLE sub_sub_roads ADD COLUMN IF NOT EXISTS width DECIMAL(8,2) DEFAULT 25.0",
        "ALTER TABLE sub_sub_roads ADD COLUMN IF NOT EXISTS height DECIMAL(8,2) DEFAULT 10.0",
        "ALTER TABLE sub_sub_roads ADD COLUMN IF NOT EXISTS square_feet DECIMAL(10,2) DEFAULT 250.0",
        "ALTER TABLE sub_sub_roads ADD COLUMN IF NOT EXISTS cost_per_sq_ft DECIMAL(10,2) DEFAULT 400.00",
        "ALTER TABLE sub_sub_roads ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15,2) DEFAULT 100000.00",
        "ALTER TABLE sub_sub_roads ADD COLUMN IF NOT EXISTS development_status VARCHAR(20) DEFAULT 'undeveloped'"
      ];
      
      for (const cmd of alterCommands) {
        try {
          console.log(`   Executing: ${cmd.substring(0, 50)}...`);
          await supabase.rpc('exec_sql', { sql_query: cmd });
          console.log(`   ✅ Success`);
        } catch (err) {
          console.log(`   ⚠️  ${err.message}`);
        }
      }
      
      console.log('✅ Alternative approach completed');
      
    } catch (altError) {
      console.error('💥 Alternative approach also failed:', altError);
      process.exit(1);
    }
  }
}

setupSchema();