import mongoose from 'mongoose';
import User from '../models/User';
import Category from '../models/Category';
import { DEFAULT_CATEGORIES } from '../lib/constants';

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@harikrishnarefrigeration.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';

  const existing = await User.findOne({ email });
  if (!existing) {
    await User.create({
      name: 'Admin',
      email,
      password,
      role: 'admin',
      isActive: true,
    });
    console.log(`Created admin user: ${email}`);
  } else {
    console.log(`Admin user already exists: ${email}`);
  }

  for (const cat of DEFAULT_CATEGORIES) {
    await Category.findOneAndUpdate(
      { name: cat.name },
      { $setOnInsert: cat },
      { upsert: true, new: true }
    );
  }
  console.log('Default categories ensured');

  await mongoose.disconnect();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
