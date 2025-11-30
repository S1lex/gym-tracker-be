/**
 * Script to delete all existing pro programs
 * 
 * Usage:
 * 1. Set your API_BASE_URL and AUTH_TOKEN environment variables
 * 2. Run: node scripts/delete-all-pro-programs.js
 * 
 * WARNING: This will delete ALL pro programs!
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''; // You need to get an admin token

async function deleteAllProPrograms() {
  try {
    console.log('Fetching all pro programs...');
    
    // First, get all pro programs
    const listResponse = await fetch(`${API_BASE_URL}/pro-programs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    });

    const listResult = await listResponse.json();

    if (!listResult.success || !listResult.data || listResult.data.length === 0) {
      console.log('✅ No pro programs found to delete.');
      return;
    }

    console.log(`Found ${listResult.data.length} pro program(s) to delete:`);
    listResult.data.forEach((program, index) => {
      console.log(`  ${index + 1}. ${program.title} (ID: ${program.id})`);
    });

    // Delete each program
    console.log('\nDeleting pro programs...');
    for (const program of listResult.data) {
      try {
        const deleteResponse = await fetch(`${API_BASE_URL}/pro-programs/${program.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
          },
        });

        const deleteResult = await deleteResponse.json();

        if (deleteResult.success) {
          console.log(`✅ Deleted: ${program.title}`);
        } else {
          console.error(`❌ Failed to delete ${program.title}:`, deleteResult.error);
        }
      } catch (error) {
        console.error(`❌ Error deleting ${program.title}:`, error.message);
      }
    }

    console.log('\n✅ Deletion process completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
deleteAllProPrograms();

