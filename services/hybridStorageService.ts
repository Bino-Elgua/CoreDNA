import { supabase } from './supabaseClient';

/**
 * Hybrid Storage Service
 * Manages data across both localStorage (offline) and Supabase (online)
 * Features:
 * - Automatic sync when connection restored
 * - Offline queue for operations while disconnected
 * - Fallback to localStorage on Supabase errors
 * - Conflict resolution (last-write-wins)
 */

export interface OfflineOperation {
    id: string;
    table: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
    timestamp: number;
    synced: boolean;
}

class HybridStorageService {
    private userId: string = '';
    private isOnline: boolean = navigator.onLine;
    private offlineQueue: OfflineOperation[] = [];
    private syncInProgress: boolean = false;

    constructor() {
        this.loadOfflineQueue();
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    /**
     * Set user ID (call after auth)
     */
    setUserId(userId: string) {
        this.userId = userId;
    }

    /**
     * Save portfolio with sync to Supabase
     */
    async savePortfolio(portfolioData: any): Promise<any> {
        const isNew = !portfolioData.id;
        const id = portfolioData.id || crypto.randomUUID();

        const payload = {
            ...portfolioData,
            id,
            user_id: this.userId,
            updated_at: new Date().toISOString(),
        };

        // Save to localStorage immediately
        const local = this.getLocalPortfolios();
        const idx = local.findIndex(p => p.id === id);
        if (idx >= 0) {
            local[idx] = payload;
        } else {
            local.push(payload);
        }
        localStorage.setItem('core_dna_portfolios', JSON.stringify(local));

        // Queue for sync
        this.queueOperation('portfolios', isNew ? 'create' : 'update', payload);

        // Attempt immediate sync if online
        if (this.isOnline) {
            await this.syncPortfolio(payload);
        }

        return payload;
    }

    /**
     * Load portfolios from Supabase or localStorage fallback
     */
    async loadPortfolios(): Promise<any[]> {
        if (!this.userId) {
            return this.getLocalPortfolios();
        }

        try {
            if (!this.isOnline) {
                return this.getLocalPortfolios();
            }

            const { data, error } = await supabase
                .from('portfolios')
                .select('*')
                .eq('user_id', this.userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('[HybridStorage] Supabase load error:', error);
                return this.getLocalPortfolios();
            }

            if (data) {
                // Merge with local (server is source of truth)
                const local = this.getLocalPortfolios();
                const merged = this.mergeData(local, data, 'id');
                localStorage.setItem('core_dna_portfolios', JSON.stringify(merged));
                return merged;
            }
        } catch (e) {
            console.error('[HybridStorage] Error loading portfolios:', e);
        }

        return this.getLocalPortfolios();
    }

    /**
     * Delete portfolio
     */
    async deletePortfolio(portfolioId: string): Promise<boolean> {
        // Remove from localStorage
        const local = this.getLocalPortfolios();
        const filtered = local.filter(p => p.id !== portfolioId);
        localStorage.setItem('core_dna_portfolios', JSON.stringify(filtered));

        // Queue deletion
        this.queueOperation('portfolios', 'delete', { id: portfolioId });

        // Attempt sync
        if (this.isOnline) {
            await this.syncDeletePortfolio(portfolioId);
        }

        return true;
    }

    /**
     * Save campaign
     */
    async saveCampaign(portfolioId: string, campaignData: any): Promise<any> {
        const isNew = !campaignData.id;
        const id = campaignData.id || crypto.randomUUID();

        const payload = {
            ...campaignData,
            id,
            portfolio_id: portfolioId,
            user_id: this.userId,
            updated_at: new Date().toISOString(),
        };

        // Save locally
        const campaigns = this.getLocalCampaigns(portfolioId);
        const idx = campaigns.findIndex(c => c.id === id);
        if (idx >= 0) {
            campaigns[idx] = payload;
        } else {
            campaigns.push(payload);
        }
        localStorage.setItem(`campaigns_${portfolioId}`, JSON.stringify(campaigns));

        // Queue for sync
        this.queueOperation('campaigns', isNew ? 'create' : 'update', payload);

        if (this.isOnline) {
            await this.syncCampaign(payload);
        }

        return payload;
    }

    /**
     * Load campaigns for portfolio
     */
    async loadCampaigns(portfolioId: string): Promise<any[]> {
        if (!this.userId || !this.isOnline) {
            return this.getLocalCampaigns(portfolioId);
        }

        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('portfolio_id', portfolioId)
                .eq('user_id', this.userId);

            if (error) {
                console.warn('[HybridStorage] Campaign load error:', error);
                return this.getLocalCampaigns(portfolioId);
            }

            if (data) {
                const local = this.getLocalCampaigns(portfolioId);
                const merged = this.mergeData(local, data, 'id');
                localStorage.setItem(`campaigns_${portfolioId}`, JSON.stringify(merged));
                return merged;
            }
        } catch (e) {
            console.error('[HybridStorage] Error loading campaigns:', e);
        }

        return this.getLocalCampaigns(portfolioId);
    }

