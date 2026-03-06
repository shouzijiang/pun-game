// API 基础地址：开发时用 .env.development，打包时用 .env.production
// 仅本机改开发地址可新建 .env.local 写 VITE_API_BASE_URL=xxx（已被 gitignore）
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sofun.online'
