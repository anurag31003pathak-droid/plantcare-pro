import { useState, useCallback } from 'react';
import axios from 'axios';
import { UploadCloud, Leaf, AlertCircle, CheckCircle2, Loader2, History, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLog, setHistoryLog] = useState([]);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setPrediction(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
    multiple: false
  });

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setPrediction(null);
    setError(null);
  }

  const handlePredict = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setPrediction(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "An error occurred during prediction.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryOpen(true);
    try {
      const res = await axios.get(`${API_URL}/history`);
      setHistoryLog(res.data);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-plant-green-50 via-white to-plant-green-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-plant-green-200/40 rounded-b-[100%] blur-3xl -z-10 transform -translate-y-1/2"></div>

      <header className="mb-12 text-center z-10 w-full max-w-4xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-plant-green-500 p-3 rounded-2xl shadow-lg shadow-plant-green-500/30">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">PlantCare <span className="text-plant-green-600">AI</span></h1>
        </div>

        <button
          onClick={loadHistory}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <History className="w-5 h-5 text-plant-green-600" />
          <span className="hidden sm:inline">Prediction History</span>
        </button>
      </header>

      <main className="w-full max-w-lg z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-8 transition-all"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Disease Detection</h2>
            <p className="text-gray-500 text-sm">Upload a clear photo of the plant leaf for analysis.</p>
          </div>

          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-2xl p-8 mb-6 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-plant-green-500 bg-plant-green-50' : 'border-gray-300 hover:border-plant-green-400 hover:bg-gray-50/50'
              }`}
          >
            <input {...getInputProps()} />

            <AnimatePresence mode="wait">
              {preview ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative mx-auto rounded-xl overflow-hidden shadow-default"
                >
                  <img src={preview} alt="Leaf preview" className="w-full h-64 object-cover" />
                  <button
                    onClick={clearFile}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 backdrop-blur-sm transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 py-8"
                >
                  <div className="mx-auto w-16 h-16 bg-plant-green-100 text-plant-green-600 rounded-full flex items-center justify-center">
                    <UploadCloud className="w-8 h-8 animate-float" />
                  </div>
                  <div className="text-gray-600">
                    <p className="font-semibold text-lg">Click to upload or drag & drop</p>
                    <p className="text-sm mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 mb-6 text-red-700 bg-red-50 rounded-xl border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          <button
            onClick={handlePredict}
            disabled={!file || loading}
            className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2
              ${!file || loading ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-plant-green-600 hover:bg-plant-green-700 hover:-translate-y-1 hover:shadow-plant-green-500/40'}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Analyzing Image...
              </>
            ) : (
              'Analyze Plant'
            )}
          </button>

          <AnimatePresence>
            {prediction && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }}
                className="overflow-hidden"
              >
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 text-green-600 rounded-full">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Analysis Complete</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-500 font-medium">Predicted Disease</span>
                      <span className="font-bold text-gray-900 text-right">{prediction.prediction}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Confidence Score</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-plant-green-600">{(prediction.confidence * 100).toFixed(1)}%</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-plant-green-500 transition-all duration-1000 ease-out"
                            style={{ width: `${prediction.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* History Modal Backdrop */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                  <History className="w-6 h-6 text-plant-green-600" />
                  Prediction History
                </h2>
                <button onClick={() => setHistoryOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pr-2">
                {historyLog.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">No predictions yet.</div>
                ) : (
                  <div className="space-y-4">
                    {historyLog.map(log => (
                      <div key={log.id} className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center hover:shadow-md transition-shadow bg-gray-50/50">
                        <div>
                          <p className="font-bold text-gray-900">{log.predicted_class}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{log.filename}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-plant-green-600">{(log.confidence * 100).toFixed(1)}%</p>
                          <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
