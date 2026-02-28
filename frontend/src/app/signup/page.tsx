'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://plantcare-pro-api.onrender.com';

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to register');
            }

            // Automatically log in after registration
            const loginRes = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const loginData = await loginRes.json();

            if (!loginRes.ok) throw new Error(loginData.detail);

            localStorage.setItem('token', loginData.access_token);
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto mt-20"
        >
            <div className="bg-white/40 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-3xl p-8 transition-all hover:bg-white/50">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-white/60 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                        <Leaf className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Create Account</h1>
                    <p className="text-slate-600 mt-2">Join PlantCare Pro to save your diagnostic history.</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                                placeholder="botanist@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 ml-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                Create Account
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <button onClick={() => router.push('/login')} className="text-emerald-600 font-semibold hover:underline">
                        Log in
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
