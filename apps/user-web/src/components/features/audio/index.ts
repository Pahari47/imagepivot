/**
 * Audio feature components registry
 * Import and register all audio feature configs here
 */

// Register trim feature
import { registerTrimFeature } from './trim/register';

// Initialize all audio features
export function registerAudioFeatures(): void {
  registerTrimFeature();
  
  // Add more features here as they're created:
  // registerCompressFeature();
  // registerConvertFeature();
  // etc.
}

// Auto-register on import
registerAudioFeatures();

