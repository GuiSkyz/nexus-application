module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // O plugin do Reanimated deve permanecer por último.
      'react-native-reanimated/plugin',
    ],
  };
};
