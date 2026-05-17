export interface SignableAuthManager {
  sign(payload: string): Promise<string>;
}

export async function signAuditEvent(
  hash: string,
  authManager: SignableAuthManager
): Promise<string> {
  return authManager.sign(hash);
}
