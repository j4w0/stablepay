import { treaty } from '@elysiajs/eden';
import type { AppType } from '@stablepay/api/src/index';

export const api = treaty<AppType>('localhost:3000');
