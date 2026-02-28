"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Leaf, AlertCircle, CheckCircle2, RefreshCw, Hexagon, Activity } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://plantcare-pro-api.onrender.com";

type PredictionResult = {
  prediction: string;
  confidence: number;
  description: string;
  causes: string;
  treatment: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError("File size must be under 5MB.");
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
  });

  const analyzeImage = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Analysis failed due to server error");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      {/* Header */}
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
            <p className="text-sm font-medium text-gray-500">Intelligent Disease Diagnostics</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Upload */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 flex flex-col gap-6"
        >
          <div className="glass-card rounded-[2rem] p-8">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-brand-500" />
              Upload Specimen
            </h2>

            <div
              {...getRootProps()}
              className={`
                relative w-full h-80 rounded-[1.5rem] border-2 border-dashed transition-all duration-300 overflow-hidden cursor-pointer
                flex flex-col items-center justify-center p-6 text-center
                ${isDragActive ? 'border-brand-500 bg-brand-500/10 scale-[1.02]' : 'border-gray-300 hover:border-brand-400 bg-white/40 hover:bg-white/60'}
                ${preview ? 'border-transparent p-0' : ''}
              `}
            >
              <input {...getInputProps()} />

              {preview ? (
                <div className="w-full h-full relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Plant Specimen" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <p className="text-white font-medium flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" /> Change Image
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-brand-600 mb-2">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-700 text-lg">Drag & drop image here</p>
                    <p className="text-sm text-gray-500">or click to browse files</p>
                  </div>
                  <p className="text-xs text-gray-400 font-medium bg-white/50 px-3 py-1 rounded-full">Supports JPG, PNG (Max 5MB)</p>
                </div>
              )}
            </div>

            <button
              onClick={preview ? (result ? reset : analyzeImage) : undefined}
              disabled={!preview || loading}
              className={`
                w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl flex items-center justify-center gap-2
                ${!preview ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : ''}
                ${preview && !loading && !result ? 'bg-brand-600 text-white hover:bg-brand-700 hover:-translate-y-1 hover:shadow-brand-500/30' : ''}
                ${loading ? 'bg-brand-500 text-white cursor-wait relative overflow-hidden' : ''}
                ${result ? 'bg-gray-800 text-white hover:bg-gray-900 hover:-translate-y-1' : ''}
              `}
            >
              {loading && (
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
              )}
              {loading ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Deep Analyzing...</>
              ) : result ? (
                <><RefreshCw className="w-5 h-5" /> Analyze New Plant</>
              ) : (
                <><Activity className="w-5 h-5" /> Execute Diagnostics</>
              )}
            </button>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-start gap-3 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7"
        >
          <AnimatePresence mode="popLayout">
            {!result && !loading ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full min-h-[400px] glass-card rounded-[2rem] flex flex-col items-center justify-center p-8 text-center border-dashed"
              >
                <div className="w-20 h-20 bg-white/60 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Hexagon className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">Awaiting Specimen</h3>
                <p className="text-gray-500 max-w-sm">Upload a clear photo of the leaf to receive a comprehensive health diagnostic.</p>
              </motion.div>
            ) : loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full min-h-[400px] glass-card rounded-[2rem] flex flex-col items-center justify-center p-8"
              >
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                  <Leaf className="w-8 h-8 text-brand-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 animate-pulse">Running Neural Networks</h3>
                <p className="text-sm text-gray-500 mt-2">MobileNetV2 analyzing 38 parameters...</p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full glass-card rounded-[2rem] p-8 overflow-hidden relative"
              >
                {/* Decorative background glow based on result (green for healthy, orange/red for disease) */}
                <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000 ${result.prediction.toLowerCase().includes('healthy') ? 'bg-green-500' : 'bg-orange-500'}`} />

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 border border-white/80 text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" /> Diagnosis Complete
                    </span>
                    <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">
                      {result.prediction}
                    </h2>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-brand-600 tracking-tighter">
                      {(result.confidence * 100).toFixed(1)}<span className="text-xl text-brand-400">%</span>
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Confidence</div>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="space-y-4 relative z-10">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/60 p-5 rounded-2xl border border-white shadow-sm">
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" /> Description
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{result.description}</p>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-orange-50/60 p-5 rounded-2xl border border-orange-100 shadow-sm">
                    <h4 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" /> Potential Causes
                    </h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{result.causes}</p>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 shadow-sm">
                    <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-emerald-500" /> Recommended Treatment
                    </h4>
                    <p className="text-gray-700 text-sm leading-relaxed font-medium">{result.treatment}</p>
                  </motion.div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* About Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full mt-12 mb-8"
      >
        <div className="glass-card rounded-[2rem] p-8 lg:p-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
            <Activity className="w-6 h-6 text-brand-500" />
            About PlantCare Pro
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-600 leading-relaxed mb-10">
            <div>
              <p className="mb-4">
                PlantCare Pro is an advanced diagnostic ecosystem designed to help farmers, gardeners, and home plant enthusiasts instantly identify diseases damaging their crops.
                By uploading a simple photograph of a deteriorating leaf, our system rapidly cross-references visual symptoms against a massive, comprehensive database encompassing 38 distinct plant conditions.
              </p>
              <p>
                Every diagnosis comes packed with highly actionable, educational insights so you can take the exact correct steps to save your plants, reduce crop loss, and maximize green yields organically.
              </p>
            </div>
            <div className="bg-white/40 p-6 rounded-2xl border border-white/50 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3 text-lg">Key Software Features:</h3>
              <ul className="list-disc list-inside space-y-2 ml-2 font-medium text-gray-700">
                <li><span className="text-brand-600 font-bold">Instant</span> multi-class disease identification</li>
                <li>Detailed pathological descriptions of symptoms</li>
                <li>Comprehensive breakdown of spread factors & causes</li>
                <li>Actionable recommended treatments <span className="text-gray-400 text-sm">(Organic & Applied)</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200/50 flex flex-col items-center justify-center gap-4">
            <p className="text-base font-bold text-gray-800 tracking-wide bg-gradient-to-r from-emerald-100 to-teal-50 px-6 py-2 rounded-full shadow-sm border border-emerald-100">
              Made with ❤️ by <span className="text-brand-600 text-lg">Anurag Pathak</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
