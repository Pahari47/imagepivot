/**
 * Base interface for all feature configurations
 * Each feature config component must implement this interface
 */
export interface FeatureConfig {
  // The config data (feature-specific shape)
  config: Record<string, unknown>;
  
  // Validation function - returns error message if invalid, null if valid
  validate: () => string | null;
  
  // Build params object for API - converts config to API format
  buildParams: () => Record<string, unknown>;
}

/**
 * Props that all feature config components receive
 */
export interface FeatureConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  selectedFile?: File | null;
}

/**
 * Props for feature config page (full page layout)
 */
export interface FeatureConfigPageProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  selectedFile: File;
  onRemoveFile: () => void;
  onProcess: () => void;
  error?: string | null;
}

/**
 * Feature handler interface - defines how each feature works
 */
export interface FeatureHandler {
  // Default config for this feature
  defaultConfig: Record<string, unknown>;
  
  // Validation function
  validate: (config: Record<string, unknown>) => string | null;
  
  // Build params for API
  buildParams: (config: Record<string, unknown>) => Record<string, unknown>;
  
  // Get API feature slug (e.g., 'resize' -> 'image.resize')
  getApiSlug: (featureSlug: string) => string;
}
