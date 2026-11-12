import app from './app';
import dotenv from 'dotenv';
import path from 'path';
import { startScheduler } from './services/schedulerService';

// Support loading from backend directory or project root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`BloodSync Backend API running on port ${PORT}`);
  // Start background maintenance scheduler (runs every 10 minutes)
  startScheduler(10);
});
