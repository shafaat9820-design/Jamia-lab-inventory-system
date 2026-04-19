import cron from 'node-cron';
import { db } from './db';
import { deadInventory } from '@shared/schema';
import { lt } from 'drizzle-orm';

export function setupCronJobs() {
  console.log('Setting up cron jobs...');
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running daily dead inventory cleanup...');
      // delete where expiry_date < today
      const today = new Date().toISOString().split('T')[0];
      const result = await db.delete(deadInventory).where(lt(deadInventory.expiryDate, today));
      console.log(`Dead inventory cleanup complete.`);
    } catch (e) {
      console.error('Error during dead inventory cleanup cron job', e);
    }
  });
}
