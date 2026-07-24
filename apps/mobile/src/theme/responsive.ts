import { Platform, StatusBar, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const isAndroid = Platform.OS === "android";
export const isIOS = Platform.OS === "ios";
export const isWeb = Platform.OS === "web";

// Altura real da barra de status no Android ou valor padrão no iOS/Web
export const statusBarHeight = isAndroid ? (StatusBar.currentHeight || 24) : isIOS ? 44 : 0;

// Inset inferior para evitar colisão com a barra de gestos/botões do Android (soft keys)
export const bottomInset = isAndroid ? 28 : isIOS ? 20 : 0;

export const windowWidth = width;
export const windowHeight = height;

export const getResponsivePaddingTop = (base: number = 16): number => {
  return statusBarHeight + base;
};

export const getResponsivePaddingBottom = (base: number = 16): number => {
  return bottomInset + base;
};
