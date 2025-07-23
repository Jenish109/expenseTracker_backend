import { Op } from 'sequelize';
import UserMonthlyFinance from '../models/userMonthlyFinance.model';
import { BaseRepository } from './base.repository';

export class UserMonthlyFinanceRepository extends BaseRepository<UserMonthlyFinance> {
  constructor() {
    super(UserMonthlyFinance);
  }

  async createOrUpdateByUserAndPeriod(userId: number, period: Date, data: Partial<UserMonthlyFinance>) {
    const [record, created] = await UserMonthlyFinance.findOrCreate({
      where: { userId, period },
      defaults: { ...data, userId, period },
    });
    if (!created) {
      await record.update(data);
    }
    return record;
  }

  async findByUserAndPeriod(userId: number, period: Date) {
    return UserMonthlyFinance.findOne({ where: { userId, period } });
  }

  async findAllByUser(userId: number) {
    return UserMonthlyFinance.findAll({
      where: { userId },
      order: [['period', 'DESC']],
    });
  }

  async findMostRecentBeforePeriod(userId: number, period: Date) {
    return UserMonthlyFinance.findOne({
      where: {
        userId,
        period: { [Op.lt]: period },
      },
      order: [['period', 'DESC']],
    });
  }
} 