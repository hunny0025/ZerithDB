"use client";

import { useState } from "react";
import {
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthManager } from "zerithdb-auth";

interface SocialRecoveryRestoreProps {
  authManager: InstanceType<typeof AuthManager>;
  onRecovered?: () => void;
}

export default function SocialRecoveryRestore({
  authManager,
  onRecovered,
}: SocialRecoveryRestoreProps) {
  const [shards, setShards] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRecover = async () => {
    try {
      setLoading(true);
      setError(null);

      const validShards = shards.filter((s) => s.trim().length > 0);

      if (validShards.length < 2) {
        throw new Error("Please provide at least 2 shards to attempt recovery.");
      }

      await authManager.recoverIdentity(validShards);

      setSuccess(true);

      if (onRecovered) {
        setTimeout(onRecovered, 2000);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Recovery failed. Invalid shards or insufficient threshold."
      );
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
    <div className="w-full max-w-xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 rounded-xl flex items-center justify-center transition-colors duration-300">
          <KeyRound className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
            Restore Identity
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
            Recover your master key using your saved shards
          </p>
        </div>
      </div>

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-12 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-300 rounded-full flex items-center justify-center mb-4 transition-colors duration-300">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
            Recovery Successful
          </h3>

          <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">
            Your master key has been securely reconstructed.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Input Shards */}
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
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 font-mono text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />

                  {shards.length > 2 && (
                    <button
                      onClick={() => removeShard(idx)}
                      className="p-3 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors duration-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add Shard Button */}
            <button
              onClick={addShard}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors duration-300"
            >
              <Plus className="w-4 h-4" />
              Add another shard
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-100 dark:border-red-900 rounded-xl flex items-start gap-3 text-sm transition-colors duration-300"
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            onClick={handleRecover}
            disabled={loading || shards.filter((s) => s.trim().length > 0).length < 2}
            className="w-full py-3 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white dark:text-black rounded-xl font-medium transition-colors duration-300 flex justify-center items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Reconstruct Master Key"
            )}
          </button>
        </div>
      )}
    </div>
  );
}