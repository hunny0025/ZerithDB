"use client";

import { useState } from "react";
import { ShieldCheck, Copy, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthManager } from "zerithdb-auth";

interface SocialRecoverySetupProps {
  authManager: InstanceType<typeof AuthManager>;
}

export default function SocialRecoverySetup({ authManager }: SocialRecoverySetupProps) {
  const [total, setTotal] = useState(5);
  const [threshold, setThreshold] = useState(3);
  const [shards, setShards] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      if (threshold > total) {
        throw new Error("Threshold cannot be greater than total shards.");
      }

      const generatedShards = await authManager.generateRecoveryShards(threshold, total);
      setShards(generatedShards);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate shards");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (shard: string, index: number) => {
    navigator.clipboard.writeText(shard);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Social Recovery Setup</h2>
          <p className="text-sm text-gray-500">
            Split your master key using Shamir&apos;s Secret Sharing
          </p>
        </div>
      </div>

      {!shards ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Shards</label>
              <input
                type="number"
                min="2"
                max="10"
                value={total}
                onChange={(e) => setTotal(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Threshold (Minimum to recover)
              </label>
              <input
                type="number"
                min="2"
                max={total}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate Shards"}
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm border border-yellow-200 mb-6">
            <p className="font-semibold mb-1">Important: Distribute these shards securely.</p>
            <p>
              You will need at least {threshold} of these {total} shards to recover your identity.
              Do not store them all in the same place.
            </p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {shards.map((shard, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-1">Shard {idx + 1}</p>
                  <p className="text-sm font-mono text-gray-800 truncate">{shard}</p>
                </div>
                <button
                  onClick={() => handleCopy(shard, idx)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                  title="Copy Shard"
                >
                  {copiedIndex === idx ? (
                    <span className="text-xs font-medium text-blue-600 px-2 py-1 bg-blue-100 rounded-md">
                      Copied!
                    </span>
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setShards(null);
              setTotal(5);
              setThreshold(3);
            }}
            className="w-full py-3 mt-4 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-colors"
          >
            Start Over
          </button>
        </motion.div>
      )}
    </div>
  );
}
