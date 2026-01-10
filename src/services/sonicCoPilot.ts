import { supabase } from './supabase';
import { toastService } from './toastService';
import { tierService } from './tierService';
import { n8nService } from './n8nService';
import { geminiService } from './geminiService';

// Import getActiveLLMProvider for provider selection
const getActiveLLMProvider = () => {
  const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');

  // PRIORITY 1: Use explicitly set activeLLM from Settings if it has API key
  if (settings.activeLLM && settings.llms?.[settings.activeLLM]?.apiKey) {
    return settings.activeLLM;
  }

  // PRIORITY 2: Check BYOK storage for any configured LLM provider
  const llmProviders = ['gemini', 'openai', 'claude', 'mistral', 'groq', 'deepseek', 'xai', 'qwen', 'cohere', 'together', 'openrouter', 'perplexity'];
  for (const provider of llmProviders) {
    if (apiKeys[provider]) {
      return provider;
    }
  }

  throw new Error('No LLM provider configured. Please select an LLM provider in Settings and add its API key.');
};

interface SonicCommand {
  intent: string;
  context: Record<string, any>;
  confidence: number;
}

export class SonicCoPilot {
  private isEnabled: boolean = false;
  private isListening: boolean = false;
  private commandHistory: string[] = [];

  /**
   * Initialize Sonic Co-Pilot
   */
  async initialize(): Promise<boolean> {
    // Check if user has access (Hunter+ tier)
    const hasAccess = await tierService.checkFeatureAccess('sonicAgent');

    if (!hasAccess) {
      toastService.showToast(
        '🎯 Sonic Co-Pilot requires Hunter tier or higher',
        'warning'
      );
      return false;
    }

    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toastService.showToast(
        '🎤 Voice recognition not supported in this browser. Use Chrome/Edge.',
        'error'
      );
      return false;
    }

    this.isEnabled = true;
    await this.logAction('sonic_initialized');

