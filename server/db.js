const mongoose = require('mongoose');

let cached = global._mongooseConn;
if (!cached) cached = global._mongooseConn = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    }).catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
      if (err.message.includes('bad auth')) {
        console.error('  → Verify your MongoDB username/password in MONGODB_URI');
        console.error('  → If DB is self-hosted (e.g. Contabo VPS), check the user exists:');
        console.error('      mongo -u <username> -p <password> --authenticationDatabase admin');
        console.error('  → Reset password if needed:');
        console.error('      db.updateUser("<username>", { pwd: "<newpassword>" })');
      }
      process.exit(1);
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
