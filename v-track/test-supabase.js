import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase Connection...\n');
    
    // Check environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('📋 Environment Check:');
    console.log(`URL: ${url ? '✅ Set' : '❌ Missing'}`);
    console.log(`Anon Key: ${anonKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`Service Key: ${serviceKey ? '✅ Set' : '❌ Missing'}\n`);
    
    if (!url || url === 'your_supabase_url_here') {
        console.log('❌ Supabase URL not configured. Please update .env.local');
        return;
    }
    
    if (!anonKey || anonKey === 'your_supabase_anon_key_here') {
        console.log('❌ Supabase Anon Key not configured. Please update .env.local');
        return;
    }
    
    try {
        // Test with anon key first (since service key might be same as anon)
        const supabase = createClient(url, anonKey);
        
        console.log('🔌 Testing database connection...');
        
        // Test 1: Simple query to roads table
        const { data: roads, error: roadsError } = await supabase
            .from('roads')
            .select('*')
            .limit(1);
            
        if (roadsError) {
            console.log('❌ Database connection failed:');
            console.log(roadsError.message);
            console.log('💡 This likely means the database schema has not been created yet.');
            console.log('Please run the database_schema.sql in your Supabase SQL Editor.');
            return;
        }
        
        console.log('✅ Database connection successful!');
        console.log(`📊 Found ${roads?.length || 0} roads in database`);
        
        // Test 2: Insert a test road
        console.log('\n🧪 Testing insert operation...');
        const { data: newRoad, error: insertError } = await supabase
            .from('roads')
            .insert([{ name: 'Test Road - ' + Date.now() }])
            .select()
            .single();
            
        if (insertError) {
            console.log('❌ Insert operation failed:');
            console.log(insertError.message);
            return;
        }
        
        console.log('✅ Insert operation successful!');
        console.log('🆔 New road ID:', newRoad.id);
        
        // Test 3: Delete the test road
        const { error: deleteError } = await supabase
            .from('roads')
            .delete()
            .eq('id', newRoad.id);
            
        if (deleteError) {
            console.log('⚠️ Cleanup failed, but main functionality works');
        } else {
            console.log('🧹 Test cleanup successful');
        }
        
        console.log('\n🎉 Supabase is fully connected and working!');
        console.log('🚀 Your Village Management System is ready to use real data.');
        
    } catch (error) {
        console.log('❌ Connection test failed:');
        console.log(error.message);
        console.log('\n💡 Make sure you:');
        console.log('1. Updated .env.local with correct Supabase credentials');
        console.log('2. Ran the database schema in Supabase SQL Editor');
        console.log('3. Have proper internet connection');
    }
}

testSupabaseConnection();