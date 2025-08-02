import { sequelize } from "../models";
import { handleDatabaseError } from "../utils/errorHandler";
import { CreateContactRequest } from "../interfaces/contact.interface";

export class ContactRepository {

    public static async create(contactData: CreateContactRequest) {
        try {
            const contact = await sequelize.models.Contact.create({
                first_name: contactData.firstName,
                last_name: contactData.lastName,
                email: contactData.email,
                subject: contactData.subject,
                message: contactData.message,
            });
            return contact;
        } catch (error) {
            handleDatabaseError(error);
        }
    }

    public static async findByEmail(email: string) {
        try {
            const contact = await sequelize.models.Contact.findOne({
                where: { email },
            });
            return contact;
        } catch (error) {
            handleDatabaseError(error);
        }
    }
}