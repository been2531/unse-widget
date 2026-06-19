const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// @shopify/react-native-skia의 package.json 'react-native' 필드가 src/index.ts를 가리키지만
// src/ 내 파일들이 정상 존재함. lib/module/ 사용 시 codegen이 타입 없는 컴파일 JS를 처리 못함.
// src/index.ts로 리다이렉트 → TypeScript 타입이 있어 codegen 정상 작동.
const SKIA_SRC = path.resolve(
  __dirname,
  'node_modules/@shopify/react-native-skia/src/index.ts',
);

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@shopify/react-native-skia') {
    return { filePath: SKIA_SRC, type: 'sourceFile' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
