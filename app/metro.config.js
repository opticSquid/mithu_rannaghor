const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname);
 
module.exports = withNativeWind(config, { input: './stylesheets/global.css', inlineRem: 16 });