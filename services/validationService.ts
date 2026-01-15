import { errorHandler } from './errorHandlingService';

/**
 * Validation Service
 * Provides data validation utilities
 */

export interface ValidationError {
    field: string;
    message: string;
}

class ValidationService {
    /**
     * Validate portfolio data
     */
    validatePortfolio(data: any): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!data) {
            errors.push({ field: 'portfolio', message: 'Portfolio data required' });
            return errors;
        }

        if (!data.companyName || typeof data.companyName !== 'string') {
            errors.push({ field: 'companyName', message: 'Company name is required' });
        }

        if (!data.industry || typeof data.industry !== 'string') {
            errors.push({ field: 'industry', message: 'Industry is required' });
        }

        if (data.companyWebsite && !this.isValidUrl(data.companyWebsite)) {
            errors.push({ field: 'companyWebsite', message: 'Invalid website URL' });
        }

        if (!data.brandDNA || typeof data.brandDNA !== 'object') {
            errors.push({ field: 'brandDNA', message: 'Brand DNA is required' });
        } else {
            const dnaDnaErrors = this.validateBrandDNA(data.brandDNA);
            errors.push(...dnaDnaErrors);
        }

        return errors;
    }

    /**
     * Validate brand DNA
     */
    validateBrandDNA(data: any): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!data.name || typeof data.name !== 'string') {
            errors.push({ field: 'brandDNA.name', message: 'Brand name is required' });
        }

        if (!data.tagline || typeof data.tagline !== 'string') {
            errors.push({ field: 'brandDNA.tagline', message: 'Tagline is required' });
        }

        if (!data.mission || typeof data.mission !== 'string') {
            errors.push({ field: 'brandDNA.mission', message: 'Mission is required' });
        }

        if (!Array.isArray(data.coreValues) || data.coreValues.length === 0) {
            errors.push({ field: 'brandDNA.coreValues', message: 'At least one core value is required' });
        }

        if (!data.targetAudience || typeof data.targetAudience !== 'string') {
            errors.push({ field: 'brandDNA.targetAudience', message: 'Target audience is required' });
        }

        return errors;
    }

    /**
     * Validate campaign
     */
    validateCampaign(data: any): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!data.name || typeof data.name !== 'string') {
            errors.push({ field: 'name', message: 'Campaign name is required' });
        }

        if (data.status && !['draft', 'active', 'paused', 'completed'].includes(data.status)) {
            errors.push({ field: 'status', message: 'Invalid campaign status' });
        }

        return errors;
    }

    /**
     * Validate lead
     */
    validateLead(data: any): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!data.lead_name || typeof data.lead_name !== 'string') {
            errors.push({ field: 'lead_name', message: 'Lead name is required' });
        }

        if (data.email && !this.isValidEmail(data.email)) {
            errors.push({ field: 'email', message: 'Invalid email address' });
        }

        if (data.phone && !this.isValidPhone(data.phone)) {
            errors.push({ field: 'phone', message: 'Invalid phone number' });
        }

        if (data.status && !['new', 'contacted', 'qualified', 'converted', 'lost'].includes(data.status)) {
            errors.push({ field: 'status', message: 'Invalid lead status' });
        }

        return errors;
    }

    /**
     * Validate email
     */
    isValidEmail(email: string): boolean {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Validate URL
     */
    isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate phone number (basic)
     */
    isValidPhone(phone: string): boolean {
        const re = /^[\d\s\-\+\(\)]+$/;
        return re.test(phone) && phone.replace(/\D/g, '').length >= 7;
    }

    /**
     * Validate JSON string
     */
    isValidJSON(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Sanitize string (XSS prevention)
     */
    sanitizeString(str: string): string {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Validate and report errors
     */
    validateAndReport(
        data: any,
        type: 'portfolio' | 'campaign' | 'lead' | 'brandDNA',
        throwOnError: boolean = false
    ): ValidationError[] {
        let errors: ValidationError[] = [];

        switch (type) {
            case 'portfolio':
                errors = this.validatePortfolio(data);
                break;
            case 'campaign':
                errors = this.validateCampaign(data);
                break;
            case 'lead':
                errors = this.validateLead(data);
                break;
            case 'brandDNA':
                errors = this.validateBrandDNA(data);
                break;
        }

        if (errors.length > 0) {
            const errorMessage = errors.map(e => `${e.field}: ${e.message}`).join('; ');
            errorHandler.logValidationError(errorMessage, { errors, type, data });

            if (throwOnError) {
                throw new Error(errorMessage);
            }
        }

        return errors;
    }
}

export const validator = new ValidationService();
