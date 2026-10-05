// Usage (après build du backend) : node apps/backend/dist/plans/fiches/migrations/backfill-fiche-secteurs/backfill-fiche-secteurs.js [--collectivite=<id>] [--confirm]
import { INestApplicationContext, Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CommunsSecteursApiService } from '@tet/backend/plans/fiches/fiche-secteurs/communs-secteurs-api.service';
import { CompleteFicheSecteursService } from '@tet/backend/plans/fiches/fiche-secteurs/complete-fiche-secteurs.service';
import { FicheSecteursAttributionRepository } from '@tet/backend/plans/fiches/fiche-secteurs/fiche-secteurs-attribution.repository';
import { FicheSecteursEligibiliteRepository } from '@tet/backend/plans/fiches/fiche-secteurs/fiche-secteurs-eligibilite.repository';
import { ConfigurationModule } from '@tet/backend/utils/config/configuration.module';
import { DatabaseModule } from '@tet/backend/utils/database/database.module';
import { getErrorMessage } from '@tet/domain/utils';
import { setTimeout } from 'node:timers/promises';

const SCRIPT_NAME = 'backfill-fiche-secteurs';
const BATCH_SIZE = 100;
const COMMUNS_REQUESTS_PER_MINUTE = 500;
const MAX_COMMUNS_REQUESTS_PER_FICHE = 2;
const MIN_INTERVAL_MS =
  (60_000 * MAX_COMMUNS_REQUESTS_PER_FICHE) / COMMUNS_REQUESTS_PER_MINUTE;

const logger = new Logger(SCRIPT_NAME);

@Module({
  imports: [ConfigurationModule, DatabaseModule],
  providers: [
    CommunsSecteursApiService,
    FicheSecteursAttributionRepository,
    FicheSecteursEligibiliteRepository,
    CompleteFicheSecteursService,
  ],
})
export class BackfillFicheSecteursModule {}

export type BackfillFicheSecteursResult = {
  toProcess: number;
  attribuees: number;
  nonAttribuables: number;
  enCoursDeCalcul: number;
  indisponibles: number;
  failed: number;
};

export async function runBackfillFicheSecteurs(
  app: INestApplicationContext,
  {
    confirm,
    collectiviteId,
    intervalMs = MIN_INTERVAL_MS,
  }: { confirm: boolean; collectiviteId?: number; intervalMs?: number }
): Promise<BackfillFicheSecteursResult> {
  const eligibilite = app.get(FicheSecteursEligibiliteRepository);
  const completeFicheSecteurs = app.get(CompleteFicheSecteursService);
  const result: BackfillFicheSecteursResult = {
    toProcess: 0,
    attribuees: 0,
    nonAttribuables: 0,
    enCoursDeCalcul: 0,
    indisponibles: 0,
    failed: 0,
  };

  let afterFicheId = 0;
  for (;;) {
    const ficheIds = await eligibilite.listFichesConcerneesSansAttribution({
      afterFicheId,
      limit: BATCH_SIZE,
      collectiviteId,
    });
    if (ficheIds.length === 0) {
      break;
    }
    afterFicheId = ficheIds[ficheIds.length - 1];
    result.toProcess += ficheIds.length;
    if (!confirm) {
      continue;
    }

    for (const ficheId of ficheIds) {
      const startedAt = Date.now();
      const secteurs = await completeFicheSecteurs.completeSecteurs(ficheId);
      if (!secteurs.success) {
        result.failed++;
      } else if (secteurs.data.etat === 'attribue') {
        result.attribuees++;
      } else if (secteurs.data.etat === 'non_attribuable') {
        result.nonAttribuables++;
      } else if (secteurs.data.etat === 'a_renseigner') {
        result.indisponibles++;
      } else {
        result.enCoursDeCalcul++;
      }
      await setTimeout(Math.max(0, intervalMs - (Date.now() - startedAt)));
    }
    logger.log(
      `${result.toProcess} fiches traitées (jusqu'à l'id ${afterFicheId})`
    );
  }

  return result;
}

const parseArgs = (argv: string[]) => {
  const collectivite = argv
    .find((arg) => arg.startsWith('--collectivite='))
    ?.split('=')[1];
  const collectiviteId =
    collectivite === undefined ? undefined : Number(collectivite);
  if (
    collectiviteId !== undefined &&
    !(Number.isInteger(collectiviteId) && collectiviteId > 0)
  ) {
    throw new Error(`--collectivite invalide : ${collectivite}`);
  }
  return { confirm: argv.includes('--confirm'), collectiviteId };
};

async function main() {
  const { confirm, collectiviteId } = parseArgs(process.argv.slice(2));
  logger.log(
    `${confirm ? 'Écriture' : 'À blanc (ajouter --confirm pour écrire)'}${
      collectiviteId === undefined ? '' : `, collectivité ${collectiviteId}`
    }`
  );

  const app = await NestFactory.createApplicationContext(
    BackfillFicheSecteursModule
  );
  try {
    const result = await runBackfillFicheSecteurs(app, {
      confirm,
      collectiviteId,
    });
    if (!confirm) {
      const minutes = Math.ceil((result.toProcess * MIN_INTERVAL_MS) / 60_000);
      logger.log(
        `${result.toProcess} fiches concernées sans attribution, durée estimée avec --confirm : ${minutes} min au plus`
      );
      return;
    }
    logger.log(
      [
        `${result.toProcess} fiches traitées`,
        `${result.attribuees} attribuées`,
        `${result.nonAttribuables} non attribuables`,
        `${result.enCoursDeCalcul} en cours de calcul`,
        `${result.indisponibles} indisponibles (404)`,
        `${result.failed} en erreur`,
      ].join(', ')
    );
  } finally {
    await app.close();
  }
}

if (process.argv[1]?.includes(SCRIPT_NAME)) {
  main().catch((error: unknown) => {
    logger.error(`Échec : ${getErrorMessage(error)}`);
    process.exitCode = 1;
  });
}
