// Run this script to fix hourlyRate and workersRequired stored as strings
// Usage: node fix-job-numbers.js

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/traids-db';

async function fixJobNumbers() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const jobsCollection = db.collection('jobs');
    
    // Find all jobs where hourlyRate is a string
    const jobs = await jobsCollection.find({}).toArray();
    
    let fixedCount = 0;
    
    for (const job of jobs) {
      const updates = {};
      
      // Fix hourlyRate if it's a string
      if (typeof job.hourlyRate === 'string') {
        updates.hourlyRate = Number(job.hourlyRate);
      }
      
      // Fix workersRequired if it's a string
      if (typeof job.workersRequired === 'string') {
        updates.workersRequired = Number(job.workersRequired);
      }
      
      // Update if there are any fixes needed
      if (Object.keys(updates).length > 0) {
        await jobsCollection.updateOne(
          { _id: job._id },
          { $set: updates }
        );
        fixedCount++;
        console.log(`✅ Fixed job ${job._id}: ${JSON.stringify(updates)}`);
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} jobs`);
    console.log(`Total jobs checked: ${jobs.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

fixJobNumbers();
