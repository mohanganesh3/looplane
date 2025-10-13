/**
 * Force Drop ALL Emergency Indexes and Recreate Them
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function resetIndexes() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/looplane');
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('emergencies');

        console.log('\n📋 Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach(index => {
            console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });

        // Drop ALL indexes except _id (can't drop _id)
        console.log('\n🗑️  Dropping all indexes (except _id)...');
        for (const index of indexes) {
            if (index.name !== '_id_') {
                try {
                    await collection.dropIndex(index.name);
                    console.log(`  ✅ Dropped: ${index.name}`);
                } catch (error) {
                    console.log(`  ❌ Could not drop ${index.name}: ${error.message}`);
                }
            }
        }

        // Now recreate the necessary indexes based on the model
        console.log('\n🔧 Recreating indexes from model...');
        
        // Geospatial index
        await collection.createIndex({ 'location.coordinates': '2dsphere' });
        console.log('  ✅ Created: location.coordinates_2dsphere');
        
        // Status and time indexes
        await collection.createIndex({ status: 1, triggeredAt: -1 });
        console.log('  ✅ Created: status_1_triggeredAt_-1');
        
        // User and status
        await collection.createIndex({ user: 1, status: 1 });
        console.log('  ✅ Created: user_1_status_1');
        
        // Priority and status
        await collection.createIndex({ priority: 1, status: 1 });
        console.log('  ✅ Created: priority_1_status_1');

        console.log('\n📋 Final indexes:');
        const finalIndexes = await collection.indexes();
        finalIndexes.forEach(index => {
            console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });

        console.log('\n✅ Index reset completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error resetting indexes:', error);
        process.exit(1);
    }
}

resetIndexes();
