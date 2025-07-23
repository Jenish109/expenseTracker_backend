import { CronJob } from 'cron';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';

const userService = new UserService();
const userRepository = new UserRepository();

// Runs at 00:05 on the 1st of every month (UTC)
const monthlyFinanceJob = new CronJob(
  '0 5 0 1 * *', // At 00:05 AM on the 1st day of every month
  async function () {
    console.log('Running monthly finance auto-carry job...');
    try {
      const users = await userRepository.findAll();
      for (const user of users) {
        await userService.ensureCurrentMonthFinance(user.user_id);
      }
      console.log('Monthly finance auto-carry job completed.');
    } catch (err) {
      console.error('Error in monthly finance auto-carry job:', err);
    }
  },
  null,
  true, // Start the job right away
  'UTC' // Use UTC time
);

export default monthlyFinanceJob; 