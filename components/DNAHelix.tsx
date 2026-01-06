import React from 'react';
import { motion } from 'framer-motion';

const DNAHelix: React.FC = () => {
  return (
    <div className="relative w-full h-[300px] md:h-[400px] flex items-center justify-center opacity-60">
      <svg viewBox="0 0 800 400" className="w-full h-full">
        <defs>
          <linearGradient id="dnaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        
        {/* Double Helix Simulation using Sine Waves */}
        {[...Array(20)].map((_, i) => (
            <motion.g key={i}>
                <motion.circle
                    r={4}
                    fill="url(#dnaGradient)"
                    initial={{ cx: 50 + i * 35, cy: 200 }}
                    animate={{ 
                        cy: [150, 250, 150],
                        r: [4, 6, 4],
                        opacity: [0.6, 1, 0.6]
                    }}
                    transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: i * 0.1 
                    }}
                />
                <motion.circle
                    r={4}
                    fill="url(#dnaGradient)"
                    initial={{ cx: 50 + i * 35, cy: 200 }}
                    animate={{ 
                        cy: [250, 150, 250],
                         r: [4, 6, 4],
                        opacity: [0.6, 1, 0.6]
                    }}
                    transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: i * 0.1 
                    }}
                />
                 {/* Connecting lines (base pairs) */}
                <motion.line
                    stroke="url(#dnaGradient)"
                    strokeWidth="1"
                    initial={{ x1: 50 + i * 35, y1: 200, x2: 50 + i * 35, y2: 200 }}
                    animate={{ 
                        y1: [150, 250, 150],
                        y2: [250, 150, 250],
                        opacity: [0.2, 0.5, 0.2]
                    }}
                    transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: i * 0.1 
                    }}
                />
            </motion.g>
        ))}
      </svg>
    </div>
  );
};

export default DNAHelix;
