import fs from "fs/promises";
import path from "path";

export async function writeFile(
  targetDir: string,
  filePath: string,
  content: string
): Promise<void> {
  const fullPath = path.join(targetDir, filePath);

  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  await fs.writeFile(fullPath, content);
}
