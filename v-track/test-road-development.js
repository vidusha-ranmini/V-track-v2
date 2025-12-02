/**
 * Test script for Road Development functionality
 * Tests the API endpoints and database operations
 */

const API_BASE = 'http://localhost:3000/api';

// Test configuration
const testConfig = {
  baseUrl: API_BASE,
  timeout: 5000
};

// Test data
const testRoadDevelopment = {
  road_id: null, // Will be set after fetching roads
  parent_sub_road_id: null, // Optional
  name: 'Test Development Lane',
  width: 30,
  height: 25,
  cost_per_sq_ft: 450,
  development_status: 'undeveloped'
};

// Utility function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${testConfig.baseUrl}${endpoint}`;
  console.log(`🔗 ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }
    
    console.log(`✅ Success:`, data);
    return data;
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    throw error;
  }
}

// Test functions
async function testGetRoads() {
  console.log('\\n📋 Testing GET /api/roads...');
  const roads = await apiCall('/roads');
  
  if (!roads || roads.length === 0) {
    throw new Error('No roads found. Please ensure roads table has data.');
  }
  
  console.log(`Found ${roads.length} roads`);
  return roads;
}

async function testGetSubRoads() {
  console.log('\\n📋 Testing GET /api/sub-roads...');
  const subRoads = await apiCall('/sub-roads');
  console.log(`Found ${subRoads.length} sub roads`);
  return subRoads;
}

async function testGetRoadDevelopments() {
  console.log('\\n📋 Testing GET /api/road-development...');
  const developments = await apiCall('/road-development');
  console.log(`Found ${developments.length} road developments`);
  return developments;
}

async function testGetRoadDevelopmentStats() {
  console.log('\\n📊 Testing GET /api/road-development?stats=true...');
  const stats = await apiCall('/road-development?stats=true');
  console.log('Statistics:', stats);
  return stats;
}

async function testCreateRoadDevelopment(roads, subRoads) {
  console.log('\\n➕ Testing POST /api/road-development...');
  
  // Use first available road
  testRoadDevelopment.road_id = roads[0].id;
  
  // Use first sub road if available
  if (subRoads.length > 0) {
    testRoadDevelopment.parent_sub_road_id = subRoads[0].id;
  }
  
  const newDevelopment = await apiCall('/road-development', {
    method: 'POST',
    body: JSON.stringify(testRoadDevelopment)
  });
  
  console.log('Created development:', newDevelopment);
  return newDevelopment;
}

async function testUpdateRoadDevelopment(developmentId) {
  console.log('\\n✏️ Testing PUT /api/road-development...');
  
  const updateData = {
    id: developmentId,
    width: 35,
    height: 20,
    cost_per_sq_ft: 500,
    development_status: 'in_progress'
  };
  
  const updatedDevelopment = await apiCall('/road-development', {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
  
  console.log('Updated development:', updatedDevelopment);
  return updatedDevelopment;
}

async function testDeleteRoadDevelopment(developmentId) {
  console.log('\\n🗑️ Testing DELETE /api/road-development...');
  
  const result = await apiCall('/road-development', {
    method: 'DELETE',
    body: JSON.stringify({ id: developmentId })
  });
  
  console.log('Deleted development:', result);
  return result;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Road Development API Tests\\n');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Get roads (prerequisite)
    const roads = await testGetRoads();
    
    // Test 2: Get sub roads
    const subRoads = await testGetSubRoads();
    
    // Test 3: Get existing developments
    const initialDevelopments = await testGetRoadDevelopments();
    
    // Test 4: Get statistics
    await testGetRoadDevelopmentStats();
    
    // Test 5: Create new development
    const newDevelopment = await testCreateRoadDevelopment(roads, subRoads);
    
    // Test 6: Verify creation by getting all developments
    console.log('\\n🔍 Verifying creation...');
    const afterCreate = await testGetRoadDevelopments();
    const expectedCount = initialDevelopments.length + 1;
    
    if (afterCreate.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} developments, but got ${afterCreate.length}`);
    }
    console.log('✅ Creation verified');
    
    // Test 7: Update the development
    await testUpdateRoadDevelopment(newDevelopment.id);
    
    // Test 8: Delete the development
    await testDeleteRoadDevelopment(newDevelopment.id);
    
    // Test 9: Verify deletion
    console.log('\\n🔍 Verifying deletion...');
    const afterDelete = await testGetRoadDevelopments();
    
    if (afterDelete.length !== initialDevelopments.length) {
      throw new Error(`Expected ${initialDevelopments.length} developments after deletion, but got ${afterDelete.length}`);
    }
    console.log('✅ Deletion verified');
    
    // Test 10: Final statistics check
    console.log('\\n📊 Final statistics check...');
    await testGetRoadDevelopmentStats();
    
    console.log('\\n' + '='.repeat(50));
    console.log('🎉 All tests passed successfully!');
    console.log('✅ Road Development API is working correctly');
    
  } catch (error) {
    console.log('\\n' + '='.repeat(50));
    console.error('💥 Test failed:', error.message);
    console.log('❌ Please check the API and database setup');
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  console.log('🔍 Checking if development server is running...');
  try {
    const response = await fetch(`${testConfig.baseUrl}/roads`);
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    }
  } catch (error) {
    console.error('❌ Server is not running. Please start with: npm run dev');
    console.log('⚠️  Make sure the development server is running on http://localhost:3000');
    return false;
  }
}

// Run the tests
async function main() {
  const isServerRunning = await checkServer();
  if (!isServerRunning) {
    process.exit(1);
  }
  
  await runTests();
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runTests,
  checkServer,
  apiCall
};