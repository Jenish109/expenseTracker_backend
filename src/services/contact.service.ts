import { EmailService } from "../services/email.service";
import { handleServiceError } from "../utils/errorHandler";
import { ContactRepository } from "../repositories/contact.repository";
import { CreateContactRequest, CreateContactResponse } from "../interfaces/contact.interface";
import { generateContactUsEmail } from "../utils/email";

export class ContactService {
    public static async createContact(params: CreateContactRequest): Promise<CreateContactResponse> {
        try {
            const { firstName, lastName, email, subject, message } = params;

            const existingContact = await ContactRepository.findByEmail(email);
            if (existingContact) {
                return {
                    id: (existingContact as any).id,
                    firstName: (existingContact as any).first_name,
                    lastName: (existingContact as any).last_name,
                    email: (existingContact as any).email,
                    subject: (existingContact as any).subject,
                    message: (existingContact as any).message
                };
            }

            const contactEntry = await ContactRepository.create({
                firstName,
                lastName,
                email,
                subject,
                message
            });

            const { subject: emailSubject, html } = generateContactUsEmail({
                firstName,
                lastName,
                email,
                subject,
                message,
            });

            await EmailService.sendMail({
                to: process.env.ADMIN_CONTACT_EMAIL as string,
                subject: emailSubject,
                html,
            });

            return {
                id: (contactEntry as any).id,
                firstName: (contactEntry as any).first_name,
                lastName: (contactEntry as any).last_name,
                email: (contactEntry as any).email,
                subject: (contactEntry as any).subject,
                message: (contactEntry as any).message
            };
        } catch (error) {
            handleServiceError(error);
        }
    }
}
