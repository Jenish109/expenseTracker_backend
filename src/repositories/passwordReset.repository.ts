import crypto from 'crypto';
import { handleDatabaseError } from '../utils/errorHandler';
import PasswordResetCode from '../models/passwordResetCode.model';
import { Op } from 'sequelize';

export class PasswordResetRepository {
    public static async createResetToken(userId: number): Promise<{ token: string }> {
        try {
            const resetToken = crypto.randomBytes(32).toString("hex");
            const hashedToken = crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

            await PasswordResetCode.create({
                user_id: userId,
                code: hashedToken,
                expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
            });

            return { token: resetToken };
        } catch (error) {
            handleDatabaseError(error);
        }
    }

    public static async findValidToken(hashedToken: string): Promise<PasswordResetCode | null> {
        try {
            const verificationCode = await PasswordResetCode.findOne({
                where: {
                    code: hashedToken,
                    used: 0,
                    expires_at: {
                        [Op.gt]: new Date(),
                    },
                },
            }); 
            return verificationCode;
        } catch (error) {
            handleDatabaseError(error);
        }
    }

    public static async markTokenAsUsed(id: number) {
        try {
            const updatedToken = await PasswordResetCode.update({ used: true }, { where: { id } });
            return updatedToken;
        } catch (error) {
            handleDatabaseError(error);
        }
    }
} 