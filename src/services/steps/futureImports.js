// Stub module for future health-platform integrations. Each function returns
// a normalized [{ date: 'YYYY-MM-DD', steps: number }] array that can be fed
// straight into saveStepLog() in a loop. Not implemented — see TODO sources.

export const STEP_IMPORT_SOURCES = {
  HEALTHKIT: 'healthkit',
  GOOGLE_FIT: 'google_fit',
  WEAROS: 'wearos',
  MANUAL: 'manual',
}

export async function importFromHealthKit() {
  throw new Error('HealthKit import not implemented')
}

export async function importFromGoogleFit() {
  throw new Error('Google Fit import not implemented')
}

export async function importFromWearable() {
  throw new Error('Wearable import not implemented')
}

export function isImportSourceAvailable() {
  return false
}
