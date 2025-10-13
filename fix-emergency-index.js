/**
 * Fix Emergency Model Index Issue
 * Drops the problematic emergencyId index
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixEmergencyIndex() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/looplane');
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('emergencies');

        // Get existing indexes
        const indexes = await collection.indexes();
        console.log('\n📋 Current indexes:');
        indexes.forEach(index => {
            console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });

        // Check if emergencyId_1 index exists
        const emergencyIdIndex = indexes.find(idx => idx.name === 'emergencyId_1');
        
        if (emergencyIdIndex) {
            console.log('\n🔧 Dropping emergencyId_1 index...');
            await collection.dropIndex('emergencyId_1');
            console.log('✅ Successfully dropped emergencyId_1 index');
        } else {
            console.log('\n✅ No emergencyId_1 index found (already cleaned up)');
        }

        // Show updated indexes
        const updatedIndexes = await collection.indexes();
        console.log('\n📋 Updated indexes:');
        updatedIndexes.forEach(index => {
            console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });

        console.log('\n✅ Fix completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error fixing index:', error);
        process.exit(1);
    }
}

fixEmergencyIndex();
