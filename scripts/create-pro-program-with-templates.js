/**
 * Script to create a new pro program with 2 days referencing templates
 * 
 * Usage:
 * 1. Set your API_BASE_URL and AUTH_TOKEN environment variables
 * 2. Run: node scripts/create-pro-program-with-templates.js
 * 
 * Or modify the values below and run directly
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''; // You need to get an admin token

// Template IDs
const TEMPLATE_IDS = {
  day1: '056f0095-7f14-422c-800d-7777e747167e',
  day2: 'ee758070-ed39-4268-bacc-2eec84eebe06',
};

// Pro Program Data
const proProgramData = {
  title: 'Powerbuilding Program',
  description: 'A comprehensive powerbuilding program combining strength and hypertrophy training',
  level: 'Intermediate', // Must be: Beginner, Intermediate, or Advanced
  days_per_week: 2,
  images: [], // Add image URLs if you have them
  days: [
    {
      day_number: 1,
      name: 'Day 1 - Upper Body',
      template_id: TEMPLATE_IDS.day1,
    },
    {
      day_number: 2,
      name: 'Day 2 - Lower Body',
      template_id: TEMPLATE_IDS.day2,
    },
  ],
};

async function createProProgram() {
  try {
    console.log('Creating pro program...');
    console.log('Data:', JSON.stringify(proProgramData, null, 2));

    const response = await fetch(`${API_BASE_URL}/pro-programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(proProgramData),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Pro program created successfully!');
      console.log('Program ID:', result.data.id);
      console.log('Program Title:', result.data.title);
      console.log('Days:', result.data.days?.length || 0);
      console.log('\nFull response:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Failed to create pro program:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error creating pro program:', error.message);
    process.exit(1);
  }
}

// Run the script
createProProgram();

