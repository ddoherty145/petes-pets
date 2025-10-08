const mongoose = require('mongoose');
const Pet = require('./models/pet');
const pets = require('./seeds/pets');
require('dotenv').config();

console.log('🌱 Starting Pet Store Seed Process...\n');

// Connect to MongoDB
mongoose.connect('mongodb://localhost/local', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    // Clear existing pets
    console.log('🧹 Clearing existing pets...');
    await Pet.deleteMany({});
    console.log('✅ Existing pets cleared');
    
    // Add new pets
    console.log('📝 Adding new pets...');
    for (let petData of pets) {
      const pet = new Pet(petData);
      await pet.save();
      console.log(`✅ Added ${pet.name} - $${pet.price}`);
    }
    
    console.log(`\n🎉 Successfully seeded ${pets.length} pets!`);
    console.log('\n📊 Pet Summary:');
    pets.forEach(pet => {
      console.log(`   ${pet.name} (${pet.species}) - $${pet.price}`);
    });
    
    console.log('\n💳 Ready for Stripe checkout integration!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Disconnected from MongoDB');
});