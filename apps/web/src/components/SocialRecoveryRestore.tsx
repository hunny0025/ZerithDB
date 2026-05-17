"use client";

import { useState } from "react";
import { KeyRound, ShieldAlert, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthManager } from "zerithdb-auth";

interface SocialRecoveryRestoreProps {
  authManager: AuthManager;
  onRecovered?: () => void;
}

export default function SocialRecoveryRestore({ authManager, onRecovered }: SocialRecoveryRestoreProps) {
  const [shards, setShards] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRecover = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const validShards = shards.filter(s => s.trim().length > 0);
      if (validShards.length < 2) {
        throw new Error("Please provide at least 2 shards to attempt recovery.");
      }
      
      await authManager.recoverIdentity(validShards);
      setSuccess(true);
      if (onRecovered) {
        setTimeout(onRecovered, 2000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Recovery failed. Invalid shards or insufficient threshold.");
    } finally {
      setLoading(false);
    }
  };

  const updateShard = (index: number, value: string) => {
    const newShards = [...shards];
    newShards[index] = value;
    setShards(newShards);
  };

  const addShard = () => setShards([...shards, ""]);
  const removeShard = (index: number) => {
    if (shards.length > 2) {
      setShards(shards.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Restore Identity</h2>
          <p className="text-sm text-gray-500">Recover your master key using your saved shards</p>
        </div>
      </div>

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-12 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Recovery Successful</h3>
          <p className="text-gray-500">Your master key has been securely reconstructed.</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <AnimatePresence>
              {shards.map((shard, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder={`Enter Shard ${idx + 1}`}
                    value={shard}
                    onChange={(e) => updateShard(idx, e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                  />
                  {shards.length > 2 && (
                    <button
                      onClick={() => removeShard(idx)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            <button
              onClick={addShard}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add another shard
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 text-sm"
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleRecover}
            disabled={loading || shards.filter(s => s.trim().length > 0).length < 2}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reconstruct Master Key"}
          </button>
        </div>
      )}
    </div>
  );
}
