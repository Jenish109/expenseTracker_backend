export interface CreateContactRequest {
    firstName: string;
    lastName: string;
    email: string;
    subject?: string;
    message?: string;
}

export interface CreateContactResponse {
    id: number;
    firstName: string;  
    lastName: string;
    email: string;
    subject?: string;
    message?: string;
}