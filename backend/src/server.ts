import app from './app';
import dotenv from 'dotenv';
import { startScheduler } from './services/schedulerService';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`BloodSync Backend API running on port ${PORT}`);
  // Start background maintenance scheduler (runs every 10 minutes)
  startScheduler(10);
});
