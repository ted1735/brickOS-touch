/**
 * Versioning Utility for brickOS Studio
 * Enforces strict incremental versioning (+0.1 per revision)
 */

export const CURRENT_STUDIO_VERSION = 'v3.1';

export function parseVersionNumber(versionStr: string): number {
  if (!versionStr) return 1.0;
  // Match "v1.4", "v2.0 (Spoken Rewrite)", "v10.5", etc.
  const match = versionStr.match(/v?(\d+(\.\d+)?)/i);
  if (match && match[1]) {
    const parsed = parseFloat(match[1]);
    return isNaN(parsed) ? 1.0 : parsed;
  }
  return 1.0;
}

/**
 * Calculates the next version string by strictly increasing by 0.1
 * Example: v1.0 -> v1.1
 * Example: v2.5 -> v2.6
 * Example: v9.9 -> v10.0
 */
export function getNextVersionString(currentVersions: Array<{ version: string }> | undefined, labelSuffix?: string): string {
  if (!currentVersions || currentVersions.length === 0) {
    return labelSuffix ? `v1.0 (${labelSuffix})` : 'v1.0';
  }

  // Find the highest version number recorded in the versions array
  let maxVer = 1.0;
  for (const v of currentVersions) {
    const num = parseVersionNumber(v.version);
    if (num > maxVer) {
      maxVer = num;
    }
  }

  // Strictly increment by 0.1, rounding to 1 decimal place to prevent floating-point anomalies
  const nextVer = (Math.round((maxVer + 0.1) * 10) / 10).toFixed(1);
  return labelSuffix ? `v${nextVer} (${labelSuffix})` : `v${nextVer}`;
}
