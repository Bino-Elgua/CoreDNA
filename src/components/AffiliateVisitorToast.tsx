import { useState } from 'react';

export function AffiliateVisitorToast({ visitor }: { visitor: { company: string } }) {
  const [dismissed, setDismissed] = useState(false);
  const [drafting, setDrafting] = useState(false);

  if (dismissed) return null;

  const handleDraftMessage = async () => {
    setDrafting(true);
    // TODO: Integrate with LLM to draft personalized message
    // This requires manual approval before sending (no auto-send)
    setTimeout(() => {
      setDrafting(false);
      // Show draft modal for user approval
    }, 2000);
  };

  return (
    <div className="fixed bottom-24 right-6 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl shadow-2xl p-5 max-w-md z-50 animate-slide-up">
      <div className="flex items-start gap-4">
        <div className="text-3xl">🌟</div>
        <div className="flex-1">
          <p className="font-bold text-lg">
            Referral visitor from {visitor.company}
          </p>
          <p className="text-sm opacity-90 mt-1">
            Browsing your affiliate landing page
          </p>
          <p className="text-sm mt-3">
            Draft a personalized outreach message?
          </p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDraftMessage}
              disabled={drafting}
              className="px-4 py-2 bg-white text-emerald-600 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              {drafting ? 'Drafting...' : 'Yes, draft message'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2 bg-transparent border border-white rounded-lg text-sm hover:bg-white/10"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
