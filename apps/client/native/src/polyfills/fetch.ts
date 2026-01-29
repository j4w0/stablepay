import { fetch } from '@tauri-apps/plugin-http';

globalThis.fetch = fetch as any as typeof globalThis.fetch;
