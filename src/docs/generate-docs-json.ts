import fs from 'fs';
import path from 'path';

import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

import { configs } from '../configs';

import { docsRegistry } from './docs-registry';

export async function generateDocsJson() {
  // Generate docs
  const generator = new OpenApiGeneratorV3(docsRegistry.definitions);
  const docs = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: configs.app.name,
      version: configs.app.version,
      description: configs.app.description,
    },
  });

  // Write docs to /public/docs.json (overwrites)
  fs.writeFileSync(path.join(__dirname, '../../public/docs.json'), JSON.stringify(docs, null, 2), {
    flag: 'w',
    encoding: 'utf8',
  });
}
