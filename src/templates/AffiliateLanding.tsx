import { useState, useEffect } from 'react';
import { validateAndTrackVisit } from '../services/affiliateTracking';
import { AffiliateVisitorToast } from '../components/AffiliateVisitorToast';

export interface Partner {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  domains: string[];
}

export function AffiliateLanding({ partner }: { partner: Partner }) {
  const [bannerAccepted, setBannerAccepted] = useState(false);
  const [consent, setConsent] = useState({
    identification: false,
    marketing: false,
    sales: false,
  });
  const [visitorData, setVisitorData] = useState<any>(null);

  useEffect(() => {
    if (bannerAccepted && consent.identification) {
      // Get visitor IP and company
      (async () => {
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();

          // Get company from IP via Clearbit
          const clearbitResponse = await fetch(
            `https://company.clearbit.com/v1/companies/find?ip=${ipData.ip}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.REACT_APP_CLEARBIT_KEY || ''}`,
              },
            }
          );

          let company = 'Unknown';
          if (clearbitResponse.ok) {
            const companyData = await clearbitResponse.json();
            company = companyData.company?.name || 'Unknown';
          }

          const data = {
            ip: ipData.ip,
            company,
            consent,
          };

          setVisitorData(data);

          // Track visit
          await validateAndTrackVisit(partner.slug, data);
        } catch (error) {
          console.error('Error getting visitor data:', error);
        }
      })();
    }
  }, [bannerAccepted, consent, partner.slug]);

  const handleAccept = () => {
    if (consent.identification) {
      setBannerAccepted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Fixed Consent Banner — Blocks until accepted */}
      {!bannerAccepted && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Privacy & Visitor Intelligence Notice</h2>

            <p className="text-gray-700 mb-6">
              This site, operated by <strong>{partner.name}</strong>, uses visitor intelligence
              to provide relevant information — with your permission.
            </p>

            <div className="space-y-4 mb-6">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  required
                  checked={consent.identification}
                  onChange={(e) => setConsent(prev => ({ ...prev, identification: e.target.checked }))}
                  className="mt-1"
                />
                <div>
                  <strong>Required:</strong> Allow company identification
                  <p className="text-sm text-gray-600">
                    We use your IP address to identify your company via Clearbit — no personal data collected
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={(e) => setConsent(prev => ({ ...prev, marketing: e.target.checked }))}
                  className="mt-1"
                />
                <span>Receive product updates from CoreDNA (newsletter)</span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent.sales}
                  onChange={(e) => setConsent(prev => ({ ...prev, sales: e.target.checked }))}
                  className="mt-1"
                />
                <span>Allow personalized outreach from {partner.name} (sales contact)</span>
              </label>
            </div>

            <div className="text-xs text-gray-600 mb-6">
              <strong>Data Controller:</strong> {partner.name} •
              <strong>Processor:</strong> CoreDNA, Inc. •
              Provider: Clearbit (company lookup) •
              <a href="https://coredna.ai/privacy" className="underline">Privacy Policy</a> •
              <a href="https://coredna.ai/opt-out" className="underline">Opt Out</a>
            </div>

            <button
              onClick={handleAccept}
              disabled={!consent.identification}
              className="w-full px-6 py-4 bg-emerald-600 text-white text-lg font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Accept & Continue
            </button>
          </div>
        </div>
      )}

      {/* Main Content — Only visible after consent */}
      {bannerAccepted && (
        <div className="pt-12 pb-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            {partner.logo && <img src={partner.logo} alt={partner.name} className="h-32 mx-auto mb-8" />}

            <h1 className="text-5xl font-bold mb-6 text-gray-900">
              Scale Your Brand with CoreDNA
            </h1>

            <p className="text-xl text-gray-700 mb-4">
              Recommended by <strong>{partner.name}</strong>
            </p>

            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              The enterprise AI platform for brand intelligence, campaign automation,
              and revenue acceleration — trusted by leading agencies.
            </p>

            <a
              href={`https://app.coredna.ai/signup?r=${partner.id}`}
              className="inline-block px-10 py-5 bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xl font-semibold rounded-xl hover:scale-105 transition-transform shadow-lg"
            >
              Start Free Trial — Via {partner.name}
            </a>

            <p className="text-sm text-gray-600 mt-6">
              {partner.name} earns commission on referrals • No extra cost to you
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-600">
          <p>Powered by CoreDNA Affiliate Hub</p>
          <p className="mt-2">
            <a href="https://coredna.ai/privacy">Privacy</a> •
            <a href="https://coredna.ai/terms">Terms</a> •
            <a href="https://coredna.ai/opt-out">Opt Out</a>
          </p>
        </div>
      </footer>

      {/* Visitor Toast (only shown to partner) */}
      {visitorData && <AffiliateVisitorToast visitor={visitorData} />}
    </div>
  );
}
