import { supabase } from './supabaseClient';
import { hybridStorage } from './hybridStorageService';

/**
 * Authentication Service
 * Handles user auth with Supabase + anonymous fallback
 */

export interface User {
    id: string;
    email?: string;
    isAnonymous: boolean;
}

class AuthService {
    private currentUser: User | null = null;
    private authStateChangeListeners: ((user: User | null) => void)[] = [];

    constructor() {
        this.initializeAuth();
        this.setupAuthListener();
    }

    /**
     * Initialize auth state on app load
     */
    private async initializeAuth() {
        const stored = localStorage.getItem('_current_user');
        if (stored) {
            try {
                this.currentUser = JSON.parse(stored);
                hybridStorage.setUserId(this.currentUser.id);
            } catch (e) {
                // Invalid stored user, create anonymous
                this.createAnonymousUser();
            }
        } else {
            this.createAnonymousUser();
        }
    }

    /**
     * Setup Supabase auth listener
     */
    private setupAuthListener() {
        try {
            supabase.auth.onAuthStateChange((event, session) => {
                if (session?.user) {
                    this.setUser({
                        id: session.user.id,
                        email: session.user.email,
                        isAnonymous: false,
                    });
                } else if (event === 'SIGNED_OUT') {
                    this.createAnonymousUser();
                }
            });
        } catch (e) {
            console.warn('[AuthService] Auth listener setup failed:', e);
        }
    }

    /**
     * Create anonymous user
     */
    private createAnonymousUser() {
        const userId = localStorage.getItem('_anonymous_user_id');
        if (userId) {
            this.setUser({
                id: userId,
                isAnonymous: true,
            });
        } else {
            const newId = `anon_${crypto.randomUUID()}`;
            localStorage.setItem('_anonymous_user_id', newId);
            this.setUser({
                id: newId,
                isAnonymous: true,
            });
        }
    }

    /**
     * Set current user
     */
    private setUser(user: User) {
        this.currentUser = user;
        localStorage.setItem('_current_user', JSON.stringify(user));
        hybridStorage.setUserId(user.id);
        this.notifyListeners();
    }

    /**
     * Sign up with email
     */
    async signUp(email: string, password: string): Promise<{ user: User; error: string | null }> {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                return { user: null as any, error: error.message };
            }

            if (data.user) {
                this.setUser({
                    id: data.user.id,
                    email: data.user.email,
                    isAnonymous: false,
                });
                return { user: this.currentUser!, error: null };
            }

            return { user: null as any, error: 'Unknown error' };
        } catch (e) {
            return { user: null as any, error: (e as Error).message };
        }
    }

    /**
     * Sign in with email
     */
    async signIn(email: string, password: string): Promise<{ user: User; error: string | null }> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { user: null as any, error: error.message };
            }

            if (data.user) {
                this.setUser({
                    id: data.user.id,
                    email: data.user.email,
                    isAnonymous: false,
                });
                return { user: this.currentUser!, error: null };
            }

            return { user: null as any, error: 'Unknown error' };
        } catch (e) {
            return { user: null as any, error: (e as Error).message };
        }
    }

    /**
     * Sign out
     */
    async signOut(): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                return { error: error.message };
            }

            // Clear user data
            localStorage.removeItem('_current_user');
            hybridStorage.clearAll();

            // Create new anonymous user
            this.createAnonymousUser();
            return { error: null };
        } catch (e) {
            return { error: (e as Error).message };
        }
    }

    /**
     * Get current user
     */
    getCurrentUser(): User | null {
        return this.currentUser;
    }

    /**
     * Subscribe to auth changes
     */
    onAuthChange(callback: (user: User | null) => void) {
        this.authStateChangeListeners.push(callback);
        return () => {
            this.authStateChangeListeners = this.authStateChangeListeners.filter(
                cb => cb !== callback
            );
        };
    }

    private notifyListeners() {
        this.authStateChangeListeners.forEach(cb => cb(this.currentUser));
    }

    /**
     * Check if user is authenticated (not anonymous)
     */
    isAuthenticated(): boolean {
        return this.currentUser ? !this.currentUser.isAnonymous : false;
    }

    /**
     * Get user tier from settings
     */
    async getUserTier(): Promise<string> {
        try {
            if (!this.currentUser) {
                return 'free';
            }

            const { data, error } = await supabase
                .from('user_settings')
                .select('tier')
                .eq('user_id', this.currentUser.id)
                .single();

            if (error || !data) {
                return 'free';
            }

            return data.tier || 'free';
        } catch (e) {
            return 'free';
        }
    }
}

export const authService = new AuthService();
