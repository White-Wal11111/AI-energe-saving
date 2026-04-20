// 环境检测和配置工具
import { config as devConfig } from '../config/development';
import { config as prodConfig } from '../config/production';

// 判断当前环境
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// 获取当前环境的配置
export const getConfig = () => {
  return isProduction ? prodConfig : devConfig;
};

// 获取API基础URL
export const getApiBaseUrl = () => {
  return getConfig().apiBaseUrl;
};

// 获取上传基础URL
export const getUploadsBaseUrl = () => {
  return getConfig().uploadsBaseUrl;
};