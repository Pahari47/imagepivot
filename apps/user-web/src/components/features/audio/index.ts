/**
 * Audio feature components registry
 * Import and register all audio feature configs here
 */

// Register trim feature
import { registerTrimFeature } from './trim/register';
// Register convert feature
import { registerConvertFeature } from './convert/register';

// Initialize all audio features
export function registerAudioFeatures(): void {
  registerTrimFeature();
  registerConvertFeature();
  
  // Add more features here as they're created:
  // registerCompressFeature();
  // registerNormalizeFeature();
  // registerMetadataFeature();
  // etc.
}

// Auto-register on import
registerAudioFeatures();

