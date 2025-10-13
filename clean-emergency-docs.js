/**
 * Clean Emergency Documents with null emergencyId
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function cleanEmergencies() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/looplane');
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('emergencies');

        // Find documents with emergencyId field
        const docsWithEmergencyId = await collection.find({ emergencyId: { $exists: true } }).toArray();
        console.log(`\n📋 Found ${docsWithEmergencyId.length} documents with emergencyId field`);

        if (docsWithEmergencyId.length > 0) {
            console.log('\n🧹 Removing emergencyId field from all documents...');
            const result = await collection.updateMany(
                { emergencyId: { $exists: true } },
                { $unset: { emergencyId: "" } }
            );
            console.log(`✅ Updated ${result.modifiedCount} documents`);
        }

        // Check indexes again
        const indexes = await collection.indexes();
        console.log('\n📋 Current indexes:');
        indexes.forEach(index => {
            console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });

        // Try to drop the index if it exists
        try {
            await collection.dropIndex('emergencyId_1');
            console.log('\n✅ Dropped emergencyId_1 index');
        } catch (error) {
            if (error.codeName === 'IndexNotFound') {
                console.log('\n✅ emergencyId_1 index does not exist');
            } else {
                console.log('\n❌ Error dropping index:', error.message);
            }
        }

        console.log('\n✅ Cleanup completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error cleaning documents:', error);
        process.exit(1);
    }
}

cleanEmergencies();
