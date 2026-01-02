declare module '*.css';
declare module '*.scss';
declare module '*.less';

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
