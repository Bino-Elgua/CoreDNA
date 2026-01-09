import { useState } from 'react';
import { TIER_LIMITS, TIER_PRICES, TIER_NAMES, TIER_DESCRIPTIONS, TIER_BADGES } from '../constants/tiers';
import { UpgradeModal } from '../components/UpgradeModal';
import type { Tier } from '../constants/tiers';

export function PricingPage() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);

  const tiers = [
    {
      id: 'free' as Tier,
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Get started with brand intelligence',
      badge: null,
      cta: 'Start Free',
      ctaHref: '/signup',
      features: [
        { text: '3 DNA extractions per month', icon: '🧬' },
        { text: '2 LLM providers (Gemini Flash + Ollama)', icon: '🔤' },
        { text: '1 image provider (Imagen 3)', icon: '🎨' },
        { text: '1 voice provider (OpenAI TTS)', icon: '🔊' },
        { text: 'Export profiles (PDF/JSON)', icon: '💾' },
        { text: 'BYOK (Bring Your Own Keys)', icon: '🔑' },
        { text: 'Community support', icon: '💬' },
      ],
    },
    {
      id: 'pro' as Tier,
      name: 'Pro',
      price: '$49',
      period: '/month',
      description: 'Complete agency toolkit for professionals',
      badge: '🔥 Most Popular',
      cta: 'Start Pro Trial',
      ctaHref: '/signup?tier=pro',
      features: [
        { text: 'Unlimited DNA extractions', icon: '🧬', highlight: true },
        { text: 'All 30+ LLM providers', icon: '🔤', highlight: true },
        { text: 'All 20+ image providers', icon: '🎨', highlight: true },
        { text: 'All 15+ voice providers', icon: '🔊', highlight: true },
        { text: 'All 4 inference techniques', icon: '⚡', highlight: true },
        { text: 'RLM (Infinite context)', icon: '♾️' },
        { text: '4 core workflows', icon: '🔄' },
        { text: 'Website builder + Rocket.new deploy', icon: '🌐' },
        { text: 'Sonic Agent chat widget (live)', icon: '🤖' },
        { text: 'Email support', icon: '📧' },
      ],
    },
    {
      id: 'hunter' as Tier,
      name: 'Hunter',
      price: '$149',
      period: '/month',
      description: 'Full automation for growing agencies',
      badge: '⚡ Best Value',
      cta: 'Start Hunter Trial',
      ctaHref: '/signup?tier=hunter',
      features: [
        { text: 'Everything in Pro, plus:', icon: '✨', highlight: true },
        { text: 'Workflow editing & customization', icon: '⚙️', highlight: true },
        { text: 'Auto-Post Scheduler', icon: '📅', highlight: true },
        { text: 'Advanced website builder with blog', icon: '📝' },
        { text: 'Schedule-triggered automations', icon: '⏰' },
        { text: '3 team members', icon: '👥' },
        { text: 'API access', icon: '🔌' },
        { text: 'Priority support', icon: '🎯' },
      ],
    },
    {
      id: 'agency' as Tier,
      name: 'Agency',
      price: 'Custom',
      period: '',
      description: 'White-label for resellers & enterprises',
      badge: '🏢 Enterprise',
      cta: 'Contact Sales',
      ctaHref: '/contact',
      features: [
        { text: 'Everything in Hunter, plus:', icon: '✨', highlight: true },
        { text: 'Unlimited team members', icon: '👥', highlight: true },
        { text: 'White-label & custom branding', icon: '🏷️', highlight: true },
        { text: '🏢 Affiliate Hub — Earn 20% recurring commission', icon: '💰', highlight: true, badge: 'REVENUE SHARE' },
        { text: 'Branded referral landing pages with compliant visitor intelligence', icon: '🌐' },
        { text: 'Consent-first tracking (GDPR/CCPA compliant)', icon: '🔒' },
        { text: 'Bulk extraction (100+ at once)', icon: '⚡' },
        { text: 'Dedicated account manager', icon: '🤝' },
        { text: 'Enterprise SSO & audit logs', icon: '🔐' },
        { text: 'Custom integrations & SLA', icon: '🛠️' },
        { text: 'Reseller commission program', icon: '💰' },
      ],
    },
  ];

  return (
    <div className="pricing-page max-w-7xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 mb-8">
          From free starter to enterprise white-label
        </p>
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-6 py-2">
          <span className="text-green-600 font-semibold">✨ 7-day free trial on all paid plans</span>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`
              relative border rounded-xl p-6
              ${tier.badge && tier.badge.includes('Popular') ? 'border-blue-500 shadow-2xl' : 'border-gray-200 shadow-lg'}
              hover:shadow-2xl transition-all
            `}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {tier.badge}
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-gray-600 text-sm">{tier.period}</span>
              </div>
              <p className="text-sm text-gray-600">{tier.description}</p>
            </div>

            <ul className="space-y-2 mb-6">
              {tier.features.map((feature, idx) => (
                <li
                  key={idx}
                  className={`
                    flex items-start gap-2 text-sm
                    ${feature.highlight ? 'font-semibold text-blue-600' : 'text-gray-700'}
                  `}
                >
                  <span className="text-lg">{feature.icon}</span>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>

            <a
              href={tier.ctaHref}
              className={`
                block w-full py-3 rounded-lg font-semibold text-center transition-colors
                ${
                  tier.id === 'pro' || tier.id === 'hunter'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600'
                }
              `}
            >
              {tier.cta}
            </a>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-4 px-4">Feature</th>
              <th className="text-center py-4 px-4">Free</th>
              <th className="text-center py-4 px-4 bg-blue-50">Pro</th>
              <th className="text-center py-4 px-4">Hunter</th>
              <th className="text-center py-4 px-4">Agency</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">DNA Extractions</td>
              <td className="text-center py-4 px-4">3/month</td>
              <td className="text-center py-4 px-4 bg-blue-50">Unlimited</td>
              <td className="text-center py-4 px-4">Unlimited</td>
              <td className="text-center py-4 px-4">Unlimited</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">LLM Providers</td>
              <td className="text-center py-4 px-4">2</td>
              <td className="text-center py-4 px-4 bg-blue-50">All 30+</td>
              <td className="text-center py-4 px-4">All 30+</td>
              <td className="text-center py-4 px-4">All 30+</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">Image Providers</td>
              <td className="text-center py-4 px-4">1</td>
              <td className="text-center py-4 px-4 bg-blue-50">All 20+</td>
              <td className="text-center py-4 px-4">All 20+</td>
              <td className="text-center py-4 px-4">All 20+</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">Voice Providers</td>
              <td className="text-center py-4 px-4">1</td>
              <td className="text-center py-4 px-4 bg-blue-50">All 15+</td>
              <td className="text-center py-4 px-4">All 15+</td>
              <td className="text-center py-4 px-4">All 15+</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">Inference Techniques</td>
              <td className="text-center py-4 px-4">—</td>
              <td className="text-center py-4 px-4 bg-blue-50">All 4</td>
              <td className="text-center py-4 px-4">All 4</td>
              <td className="text-center py-4 px-4">All 4</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">RLM (Infinite Context)</td>
              <td className="text-center py-4 px-4">—</td>
              <td className="text-center py-4 px-4 bg-blue-50">✓</td>
              <td className="text-center py-4 px-4">✓</td>
              <td className="text-center py-4 px-4">✓</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">Workflows</td>
              <td className="text-center py-4 px-4">0</td>
              <td className="text-center py-4 px-4 bg-blue-50">4</td>
              <td className="text-center py-4 px-4">4</td>
              <td className="text-center py-4 px-4">5</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">Workflow Editing</td>
              <td className="text-center py-4 px-4">—</td>
              <td className="text-center py-4 px-4 bg-blue-50">—</td>
              <td className="text-center py-4 px-4">✓</td>
              <td className="text-center py-4 px-4">✓</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">Auto-Post Scheduler</td>
              <td className="text-center py-4 px-4">—</td>
              <td className="text-center py-4 px-4 bg-blue-50">—</td>
              <td className="text-center py-4 px-4">✓</td>
              <td className="text-center py-4 px-4">✓</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">Website Builder</td>
              <td className="text-center py-4 px-4">Preview</td>
              <td className="text-center py-4 px-4 bg-blue-50">Full</td>
              <td className="text-center py-4 px-4">Full</td>
              <td className="text-center py-4 px-4">Full</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">Team Members</td>
              <td className="text-center py-4 px-4">1</td>
              <td className="text-center py-4 px-4 bg-blue-50">1</td>
              <td className="text-center py-4 px-4">3</td>
              <td className="text-center py-4 px-4">Unlimited</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">White-Label</td>
              <td className="text-center py-4 px-4">—</td>
              <td className="text-center py-4 px-4 bg-blue-50">—</td>
              <td className="text-center py-4 px-4">—</td>
              <td className="text-center py-4 px-4">✓</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">Bulk Extraction</td>
              <td className="text-center py-4 px-4">—</td>
              <td className="text-center py-4 px-4 bg-blue-50">—</td>
              <td className="text-center py-4 px-4">—</td>
              <td className="text-center py-4 px-4">✓</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 font-semibold">Affiliate Hub</td>
              <td className="text-center py-4 px-4">—</td>
              <td className="text-center py-4 px-4 bg-blue-50">—</td>
              <td className="text-center py-4 px-4">—</td>
              <td className="text-center py-4 px-4">✓ (20% commission)</td>
            </tr>
            <tr>
              <td className="py-4 px-4 font-semibold">Support</td>
              <td className="text-center py-4 px-4">Community</td>
              <td className="text-center py-4 px-4 bg-blue-50">Email</td>
              <td className="text-center py-4 px-4">Email</td>
              <td className="text-center py-4 px-4">Dedicated</td>
            </tr>
          </tbody>
        </table>
      </div>

      {showUpgradeModal && selectedTier && (
        <UpgradeModal
          currentTier="free"
          targetTier={selectedTier}
          onClose={() => setShowUpgradeModal(false)}
          onConfirm={() => {
            // Handle upgrade
            setShowUpgradeModal(false);
          }}
        />
      )}
    </div>
  );
}
