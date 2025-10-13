/**
 * Clear All Active Emergencies
 * Useful for testing - sets all active emergencies to RESOLVED
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function clearActiveEmergencies() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/looplane');
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('emergencies');

        // Find all active emergencies
        const activeEmergencies = await collection.find({
            status: { $in: ['ACTIVE', 'IN_PROGRESS'] }
        }).toArray();

        console.log(`\n📋 Found ${activeEmergencies.length} active emergencies`);

        if (activeEmergencies.length > 0) {
            activeEmergencies.forEach(emergency => {
                console.log(`  - ${emergency._id} (${emergency.status}) - User: ${emergency.user}`);
            });

            console.log('\n🧹 Marking all as RESOLVED...');
            const result = await collection.updateMany(
                { status: { $in: ['ACTIVE', 'IN_PROGRESS'] } },
                { 
                    $set: { 
                        status: 'RESOLVED',
                        resolvedAt: new Date()
                    } 
                }
            );
            console.log(`✅ Updated ${result.modifiedCount} emergencies to RESOLVED`);
        } else {
            console.log('✅ No active emergencies found');
        }

        // Show current status
        const statusCounts = await collection.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        console.log('\n📊 Emergency Status Summary:');
        statusCounts.forEach(stat => {
            console.log(`  - ${stat._id}: ${stat.count}`);
        });

        console.log('\n✅ Cleanup completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error clearing emergencies:', error);
        process.exit(1);
    }
}

clearActiveEmergencies();
