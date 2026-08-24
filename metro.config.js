const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const { FileStore } = require('metro-cache');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  cacheStores: [
    new FileStore({
      root: path.join(__dirname, '.metro-cache'),
    }),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
