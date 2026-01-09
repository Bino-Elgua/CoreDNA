import { useState } from 'react';
import { supabase } from '../services/supabase';

export function OptOutPage() {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);

    try {
      // Get current IP
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();

      await supabase.from('affiliate_opt_out_requests').insert({
        company_name: data.company,
        email: data.email || null,
        partner_slug: data.partner,
        visitor_ip: ipData.ip,
        requested_at: new Date().toISOString(),
      });

      setSuccess(true);

      // Auto-process within 48 hours (background job)
    } catch (error) {
      console.error('Opt-out error:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-green-600 mb-4">Opt-Out Request Received</h1>
          <p>Your request has been logged and will be processed within 48 hours.</p>
          <p className="text-sm text-gray-600 mt-4">
            Reference: {Date.now()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Opt Out of Visitor Tracking</h1>

        <p className="text-gray-700 mb-8">
          Submit a request to stop processing your visitor data from CoreDNA Affiliate Hub pages.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name (optional)</label>
            <input type="text" name="company" className="w-full px-4 py-2 border rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email Address (optional)</label>
            <input type="email" name="email" className="w-full px-4 py-2 border rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Partner Page URL (optional)</label>
            <input type="text" name="partner" placeholder="partner.coredna.ai/yourname" className="w-full px-4 py-2 border rounded-lg" />
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Submit Opt-Out Request'}
          </button>
        </form>

        <p className="text-xs text-gray-600 mt-8">
          Your request will be processed within 48 hours. For questions: privacy@coredna.ai
        </p>
      </div>
    </div>
  );
}
