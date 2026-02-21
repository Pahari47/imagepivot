/**
 * Audio feature components registry
 * Import and register all audio feature configs here
 */

// Register trim feature
import { registerTrimFeature } from './trim/register';
// Register convert feature
import { registerConvertFeature } from './convert/register';
// Register compress feature
import { registerCompressFeature } from './compress/register';
// Register normalize feature
import { registerNormalizeFeature } from './normalize/register';
// Register metadata feature
import { registerMetadataFeature } from './metadata/register';

// Initialize all audio features
export function registerAudioFeatures(): void {
  registerTrimFeature();
  registerConvertFeature();
  registerCompressFeature();
  registerNormalizeFeature();
  registerMetadataFeature();
  
  // Add more features here as they're created:
  // etc.
}

// Auto-register on import
registerAudioFeatures();

