/**
 * Image feature components registry
 * Import and register all image feature configs here
 */

// Register resize feature
import { registerResizeFeature } from './resize/register';
// Register compress feature
import { registerCompressFeature } from './compress/register';
// Register convert feature
import { registerConvertFeature } from './convert/register';
// Register convert-jpg feature
import { registerConvertJpgFeature } from './convert-jpg/register';
// Register quality feature
import { registerQualityFeature } from './quality/register';

// Initialize all image features
export function registerImageFeatures(): void {
  registerResizeFeature();
  registerCompressFeature();
  registerConvertFeature();
  registerConvertJpgFeature();
  registerQualityFeature();
  
  // Add more features here as they're created:
  // registerCropFeature();
  // etc.
}

// Auto-register on import
registerImageFeatures();