    return true;
  }

  /**
   * Enable/disable voice listening
   */
  setListening(enabled: boolean): void {
    this.isListening = enabled;
  }

  /**
   * Check if Sonic is currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening && this.isEnabled;
  }

  /**
   * Detect intent from natural language using AI
   */
  private async detectIntent(input: string): Promise<SonicCommand | null> {
    try {
      const prompt = `
You are Sonic, an AI assistant for CoreDNA brand intelligence platform.

Parse this user command and extract the intent and context.

Available intents:
- extract_brand (extract brand DNA from URL)
- generate_campaign (create marketing campaign)
- build_website (generate and deploy website)
- run_workflow (execute n8n workflow)
- upgrade_tier (upgrade subscription)
- show_stats (display analytics)
- help (show available commands)

User command: "${input}"

Respond ONLY with JSON:
{
  "intent": "intent_name",
  "context": { extracted parameters },
  "confidence": 0.0-1.0
}

Examples:
"Extract apple.com" → {"intent": "extract_brand", "context": {"url": "https://apple.com"}, "confidence": 0.95}
"Launch viral campaign for Nike" → {"intent": "generate_campaign", "context": {"brand": "Nike", "goal": "viral"}, "confidence": 0.9}
"Build me a website" → {"intent": "build_website", "context": {}, "confidence": 0.85}
`;

      const provider = getActiveLLMProvider();
      const response = await geminiService.generate(provider, prompt, {
        temperature: 0.3,
        maxTokens: 200
      });

      // Parse JSON response
      const cleaned = response.replace(/```json|```/g, '').trim();
      const command = JSON.parse(cleaned);

      return command as SonicCommand;
    } catch (error) {
      console.error('Intent detection failed:', error);
      return null;
    }
  }

  /**
   * Check if user has permission for command
   */
  private async checkPermission(intent: string): Promise<boolean> {
    const info = await tierService.getUserTierInfo();

    const permissions: Record<string, string[]> = {
      extract_brand: ['free', 'pro', 'hunter', 'agency'],
      generate_campaign: ['pro', 'hunter', 'agency'],
      build_website: ['pro', 'hunter', 'agency'],
      run_workflow: ['hunter', 'agency'],
      upgrade_tier: ['free', 'pro', 'hunter', 'agency'],
      show_stats: ['free', 'pro', 'hunter', 'agency'],
      help: ['free', 'pro', 'hunter', 'agency']
    };

    const allowedTiers = permissions[intent] || [];
    return allowedTiers.includes(info.tier);
  }

  /**
   * Get available commands for tier
   */
  private getAvailableCommands(tier: string): string[] {
    const commands = {
      free: ['extract_brand', 'help', 'show_stats', 'upgrade_tier'],
      pro: ['extract_brand', 'generate_campaign', 'build_website', 'help', 'show_stats'],
      hunter: ['extract_brand', 'generate_campaign', 'build_website', 'run_workflow', 'help', 'show_stats'],
      agency: ['extract_brand', 'generate_campaign', 'build_website', 'run_workflow', 'help', 'show_stats']
    };

    return commands[tier as keyof typeof commands] || commands.free;
  }

  /**
   * Log action to database for audit trail
   */
  private async logAction(action: string, metadata?: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      await supabase.from('sonic_logs').insert({
        user_id: user.id,
        action,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log sonic action:', error);
    }
  }

  /**
   * Confirm destructive action
   */
  private async confirmAction(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmed = window.confirm(message);
      resolve(confirmed);
    });
  }

  /**
   * Extract brand DNA
   */
  private async extractBrand(context: any): Promise<string> {
    // Check extraction limit
    const canExtract = await tierService.checkExtractionLimit();

    if (!canExtract) {
      return "You've hit your monthly extraction limit. Upgrade to Pro for unlimited extractions.";
    }

    const url = context.url || context.website;

    if (!url) {
      return "Please specify a URL. Example: 'Extract apple.com'";
    }

    try {
      toastService.showToast('🧬 Extracting brand DNA...', 'info');

      // Call actual extraction service (integrate with your existing ExtractPage logic)
      const provider = getActiveLLMProvider();
      const dna = await geminiService.generate(provider, `Extract brand DNA from ${url}`, {
        maxTokens: 2000
      });

      await tierService.recordExtraction();
      await this.logAction('brand_extracted', { url });

      toastService.showToast('✅ Brand DNA extracted successfully!', 'success');

      return `Brand DNA extracted from ${url}. Key insights captured. Ready to generate campaigns or build website.`;
    } catch (error: any) {
      return `Failed to extract brand: ${error.message}`;
    }
  }

  /**
   * Generate marketing campaign
   */
  private async generateCampaign(context: any): Promise<string> {
    // Check workflow access
    const hasAccess = await tierService.checkWorkflowAccess('campaign-generation');

    if (!hasAccess) {
      return "Campaign generation requires Pro tier or higher.";
    }

    toastService.showToast('🚀 Launching campaign generation...', 'info');

    try {
      const result = await n8nService.runWorkflow('campaign-generation', {
        goal: context.goal || 'engagement',
        brand: context.brand || 'current'
      });

      await this.logAction('campaign_generated', context);

      toastService.showToast('✅ Campaign assets generated!', 'success');

      return `Campaign generated with ${result.assets?.length || 0} assets. Check the Campaigns page to review and schedule.`;
    } catch (error: any) {
      return `Campaign generation failed: ${error.message}`;
    }
  }

  /**
   * Build and deploy website
   */
  private async buildWebsite(context: any): Promise<string> {
    const hasAccess = await tierService.checkWorkflowAccess('website-builder');

    if (!hasAccess) {
      return "Website builder requires Pro tier or higher.";
    }

    // Confirm destructive action
    const confirmed = await this.confirmAction(
      'This will generate and deploy a new website. Continue?'
    );

    if (!confirmed) {
      return "Website build cancelled.";
    }

    toastService.showToast('🌐 Building website...', 'info');

    try {
      const result = await n8nService.runWorkflow('website-builder', {
        dna: context.dna || 'current'
      });

      await this.logAction('website_built', { url: result.url });

      toastService.showToast(`✅ Website live at ${result.url}`, 'success');

      return `Website deployed to ${result.url}. Sonic Agent embedded and active.`;
    } catch (error: any) {
      return `Website build failed: ${error.message}`;
    }
  }

  /**
   * Run n8n workflow
   */
  private async runWorkflow(context: any): Promise<string> {
    const workflowName = context.workflow || context.name;

    if (!workflowName) {
      return "Please specify a workflow name.";
    }

    const hasAccess = await tierService.checkWorkflowAccess(workflowName);

    if (!hasAccess) {
      return `Workflow '${workflowName}' requires Hunter tier or higher.`;
    }

    toastService.showToast(`⚡ Running workflow: ${workflowName}`, 'info');

    try {
      await n8nService.runWorkflow(workflowName, context);

      await this.logAction('workflow_executed', { workflow: workflowName });

      return `Workflow '${workflowName}' executed successfully.`;
    } catch (error: any) {
      return `Workflow execution failed: ${error.message}`;
    }
  }

  /**
   * Upgrade user tier
   */
  private async upgradeTier(context: any): Promise<string> {
    const targetTier = context.tier || 'pro';

    // Redirect to pricing page
    window.location.href = `/pricing?upgrade=${targetTier}`;

    return `Redirecting to upgrade flow for ${targetTier.toUpperCase()} tier...`;
  }

  /**
   * Show usage statistics
   */
  private async showStats(): Promise<string> {
    const info = await tierService.getUserTierInfo();

    return `
Current Tier: ${info.tier.toUpperCase()}
Extractions This Month: ${info.extractionsThisMonth}
Available Commands: ${this.getAvailableCommands(info.tier).length}
    `.trim();
  }

  /**
   * Show help
   */
  private showHelp(): string {
    return `
Sonic Co-Pilot Commands:

🧬 Brand Extraction
  "Extract [URL]" — Extract brand DNA from website
  "Analyze apple.com" — Same as extract

🚀 Campaign Generation
  "Launch viral campaign" — Generate marketing assets
  "Create campaign for Nike" — Brand-specific campaign

🌐 Website Builder
  "Build me a website" — Generate and deploy site
  "Deploy website" — Same as build

⚡ Workflows
  "Run lead generation" — Execute workflow by name
  "Start closer agent" — Activate sales automation

📊 Stats
  "Show stats" — Display usage and tier info
  "What's my tier?" — Current subscription level

Need help? Just ask: "Sonic, what can you do?"
    `.trim();
  }

  /**
   * Execute parsed command
   */
  private async executeCommand(command: SonicCommand): Promise<string> {
    // Tier check before execution
    const canExecute = await this.checkPermission(command.intent);

    if (!canExecute) {
      return "This action requires a higher tier. Upgrade to unlock.";
    }

    switch (command.intent) {
      case 'extract_brand':
        return await this.extractBrand(command.context);

      case 'generate_campaign':
        return await this.generateCampaign(command.context);

      case 'build_website':
        return await this.buildWebsite(command.context);

      case 'run_workflow':
        return await this.runWorkflow(command.context);

      case 'upgrade_tier':
        return await this.upgradeTier(command.context);

      case 'show_stats':
        return await this.showStats();

      case 'help':
        return this.showHelp();

      default:
        return `I don't know how to handle "${command.intent}" yet. Type "help" to see what I can do.`;
    }
  }

  /**
   * Process voice or text command
   */
  async processCommand(input: string): Promise<string> {
    try {
      // Parse intent from natural language
      const command = await this.detectIntent(input);

      if (!command || command.confidence < 0.6) {
        return "I didn't quite catch that. Could you rephrase?";
      }

      // Log command for audit trail
      await this.logAction('command_received', {
        intent: command.intent,
        confidence: command.confidence
      });

      // Route to appropriate handler
      const response = await this.executeCommand(command);

      // Store in history
      this.commandHistory.push(input);

      if (this.commandHistory.length > 50) {
        this.commandHistory.shift();
      }

      return response;
    } catch (error: any) {
      console.error('Sonic command error:', error);
      await this.logAction('command_error', { error: error.message });

      return `Error: ${error.message}`;
    }
  }
}

export const sonicCoPilot = new SonicCoPilot();
