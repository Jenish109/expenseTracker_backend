const nodemailer = require('nodemailer');
import { ERROR_CODES } from "../utils/errorCodes";
import { CustomError } from "../utils/customError";
import { SendMailOptions } from "../interfaces/MailOptions.interface";

export class EmailService {
    private static transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_PORT === '465', // true for port 465, false for 587
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    public static async sendMail({ to, subject, html }: SendMailOptions) {
        try {
            const info = await this.transporter.sendMail({
                from: `"Expense Tracker" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html,
            });

            console.log("Email sent:", info.messageId);
            return info;
        } catch (error) {
            console.log(error, 'error')
            throw new CustomError(ERROR_CODES.GENERAL.EMAIL_SEND_FAILED, ["Failed to send email"]);
        }
    }
}