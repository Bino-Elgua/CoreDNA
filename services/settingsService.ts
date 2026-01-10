import { supabase } from './supabaseClient';
import { GlobalSettings } from '../types';

const SETTINGS_TABLE = 'user_settings';
const DEFAULT_USER_ID = 'anonymous_user'; // For unauthenticated users

/**
 * Migrate legacy apiKeys to new llms structure (one-time)
 */
function migrateSettingsFormat(settings: any): GlobalSettings {
    // If already in new format, return as-is
    if (settings?.llms && typeof settings.llms === 'object') {
        console.log('[SettingsService] Settings already in new format');
        return settings;
    }

    // Legacy format detected - migrate
    console.log('[SettingsService] ⚠️ Migrating legacy apiKeys to new llms format');
    
    const migrated: GlobalSettings = {
        llms: {},
        image: {},
        voice: {},
        workflows: {},
        ...settings, // Keep other fields
    };

    // Migrate old flat apiKeys to new nested structure
    if (settings?.apiKeys && typeof settings.apiKeys === 'object') {
        for (const [provider, key] of Object.entries(settings.apiKeys)) {
            if (typeof key === 'string' && key.trim()) {
                migrated.llms[provider as string] = {
                    apiKey: key.trim(),
                    enabled: true,
                    defaultModel: '', // Will use provider default
                };
                console.log(`[SettingsService] Migrated ${provider} API key`);
            }
        }
        // Remove old field
        delete migrated.apiKeys;
    }

    return migrated;
}

/**
 * Get settings from Supabase or localStorage fallback
 * Auto-migrates legacy format on first load
 */
export async function getSettings(): Promise<GlobalSettings | null> {
    try {
        // Try to get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || DEFAULT_USER_ID;

        const { data, error } = await supabase
            .from(SETTINGS_TABLE)
            .select('settings')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Table doesn't exist yet or no record found - fall back to localStorage
                console.log('[SettingsService] Settings table not initialized, checking localStorage');
                const stored = localStorage.getItem('core_dna_settings');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        const migrated = migrateSettingsFormat(parsed);
                        // Save migrated version back
                        localStorage.setItem('core_dna_settings', JSON.stringify(migrated));
                        return migrated;
                    } catch {
                        return null;
                    }
                }
                return null;
            }
            console.warn('[SettingsService] Error fetching from Supabase:', error);
            return null;
        }

        // Migrate if needed
        const settings = data?.settings || null;
        if (settings) {
            const migrated = migrateSettingsFormat(settings);
            return migrated;
        }
        return null;
    } catch (error) {
        console.error('[SettingsService] Failed to get settings from Supabase:', error);
        // Fall back to localStorage
        try {
            const stored = localStorage.getItem('core_dna_settings');
            if (stored) {
                const parsed = JSON.parse(stored);
                return migrateSettingsFormat(parsed);
            }
            return null;
        } catch {
            return null;
        }
    }
}

/**
 * Save settings to Supabase
 * Ensures new format and migrates if needed
 */
export async function saveSettings(settings: GlobalSettings): Promise<boolean> {
    try {
        // Ensure new format
        let toSave = migrateSettingsFormat(settings);
        
        // Sanitize settings to avoid serialization issues
        const sanitized = JSON.parse(JSON.stringify(toSave));

        // ALWAYS save to localStorage first for immediate availability
        localStorage.setItem('core_dna_settings', JSON.stringify(sanitized));
        console.log('[SettingsService] Settings saved to localStorage (using new format)');

        // Then try to save to Supabase
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || DEFAULT_USER_ID;

            // Try upsert first (insert or update)
            const { error } = await supabase
                .from(SETTINGS_TABLE)
                .upsert(
                    {
                        user_id: userId,
                        settings: sanitized,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' }
                );

            if (error) {
                // If table doesn't exist, try to create record anyway
                if (error.code === 'PGRST116') {
                    console.warn('Settings table not initialized. Trying insert...');
                    const { error: insertError } = await supabase
                        .from(SETTINGS_TABLE)
                        .insert({
                            user_id: userId,
                            settings: sanitized,
                            updated_at: new Date().toISOString(),
                        });
                    
                    if (insertError) {
                        console.warn('Supabase unavailable, but settings saved to localStorage');
                        return true;
                    }
                    return true;
                }
                console.warn('Supabase save failed, but settings saved to localStorage');
                return true;
            }

            console.log('Settings saved to Supabase');
            return true;
        } catch (supabaseError: any) {
            console.warn('Supabase unavailable, but settings saved to localStorage:', supabaseError);
            return true; // Settings are in localStorage, that's good enough
        }
    } catch (error: any) {
        console.error('Failed to save settings:', error);
        throw new Error(`Failed to save settings: ${error?.message || 'Unknown error'}`);
    }
}

/**
 * Delete settings from Supabase
 */
export async function deleteSettings(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || DEFAULT_USER_ID;

        const { error } = await supabase
            .from(SETTINGS_TABLE)
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.warn('Error deleting settings:', error);
        }

        localStorage.removeItem('core_dna_settings');
        return true;
    } catch (error) {
        console.error('Failed to delete settings:', error);
        return false;
    }
}
