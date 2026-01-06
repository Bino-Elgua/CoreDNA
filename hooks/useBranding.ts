
import { useState, useEffect } from 'react';
import { APP_NAME } from '../constants';
import { GlobalSettings } from '../types';

export const useBranding = () => {
    const [branding, setBranding] = useState({
        name: APP_NAME,
        logo: '',
        isWhiteLabel: false
    });

    useEffect(() => {
        const updateBranding = () => {
            const stored = localStorage.getItem('core_dna_settings');
            if (stored) {
                try {
                    const settings: GlobalSettings = JSON.parse(stored);
                    if (settings.whiteLabel?.enabled) {
                        const agencyName = settings.whiteLabel.agencyName || APP_NAME;
                        setBranding({
                            name: agencyName,
                            logo: settings.whiteLabel.logoUrl || '',
                            isWhiteLabel: true
                        });
                        document.title = `${agencyName} | AI Brand Analyst`;
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse settings for branding", e);
                }
            }
            // Default
            setBranding({ name: APP_NAME, logo: '', isWhiteLabel: false });
            document.title = `${APP_NAME} | AI Brand Analyst`;
        };

        // Initial Load
        updateBranding();

        // Listen for global changes
        window.addEventListener('settingsUpdated', updateBranding);
        return () => window.removeEventListener('settingsUpdated', updateBranding);
    }, []);

    return branding;
};
