import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const isExpoGo = Constants.executionEnvironment === 'storeClient';

export const isWeb = Platform.OS === 'web';

export const hasNativeModules = !isExpoGo && !isWeb;

export const runtimeName = isExpoGo ? 'expo-go' : isWeb ? 'web' : 'dev-client';
