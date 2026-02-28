'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Leaf, Clock, ArrowLeft, ArrowRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://plantcare-pro-api.onrender.com';

type HistoryItem = {
    id: number;
    filename: string;
    predicted_class: string;
    confidence: number;
    created_at: string;
};

export default function HistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_URL}/history`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                } else {
                    router.push('/login');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [router]);

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex items-center justify-between mb-12 mt-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-white/50">
                        <Leaf className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PlantCare <span className="text-gradient">Pro</span></h1>
                        <p className="text-sm font-medium text-gray-500">Personal History Dashboard</p>
                    </div>
                </div>
                <button onClick={() => router.push('/')} className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Scanner
                </button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
            >
                <div className="glass-card rounded-[2rem] p-8 lg:p-12 overflow-hidden relative min-h-[500px]">
                    <h2 className="text-2xl font-bold mb-8 text-gray-800 flex items-center gap-3">
                        <Clock className="w-6 h-6 text-brand-500" /> Past Diagnoses
                    </h2>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <Leaf className="w-10 h-10 animate-bounce text-brand-400 mb-4" />
                            <p>Loading History...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <p>You haven't scanned any plants yet.</p>
                            <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-full text-sm font-bold hover:bg-brand-700 transition-all">Scan First Plant</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {history.map((item, index) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={item.id}
                                    className="bg-white/50 border border-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-start justify-between"
                                >
                                    <div>
                                        <div className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-1">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 leading-tight">{item.predicted_class}</h3>
                                        <p className="text-sm font-medium text-gray-500 mt-1 truncate max-w-[200px]">{item.filename}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className="bg-white px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-emerald-50 text-brand-700">
                                            {(item.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
