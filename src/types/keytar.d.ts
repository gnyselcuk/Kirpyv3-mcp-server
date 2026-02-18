/**
 * Type declarations for keytar (optional dependency)
 * Keytar provides native OS keychain/credential storage
 */

declare module 'keytar' {
    /**
     * Get a password from the keychain
     * @param service The service name
     * @param account The account name
     * @returns The password or null if not found
     */
    export function getPassword(service: string, account: string): Promise<string | null>;

    /**
     * Set a password in the keychain
     * @param service The service name
     * @param account The account name
     * @param password The password to store
     */
    export function setPassword(service: string, account: string, password: string): Promise<void>;

    /**
     * Delete a password from the keychain
     * @param service The service name
     * @param account The account name
     * @returns True if the password was deleted, false otherwise
     */
    export function deletePassword(service: string, account: string): Promise<boolean>;

    /**
     * Find a password in the keychain
     * @param service The service name
     * @returns The password or null if not found
     */
    export function findPassword(service: string): Promise<string | null>;

    /**
     * Find credentials in the keychain
     * @param service The service name
     * @returns Array of credentials
     */
    export function findCredentials(service: string): Promise<Array<{ account: string; password: string }>>;
}