    /**
     * Save lead
     */
    async saveLead(portfolioId: string, leadData: any): Promise<any> {
        const isNew = !leadData.id;
        const id = leadData.id || crypto.randomUUID();

        const payload = {
            ...leadData,
            id,
            portfolio_id: portfolioId,
            user_id: this.userId,
            updated_at: new Date().toISOString(),
        };

        const leads = this.getLocalLeads(portfolioId);
        const idx = leads.findIndex(l => l.id === id);
        if (idx >= 0) {
            leads[idx] = payload;
        } else {
            leads.push(payload);
        }
        localStorage.setItem(`leads_${portfolioId}`, JSON.stringify(leads));

        this.queueOperation('portfolio_leads', isNew ? 'create' : 'update', payload);

        if (this.isOnline) {
            await this.syncLead(payload);
        }

        return payload;
    }

    /**
     * Load leads
     */
    async loadLeads(portfolioId: string): Promise<any[]> {
        if (!this.userId || !this.isOnline) {
            return this.getLocalLeads(portfolioId);
        }

        try {
            const { data, error } = await supabase
                .from('portfolio_leads')
                .select('*')
                .eq('portfolio_id', portfolioId)
                .eq('user_id', this.userId);

            if (error) {
                return this.getLocalLeads(portfolioId);
            }

            if (data) {
                const local = this.getLocalLeads(portfolioId);
                const merged = this.mergeData(local, data, 'id');
                localStorage.setItem(`leads_${portfolioId}`, JSON.stringify(merged));
                return merged;
            }
        } catch (e) {
            console.error('[HybridStorage] Error loading leads:', e);
        }

        return this.getLocalLeads(portfolioId);
    }

    /**
     * Sync offline queue when back online
     */
    private async handleOnline() {
        this.isOnline = true;
        console.log('[HybridStorage] Back online, syncing...');
        await this.syncOfflineQueue();
    }

    private handleOffline() {
        this.isOnline = false;
        console.log('[HybridStorage] Gone offline, queuing operations');
    }

    /**
     * Sync all queued operations
     */
    private async syncOfflineQueue() {
        if (this.syncInProgress || this.offlineQueue.length === 0) {
            return;
        }

        this.syncInProgress = true;
        const queue = [...this.offlineQueue];

        for (const op of queue) {
            try {
                await this.syncOperation(op);
                op.synced = true;
            } catch (e) {
                console.error(`[HybridStorage] Failed to sync ${op.table}:`, e);
            }
        }

        this.offlineQueue = this.offlineQueue.filter(op => !op.synced);
        this.saveOfflineQueue();
        this.syncInProgress = false;
    }

    /**
     * Sync individual operation
     */
    private async syncOperation(op: OfflineOperation) {
        const { table, operation, data } = op;

        switch (operation) {
            case 'create':
            case 'update':
                return await supabase.from(table).upsert(data);
            case 'delete':
                return await supabase.from(table).delete().eq('id', data.id);
        }
    }

