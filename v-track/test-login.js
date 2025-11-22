import fetch from 'node-fetch';

async function testLogin() {
    console.log('🔐 Testing Login API...\n');
    
    try {
        // Test the login endpoint
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin'
            })
        });
        
        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
        
        const responseData = await response.json();
        console.log('📄 Response Data:', responseData);
        
        if (response.ok) {
            console.log('\n✅ Login successful!');
            console.log('🎫 Token received:', responseData.token ? 'Yes' : 'No');
        } else {
            console.log('\n❌ Login failed!');
            console.log('💡 Error:', responseData.error);
        }
        
    } catch (error) {
        console.log('❌ Failed to connect to login API:');
        console.log('Error:', error.message);
        console.log('\n💡 Make sure your Next.js server is running with: npm run dev');
    }
}

testLogin();