import { UserDbObject } from "./user";

// Not yet integrated - will be integrated after DB is migrated successfully

export enum EmailProvider {
    Google = "Google",
    Apple = "Apple",
    Outlook = "Outlook"
}

export type EmailDbObject = {
    email: string // primary key, unique
    email_provider: EmailProvider;
    user_id: string; // foreign key
    user: UserDbObject;
}