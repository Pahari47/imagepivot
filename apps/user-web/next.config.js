//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');
const path = require('path');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  output: 'standalone', // Required for Docker
  webpack: (config, { isServer }) => {
    // Add alias for shared package
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@imagepivot/shared': path.resolve(__dirname, '../../packages/shared/src'),
      };
    }
    return config;
  },
};

// Try a simpler plugin composition
const plugins = [withNx];

module.exports = composePlugins(...plugins)(nextConfig);
