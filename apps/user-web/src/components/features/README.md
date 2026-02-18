# Feature Configuration System

This directory contains feature-specific configuration components organized by media type.

## Architecture

The feature system uses a **registry pattern** to dynamically load and handle different features:

1. **Feature Registry** (`lib/features/feature-registry.ts`): Central registry that maps feature slugs to handlers
2. **Feature Handlers**: Each feature defines a handler with validation, param building, and default config
3. **Feature Config Components**: UI components for each feature's configuration
4. **Feature Config Loader**: Dynamically loads the appropriate config component based on feature slug

## Directory Structure

```
components/features/
├── image/
│   ├── resize/
│   │   ├── ImageResizeConfig.tsx  # Config UI component
│   │   ├── register.ts             # Feature handler registration
│   │   └── index.ts                # Exports
│   ├── FeatureConfigLoader.tsx     # Dynamic component loader
│   └── index.ts                    # Auto-registers all image features
├── audio/
│   └── ... (similar structure)
└── video/
    └── ... (similar structure)
```

## Adding a New Feature

### Step 1: Create Feature Directory

Create a new directory for your feature:
```bash
apps/user-web/src/components/features/image/compress/
```

### Step 2: Create Config Component

Create `ImageCompressConfig.tsx`:

```tsx
'use client';

import { FeatureConfigProps } from '../../../../lib/features/types';

export interface CompressConfig {
  quality: number;
  format?: string;
}

export function ImageCompressConfig({ config, onChange }: FeatureConfigProps) {
  const compressConfig = config as CompressConfig;
  
  // Your UI implementation here
  return (
    <div>
      {/* Your form fields */}
    </div>
  );
}
```

### Step 3: Create Registration File

Create `register.ts`:

```tsx
import { registerFeatureHandler } from '../../../../lib/features/feature-registry';
import { FeatureHandler } from '../../../../lib/features/types';
import { CompressConfig } from './ImageCompressConfig';

export function registerCompressFeature(): void {
  const handler: FeatureHandler = {
    defaultConfig: {
      quality: 80,
    } as CompressConfig,

    validate: (config: Record<string, unknown>): string | null => {
      const compressConfig = config as CompressConfig;
      if (!compressConfig.quality || compressConfig.quality < 1 || compressConfig.quality > 100) {
        return 'Quality must be between 1 and 100';
      }
      return null;
    },

    buildParams: (config: Record<string, unknown>): Record<string, unknown> => {
      const compressConfig = config as CompressConfig;
      return {
        quality: compressConfig.quality,
        format: compressConfig.format,
      };
    },

    getApiSlug: (featureSlug: string): string => {
      return `image.${featureSlug}`;
    },
  };

  registerFeatureHandler('compress', handler);
}
```

### Step 4: Create Index File

Create `index.ts`:

```tsx
export { ImageCompressConfig } from './ImageCompressConfig';
export { registerCompressFeature } from './register';
export type { CompressConfig } from './ImageCompressConfig';
```

### Step 5: Register in Feature Loader

Update `components/features/image/FeatureConfigLoader.tsx`:

```tsx
import { ImageCompressConfig } from './compress/ImageCompressConfig';

export function FeatureConfigLoader({ featureSlug, ...props }: FeatureConfigLoaderProps) {
  switch (featureSlug) {
    case 'resize':
      return <ImageResizeConfig {...props} />;
    case 'compress':
      return <ImageCompressConfig {...props} />;
    // ... more cases
  }
}
```

### Step 6: Auto-Register

Update `components/features/image/index.ts`:

```tsx
import { registerCompressFeature } from './compress/register';

export function registerImageFeatures(): void {
  registerResizeFeature();
  registerCompressFeature(); // Add this
}
```

## Feature Handler Interface

Each feature handler must implement:

```typescript
interface FeatureHandler {
  defaultConfig: Record<string, unknown>;  // Default config values
  validate: (config: Record<string, unknown>) => string | null;  // Validation logic
  buildParams: (config: Record<string, unknown>) => Record<string, unknown>;  // Convert to API format
  getApiSlug: (featureSlug: string) => string;  // Get API feature slug
}
```

## Benefits

✅ **Scalable**: Easy to add new features without modifying existing code  
✅ **Type-safe**: TypeScript ensures consistency  
✅ **Maintainable**: Each feature is self-contained  
✅ **Testable**: Features can be tested in isolation  
✅ **Flexible**: Each feature can have completely different UI and logic

