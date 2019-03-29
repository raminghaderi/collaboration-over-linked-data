/**
 * A Solid Profile Card object
 * @see FOAF
 * @see VCARD
 */
export interface SolidProfileInterface {
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
