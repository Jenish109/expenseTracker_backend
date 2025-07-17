
import crypto from 'crypto';
import EmailVerificationCode from '../models/emailVerificationCode.model';
import { handleDatabaseError } from '../utils/errorHandler';
import { Op } from 'sequelize';

export default class EmailVerificationCodeRepository {
    public static async createVerificationToken(userId: number): Promise<{ token: string; hashedToken: string }> {
        try {
            const token = crypto.randomBytes(32).toString("hex");
            const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

            await EmailVerificationCode.create({
                user_id: userId,
                code: hashedToken,
                expires_at: expiresAt,
                used: false,
            });

            return { token, hashedToken };
        } catch (error) {
            handleDatabaseError(error);
            throw error;
        }
    }

    public static async markTokenAsUsed(id: number): Promise<number> {
        try {
            const [affectedCount] = await EmailVerificationCode.update(
                { used: 1 },
                { where: { id } }
            );
            return affectedCount;
        } catch (error) {
            handleDatabaseError(error);
        }
    }


    public static async findValidToken(hashedToken: string): Promise<any | null> {
        try {
            const verificationCode = await EmailVerificationCode.findOne({
                where: {
                    code: hashedToken,
                    used: 0,
                    expires_at: {
                        [Op.gt]: new Date(),
                    },
                },
            });
            return verificationCode ? verificationCode.dataValues : null;
        } catch (error) {
            handleDatabaseError(error);
        }
    }
}
