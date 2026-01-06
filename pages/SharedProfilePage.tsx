
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DNAProfileCard from '../components/DNAProfileCard';
import { BrandDNA } from '../types';

const SharedProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [dna, setDna] = useState<BrandDNA | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, this would fetch from a database by ID.
        // Here we simulate by looking into localStorage, assuming the user is on the same machine/demo.
        // For a true "Share" feature, we'd need a backend.
        const stored = localStorage.getItem('core_dna_profiles');
        if (stored) {
            try {
                const profiles = JSON.parse(stored);
                const found = profiles.find((p: any) => p.id === id);
                if (found) setDna(found);
            } catch(e) {}
        }
        setLoading(false);
    }, [id]);

    if (loading) return <div className="p-12 text-center">Loading Brand DNA...</div>;

    if (!dna) return (
        <div className="p-20 text-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-gray-500 mb-8">Brand Profile Not Found or Expired.</p>
            <Link to="/" className="text-dna-primary underline">Go Home</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-dna-primary to-dna-secondary flex items-center justify-center text-white font-bold">C</div>
                        <span className="font-bold text-gray-900 dark:text-white">Core DNA</span>
                    </div>
                    <Link to="/" className="text-sm font-bold text-dna-primary hover:underline">
                        Create Your Own
                    </Link>
                </div>
            </div>
            
            <div className="container mx-auto px-4 pt-10">
                <div className="mb-8 text-center">
                    <span className="text-xs uppercase tracking-widest text-gray-500">Public Brand Twin</span>
                </div>
                <DNAProfileCard dna={dna} readOnly={true} />
            </div>
        </div>
    );
};

export default SharedProfilePage;
