let cachedPipeline: unknown = null;

async function loadModel(modelName: string): Promise<any> {
  if (cachedPipeline) return cachedPipeline;

  try {
    const moduleName = "@huggingface/transformers";
    const { pipeline } = await import(/* @vite-ignore */ moduleName);
    const generator = await pipeline("text2text-generation", modelName);
    cachedPipeline = generator;
    return generator;
  } catch {
    throw new Error(
      "Transformers.js not available. Install it: npm install @huggingface/transformers"
    );
  }
}

export { loadModel };