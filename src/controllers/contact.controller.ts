import { Request, Response } from "express";
import { handleControllerError } from "../utils/errorHandler";
import { SUCCESS_CODES } from "../constants/successCodes";
import { ContactService } from "../services/contact.service";
import { successResponse } from "../utils/response.helper";

export class ContactController {
    public static async createContact(req: Request, res: Response): Promise<void> {
        try {
            const { firstName, lastName, email, subject, message } = req.body;

            const result = await ContactService.createContact({
                firstName,
                lastName,
                email,
                subject,
                message
            });

            successResponse(res, result, SUCCESS_CODES.CONTACT.CONTACT_CREATED.message, SUCCESS_CODES.CONTACT.CONTACT_CREATED.status_code);
        } catch (error) {
            handleControllerError(res, error);
        }
    }
}
