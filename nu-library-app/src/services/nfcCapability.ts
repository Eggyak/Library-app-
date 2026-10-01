export function isNfcFeatureAvailable(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext && 'NDEFReader' in window;
}