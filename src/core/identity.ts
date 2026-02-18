// Identity management for agent authentication with secure storage

import * as fs from 'fs';
import * as path from 'path';
import { AgentIdentity } from '../types/index.js';
import { config } from './config.js';

const IDENTITY_FILE = path.join(process.cwd(), config.IDENTITY_FILE);

// Keytar types (optional dependency)
interface KeytarModule {
    getPassword(service: string, account: string): Promise<string | null>;
    setPassword(service: string, account: string, password: string): Promise<void>;
    deletePassword(service: string, account: string): Promise<boolean>;
}

// Keytar import (optional - fallback to file-based if not available)
let keytar: KeytarModule | null = null;
let keytarAvailable: boolean | null = null; // null = not checked, true = available, false = unavailable

// Async initialization for keytar
async function initKeytar() {
    if (keytarAvailable === null) {
        try {
            keytar = await import('keytar') as KeytarModule;
            keytarAvailable = true;
        } catch (error) {
            console.warn('⚠️ Keytar not available, using file-based storage with restricted permissions');
            keytarAvailable = false;
        }
    }
}

const KEYCHAIN_SERVICE = 'kirpyv3-mcp';

/**
 * Load identity from secure storage
 * - Tries keychain first (macOS/Linux/Windows)
 * - Falls back to file with restricted permissions
 */
export async function loadIdentity(): Promise<AgentIdentity | null> {
    try {
        await initKeytar();
        
        if (!fs.existsSync(IDENTITY_FILE)) {
            return null;
        }

        const data = fs.readFileSync(IDENTITY_FILE, 'utf-8');
        const metadata = JSON.parse(data);

        // Try to get API key from keychain
        if (keytarAvailable && keytar && metadata.user_id) {
            try {
                const api_key = await keytar.getPassword(KEYCHAIN_SERVICE, metadata.user_id);
                if (api_key) {
                    return { ...metadata, api_key };
                }
            } catch (error) {
                console.warn('⚠️ Failed to read from keychain, falling back to file');
            }
        }

        // Fallback: API key in file (legacy support)
        if (metadata.api_key) {
            return metadata;
        }

        console.error('❌ API key not found in keychain or file');
        return null;
    } catch (error) {
        console.error("Failed to load identity", error);
        return null;
    }
}

/**
 * Save identity to secure storage
 * - Saves API key to keychain if available
 * - Saves metadata to file with restricted permissions (0600)
 * - Falls back to file-based storage if keychain unavailable
 */
export async function saveIdentity(identity: AgentIdentity): Promise<void> {
    try {
        await initKeytar();
        
        let savedToKeychain = false;

        // Try to save API key to keychain
        if (keytarAvailable && keytar && identity.user_id && identity.api_key) {
            try {
                await keytar.setPassword(KEYCHAIN_SERVICE, identity.user_id, identity.api_key);
                savedToKeychain = true;
                console.log('✅ API key saved to system keychain');
            } catch (error) {
                console.warn('⚠️ Failed to save to keychain, falling back to file');
            }
        }

        // Prepare data to save to file
        const fileData = savedToKeychain
            ? {
                  username: identity.username,
                  user_id: identity.user_id,
                  registered_at: identity.registered_at
              }
            : identity; // Include API key if keychain failed

        // Save to file with restricted permissions
        fs.writeFileSync(IDENTITY_FILE, JSON.stringify(fileData, null, 2), {
            mode: 0o600 // -rw------- (only owner can read/write)
        });

        if (!savedToKeychain) {
            console.warn('⚠️ API key stored in file. Consider using keychain for better security.');
            console.warn(`⚠️ File permissions set to 0600 (owner only): ${IDENTITY_FILE}`);
        }
    } catch (error) {
        console.error("Failed to save identity", error);
        throw error;
    }
}

/**
 * Clear identity from all storage locations
 */
export async function clearIdentity(): Promise<void> {
    try {
        await initKeytar();
        
        // Remove from keychain
        if (keytarAvailable && keytar) {
            try {
                const identity = await loadIdentity();
                if (identity?.user_id) {
                    await keytar.deletePassword(KEYCHAIN_SERVICE, identity.user_id);
                    console.log('✅ API key removed from keychain');
                }
            } catch (error) {
                console.warn('⚠️ Failed to remove from keychain');
            }
        }

        // Remove file
        if (fs.existsSync(IDENTITY_FILE)) {
            fs.unlinkSync(IDENTITY_FILE);
            console.log('✅ Identity file removed');
        }
    } catch (error) {
        console.error("Failed to clear identity", error);
    }
}