    /**
     * Direct sync methods
     */
    private async syncPortfolio(data: any) {
        try {
            const { error } = await supabase.from('portfolios').upsert(data);
            if (error) {
                console.warn('[HybridStorage] Portfolio sync error:', error);
            }
        } catch (e) {
            console.error('[HybridStorage] Portfolio sync failed:', e);
        }
    }

    private async syncDeletePortfolio(id: string) {
        try {
            const { error } = await supabase.from('portfolios').delete().eq('id', id);
            if (error) {
                console.warn('[HybridStorage] Portfolio delete sync error:', error);
            }
        } catch (e) {
            console.error('[HybridStorage] Portfolio delete sync failed:', e);
        }
    }

    private async syncCampaign(data: any) {
        try {
            const { error } = await supabase.from('campaigns').upsert(data);
            if (error) {
                console.warn('[HybridStorage] Campaign sync error:', error);
            }
        } catch (e) {
            console.error('[HybridStorage] Campaign sync failed:', e);
        }
    }

    private async syncLead(data: any) {
        try {
            const { error } = await supabase.from('portfolio_leads').upsert(data);
            if (error) {
                console.warn('[HybridStorage] Lead sync error:', error);
            }
        } catch (e) {
            console.error('[HybridStorage] Lead sync failed:', e);
        }
    }

    /**
     * Queue operation for later sync
     */
    private queueOperation(table: string, operation: 'create' | 'update' | 'delete', data: any) {
        const item: OfflineOperation = {
            id: crypto.randomUUID(),
            table,
            operation,
            data,
            timestamp: Date.now(),
            synced: false,
        };
        this.offlineQueue.push(item);
        this.saveOfflineQueue();
    }

    /**
     * Offline queue persistence
     */
    private saveOfflineQueue() {
        try {
            localStorage.setItem('_offline_queue', JSON.stringify(this.offlineQueue));
        } catch (e) {
            console.error('[HybridStorage] Failed to save offline queue:', e);
        }
    }

    private loadOfflineQueue() {
        try {
            const data = localStorage.getItem('_offline_queue');
            if (data) {
                this.offlineQueue = JSON.parse(data);
            }
        } catch (e) {
            console.error('[HybridStorage] Failed to load offline queue:', e);
        }
    }

    /**
     * Conflict resolution: merge server and local data
     * Strategy: last-write-wins based on updated_at timestamp
     */
    private mergeData(local: any[], server: any[], idField: string = 'id'): any[] {
        const merged = [...local];

        for (const serverItem of server) {
            const idx = merged.findIndex(l => l[idField] === serverItem[idField]);
            
            if (idx >= 0) {
                const localItem = merged[idx];
                const localTime = new Date(localItem.updated_at || 0).getTime();
                const serverTime = new Date(serverItem.updated_at || 0).getTime();
                
                // Keep the more recently updated version
                if (serverTime >= localTime) {
                    merged[idx] = serverItem;
                }
            } else {
                merged.push(serverItem);
            }
        }

        return merged;
    }

    /**
     * Local storage helpers
     */
    private getLocalPortfolios(): any[] {
        try {
            const data = localStorage.getItem('core_dna_portfolios');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('[HybridStorage] Failed to parse portfolios:', e);
            return [];
        }
    }

    private getLocalCampaigns(portfolioId: string): any[] {
        try {
            const data = localStorage.getItem(`campaigns_${portfolioId}`);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    private getLocalLeads(portfolioId: string): any[] {
        try {
            const data = localStorage.getItem(`leads_${portfolioId}`);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Get sync status
     */
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            queuedOperations: this.offlineQueue.length,
            syncing: this.syncInProgress,
        };
    }

    /**
     * Clear all data
     */
    clearAll() {
        localStorage.removeItem('core_dna_portfolios');
        localStorage.removeItem('_offline_queue');
        this.offlineQueue = [];
    }
}

export const hybridStorage = new HybridStorageService();
