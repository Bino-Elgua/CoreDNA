
export const APP_NAME = "Core DNA";

export const FADE_IN_UP = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export const STAGGER_CHILDREN = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export const MOCK_DNA_DATA = {
  id: "mock-eco-luxe-123",
  name: "EcoLuxe Tech",
  tagline: "Sustainable Technology for a Greener Future",
  description: "A forward-thinking technology brand focused on eco-friendly gadgets and renewable energy solutions.",
  websiteUrl: "https://ecoluxetech.com",
  detectedLanguage: "en",
  
  confidenceScores: {
      visuals: 92,
      strategy: 88,
      tone: 95,
      overall: 91
  },

  trendAlignment: {
      trendName: "Regenerative Future",
      score: 89,
      reasoning: "The brand perfectly aligns with the growing consumer demand for tech that heals the planet rather than just sustaining it."
  },

  accessibility: {
      logoAlt: "A stylized green leaf circuit board icon",
      guidelines: "Ensure high contrast for all text. Use aria-labels for all interactive tech demos."
  },

  sonicIdentity: {
      voiceType: "Warm, Intellectual, Optimistic",
      musicGenre: "Organic Lo-Fi & Ambient Nature",
      soundKeywords: ["Water drop", "Synthesized breeze", "Soft click"],
      audioLogoDescription: "A gentle chime transitioning into a digital hum."
  },

  colors: [
    { hex: "#10B981", name: "Emerald Vitality", usage: "Primary Brand Color" },
    { hex: "#3B82F6", name: "Ocean Depth", usage: "Secondary/Accents" },
    { hex: "#F59E0B", name: "Solar Flare", usage: "Call to Action" },
    { hex: "#F9FAFB", name: "Clean Slate", usage: "Background" },
    { hex: "#064E3B", name: "Deep Forest", usage: "Text/Footer" }
  ],
  fonts: [
    { family: "Space Grotesk", usage: "Headings", description: "Modern, geometric sans-serif for impact." },
    { family: "Inter", usage: "Body", description: "Clean, highly readable sans-serif for long text." }
  ],
  
  visualStyle: {
    style: "Eco-Modernist",
    description: "Minimalist, nature-inspired, clean lines, plenty of whitespace with green accents. Imagery blends raw nature with sleek matte metal."
  },
  
  heroImagePrompt: "A sleek, solar-powered device resting on a mossy rock in a futuristic bright forest, macro photography style, soft sunlight filtering through leaves.",
  heroImageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",

  visualIdentityExtended: {
      logoStyle: "Abstract leaf combined with circuit lines.",
      logoGenPrompt: "A minimalist vector logo combining a green leaf and a microchip circuit, flat design, white background.",
      logoConcepts: ["Leaf Circuit", "Solar Dot", "Eco Shield"],
      patternStyle: "Organic cellular structures",
      patternGenPrompt: "Seamless pattern of microscopic plant cells in emerald green and white, vector style.",
      iconographyStyle: "Thin line, rounded corners",
      iconGenPrompt: "Set of UI icons for battery, solar power, recycle, and wifi, thin line style, green.",
      moodBoardPrompts: [
          "Futuristic eco-city skyline with vertical gardens",
          "Close up of recycled aluminum texture",
          "Diverse team working in a greenhouse office"
      ],
      generatedMoodBoardUrls: [
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80"
      ]
  },

  toneOfVoice: {
    adjectives: ["Innovative", "Eco-conscious", "Optimistic", "Professional"],
    description: "Our voice is knowledgeable yet accessible, inspiring trust and action towards a sustainable future."
  },
  
  brandPersonality: ["Creator", "Caregiver"],
  targetAudience: "Environmentally conscious professionals, tech enthusiasts, and sustainable living advocates aged 25-45.",
  
  keyMessaging: [
      "Innovation naturally.",
      "Tech that breathes.",
      "Powering the future, preserving the past."
  ],
  
  values: ["Sustainability", "Innovation", "Transparency", "Harmony"],
  
  personas: [
      {
          name: "Tech-Savvy Sarah",
          demographics: "32, Software Engineer, Urban Dweller",
          psychographics: "Loves new gadgets but feels guilty about e-waste. Wants high performance without the carbon footprint.",
          painPoints: ["Battery life anxiety", "Plastic waste", "Planned obsolescence"],
          behaviors: ["Reads TechCrunch", "Shops at Farmers Markets", "Early Adopter"]
      },
      {
          name: "Green Greg",
          demographics: "45, Architect, Suburban",
          psychographics: "Focused on energy efficiency for his smart home. Values durability and repairability.",
          painPoints: ["High energy bills", "Fragile tech", "Greenwashing"],
          behaviors: ["Researches thoroughly", "Buys for life", "Solar enthusiast"]
      }
  ],

  swot: {
      strengths: ["Patented solar tech", "Carbon-neutral supply chain", "Premium design"],
      weaknesses: ["Higher price point", "Limited retail presence"],
      opportunities: ["Government green grants", "Expansion into smart home IoT"],
      threats: ["Cheap knock-offs", "Changing battery regulations"]
  },

  competitors: [
      { name: "GreenGadget Co.", differentiation: "We offer better performance and longer warranties." },
      { name: "SolarMate", differentiation: "Our design is more premium and office-friendly." }
  ],

  createdAt: Date.now()
};
