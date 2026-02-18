/**
 * Image feature components registry
 * Import and register all image feature configs here
 */

// Register resize feature
import { registerResizeFeature } from './resize/register';

// Initialize all image features
export function registerImageFeatures(): void {
  registerResizeFeature();
  
  // Add more features here as they're created:
  // registerCompressFeature();
  // registerCropFeature();
  // etc.
}

// Auto-register on import
registerImageFeatures();

