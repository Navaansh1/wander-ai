import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wanderai';

async function viewDatabase() {
  try {
    console.log('\n========================================');
    console.log('🍃 WanderAI - MongoDB Database Inspector');
    console.log('========================================\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB: wanderai\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections found:', collections.map(c => c.name).join(', ') || 'None');

    const TripSchema = new mongoose.Schema({}, { strict: false });
    const Trip = mongoose.model('TripInspector', TripSchema, 'trips');

    const count = await Trip.countDocuments();
    console.log(`📊 Total Saved Trips: ${count}\n`);

    if (count === 0) {
      console.log('ℹ️ No trips saved yet. Go to http://localhost:5173, generate a trip, and click "Save Trip"!');
    } else {
      const trips = await Trip.find().sort({ savedAt: -1 });
      trips.forEach((t, i) => {
        console.log(`----------------------------------------`);
        console.log(`✈️ Trip #${i + 1}: ${t.tripTitle || t.destination}`);
        console.log(`   📍 Destination:     ${t.destination}`);
        console.log(`   ⏱️ Duration:        ${t.daysCount || t.days?.length} Days`);
        console.log(`   💵 Budget Tier:     ${t.budgetTier || 'Moderate'}`);
        console.log(`   💰 Estimated Cost:  ${t.estimatedDailyCost || 'N/A'}`);
        console.log(`   🤖 Engine Used:     ${t.aiEngineUsed || 'WanderAI'}`);
        console.log(`   📅 Saved On:        ${t.savedAt ? new Date(t.savedAt).toLocaleString() : 'Recently'}`);
        console.log(`   🆔 MongoDB ID:      ${t._id}`);
      });
      console.log(`----------------------------------------\n`);
    }

  } catch (err) {
    console.error('❌ MongoDB Inspection Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

viewDatabase();
