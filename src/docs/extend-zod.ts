import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

/**
 * Extends `zod` object to support OpenAPI (`z.xxx.openapi({...})`)
 * ⚠️ Import this at the top of the main application file
 */
extendZodWithOpenApi(z);
