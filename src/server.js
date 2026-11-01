require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');

const port = Number(process.env.PORT) || 5000;
let server;

const startServer = async () => {
  await connectDB();

  server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  return server;
};

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully.`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  await mongoose.connection.close();
  process.exit(0);
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`Unable to start server: ${error.message}`);
    process.exit(1);
  });

  process.once('SIGINT', () => {
    shutdown('SIGINT').catch((error) => {
      console.error(`Shutdown failed: ${error.message}`);
      process.exit(1);
    });
  });

  process.once('SIGTERM', () => {
    shutdown('SIGTERM').catch((error) => {
      console.error(`Shutdown failed: ${error.message}`);
      process.exit(1);
    });
  });
}

module.exports = {
  startServer,
  shutdown
};
