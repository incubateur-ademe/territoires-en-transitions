import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { electrificationDataKindSchema } from '../publish-electrification-data/publish-electrification-data.input';
import { SyncElectrificationDataModule } from './sync-electrification-data.module';
import { SyncElectrificationDataService } from './sync-electrification-data.service';

const logger = new Logger('sync-electrification-data.script');
const usage = `Usage : sync-electrification-data.script.js
  --kind <catalogue|laureats> --mode <verify|publish>
  --actor <opérateur> --run-url <url GitHub Actions>

Lit Grist et vérifie les références dans la base cible. verify ne publie rien.
Aucun import de plan, appel IA ou modification de Grist.`;

async function main() {
  const { values } = parseArgs({
    options: {
      kind: { type: 'string' },
      mode: { type: 'string', default: 'verify' },
      actor: { type: 'string' },
      'run-url': { type: 'string' },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) {
    process.stdout.write(`${usage}\n`);
    return;
  }
  const mode = z.enum(['verify', 'publish']).parse(values.mode);
  const actor = z
    .string()
    .regex(/^[a-zA-Z0-9_-]+(?:\[bot\])?$/)
    .parse(values.actor);
  const workflowRun = z
    .url()
    .regex(/^https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/runs\/\d+$/)
    .parse(values['run-url']);
  const kind = electrificationDataKindSchema.parse(values.kind);
  const app = await NestFactory.createApplicationContext(
    SyncElectrificationDataModule
  );
  try {
    const result = await app
      .get(SyncElectrificationDataService)
      .sync(kind, mode === 'publish', {
        publishedBy: `github:${actor}`,
        workflowRun,
      });
    if (!result.success) {
      // Les payloads et contacts privés de Grist ne doivent pas apparaître dans les logs publics.
      logger.error(
        `Synchronisation refusée : ${result.error}. Consulter le guide de publication.`
      );
      process.exitCode = 1;
      return;
    }
    logger.log(JSON.stringify(result.data));
  } finally {
    await app.close();
  }
}

main().catch(() => {
  logger.error(
    'Commande impossible : vérifier les arguments (--help), les accès Grist et les secrets de l’environnement cible.'
  );
  process.exitCode = 1;
});
