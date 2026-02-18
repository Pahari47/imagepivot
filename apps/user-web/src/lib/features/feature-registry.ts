import { FeatureHandler } from './types';

/**
 * Registry of all feature handlers
 * Maps feature slug (e.g., 'resize', 'compress') to their handlers
 */
const featureHandlers: Record<string, FeatureHandler> = {};

/**
 * Register a feature handler
 */
export function registerFeatureHandler(
  featureSlug: string,
  handler: FeatureHandler
): void {
  featureHandlers[featureSlug] = handler;
}

/**
 * Get a feature handler by slug
 */
export function getFeatureHandler(featureSlug: string): FeatureHandler | null {
  return featureHandlers[featureSlug] || null;
}

/**
 * Check if a feature is registered
 */
export function hasFeatureHandler(featureSlug: string): boolean {
  return featureSlug in featureHandlers;
}

/**
 * Get all registered feature slugs
 */
export function getRegisteredFeatures(): string[] {
  return Object.keys(featureHandlers);
}

