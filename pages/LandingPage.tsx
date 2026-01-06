
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DNAHelix from '../components/DNAHelix';
import { FADE_IN_UP, STAGGER_CHILDREN } from '../constants';
import { useBranding } from '../hooks/useBranding';

const LandingPage: React.FC = () => {
  const { name: appName } = useBranding();

  return (
    <motion.div 
      initial="hidden" animate="visible" exit="hidden"
      variants={FADE_IN_UP}
      className="container mx-auto px-4 py-20 flex flex-col items-center text-center"
    >
      <div className="w-full max-w-4xl">
        <motion.h1 
          className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-dna-primary via-dna-secondary to-dna-accent"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          {appName === "Core DNA" ? (
              <>Extract Your Brand's<br/>Core DNA</>
          ) : (
              <>{appName}<br/><span className="text-4xl text-gray-500 dark:text-gray-400">AI Brand Intelligence</span></>
          )}
        </motion.h1>
        <motion.p 
          className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto"
          variants={FADE_IN_UP}
        >
          Extract your brand's essence from your website. Save it. Generate unlimited on-brand campaigns.
        </motion.p>
        
        <DNAHelix />
        
        <Link to="/dashboard">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-10 px-8 py-4 bg-gradient-to-r from-dna-primary to-dna-secondary text-white rounded-full font-bold text-lg shadow-lg hover:shadow-dna-primary/50 transition-all"
          >
            Get Started
          </motion.button>
        </Link>
      </div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full max-w-6xl"
        variants={STAGGER_CHILDREN}
      >
          {[
              { title: "Brand Extraction", desc: "AI decodes your colors, fonts, tone, and personality from your URL." },
              { title: "Saved Profiles", desc: "Build a library of brand profiles for different clients or product lines." },
              { title: "Full Campaign Generator", desc: "Create coherent social posts, emails, and ads in one click." }
          ].map((f, i) => (
              <motion.div key={i} variants={FADE_IN_UP} className="p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700 hover:border-dna-primary transition-colors">
                  <h3 className="text-xl font-bold mb-2 font-display">{f.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{f.desc}</p>
              </motion.div>
          ))}
      </motion.div>
    </motion.div>
  );
};

export default LandingPage;
