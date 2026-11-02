import { Injectable } from '@nestjs/common';
import { SnapshotsService } from '@tet/backend/referentiels/snapshots/snapshots.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import {
  CollectiviteAccessError,
  CollectiviteAccessService,
} from '../shared/collectivite-access.service';

export const getReferentielScoresInputSchema = z.object({
  collectiviteId: z
    .number()
    .int()
    .positive()
    .describe('Identifiant TeT de la collectivité'),
  referentielId: z
    .enum(['cae', 'eci', 'te'])
    .describe(
      'cae (Climat-Air-Énergie), eci (Économie circulaire), te (Transition écologique)'
    ),
});
export type GetReferentielScoresInput = z.infer<
  typeof getReferentielScoresInputSchema
>;

export const getReferentielScoresOutputSchema = z.object({
  referentielId: z.string(),
  referentielVersion: z.string().nullable(),
  calculeLe: z.string(),
  pointFait: z.number(),
  pointProgramme: z.number(),
  pointPasFait: z.number(),
  pointPotentiel: z.number(),
  completionPct: z
    .number()
    .nullable()
    .describe('(fait + programmé + pas fait) / potentiel × 100'),
  realisePct: z.number().nullable().describe('fait / potentiel × 100'),
  programmePct: z.number().nullable().describe('programmé / potentiel × 100'),
  etoiles: z.number().nullable(),
});
export type GetReferentielScoresOutput = z.infer<
  typeof getReferentielScoresOutputSchema
>;

const pct = (value: number, potentiel: number) =>
  potentiel > 0 ? Math.round((value / potentiel) * 1000) / 10 : null;

@Injectable()
export class GetReferentielScoresService {
  constructor(
    private readonly snapshotsService: SnapshotsService,
    private readonly collectiviteAccessService: CollectiviteAccessService
  ) {}

  async run(
    input: GetReferentielScoresInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<
    Result<
      GetReferentielScoresOutput,
      CollectiviteAccessError | 'SNAPSHOT_NOT_FOUND'
    >
  > {
    const access = await this.collectiviteAccessService.assertAllowed(
      input.collectiviteId,
      {
        public: 'referentiels.read',
        confidentiel: 'referentiels.read_confidentiel',
      },
      user
    );
    if (!access.success) {
      return access;
    }

    const snapshot = await this.snapshotsService.getCurrent(
      input.collectiviteId,
      input.referentielId,
      { user }
    );
    if (!snapshot.success) {
      return failure(
        'SNAPSHOT_NOT_FOUND',
        new Error(`Score indisponible (${snapshot.error})`)
      );
    }

    const s = snapshot.data;
    return success({
      referentielId: s.referentielId,
      referentielVersion: s.referentielVersion ?? null,
      calculeLe: s.date,
      pointFait: s.pointFait,
      pointProgramme: s.pointProgramme,
      pointPasFait: s.pointPasFait,
      pointPotentiel: s.pointPotentiel,
      completionPct: pct(
        s.pointFait + s.pointProgramme + s.pointPasFait,
        s.pointPotentiel
      ),
      realisePct: pct(s.pointFait, s.pointPotentiel),
      programmePct: pct(s.pointProgramme, s.pointPotentiel),
      etoiles: s.etoiles ?? null,
    });
  }
}
