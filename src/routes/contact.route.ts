import express from "express";
import { validatePayload } from "../middlewares/validation.middleware";
import { contactSchema } from "../validations/contactSchema";
import { ContactController } from "../controllers/contact.controller";

const router = express.Router();

router.post("/create", validatePayload(contactSchema), ContactController.createContact);

export default router;
