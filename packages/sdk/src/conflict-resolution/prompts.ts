export const MERGE_PROMPT = (
  collectionName: string,
  localText: string,
  remoteText: string
) => `Two users edited the same text passage in the "${collectionName}" collection at the same time.
Version A: "${localText.trim()}"
Version B: "${remoteText.trim()}"
Produce a merged version that preserves the intent of both edits.
Return your answer in this exact format:
MERGED: <merged text>
EXPLANATION: <brief reason>`;

export function parseLLMOutput(output: string): { merged: string; explanation: string } | null {
  const mergeMatch = output.match(/MERGED:\s*([\s\S]*?)(?=\n\s*EXPLANATION:|$)/);
  const explanationMatch = output.match(/EXPLANATION:\s*([\s\S]*?)(?=\n|$)/);

  if (!mergeMatch) return null;

  return {
    merged: mergeMatch[1]?.trim() ?? "",
    explanation: explanationMatch?.[1]?.trim() ?? "No explanation provided",
  };
}