/**
 * A Solid Profile Card object
 * @see FOAF
 * @see VCARD
 */
import { SolidProfileInterface } from '../interfaces/solid-profile.interface';

export class SolidProfile implements SolidProfileInterface {
    address: {
        street?: string;
        // TODO: Add the missing address fields
    };
    company: string;
    email: string;
    fn: string;
    picture: string;
    phone: string;
    role: string;
    organization?: string;
    friends: any[];
}

