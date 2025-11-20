import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import z from 'zod';
import { getReferentielDefinitionOutputSchema } from './get-referentiel-definition.output';
import { GetReferentielDefinitionService } from './get-referentiel-definition.service';

export const inputSchema = z.object({
  referentielId: referentielIdEnumSchema,
});

@Injectable()
export class GetReferentielDefinitionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getReferentielDefinitionService: GetReferentielDefinitionService
  ) {}

  router = this.trpc.router({
    get: this.trpc.publicProcedure
      .input(inputSchema)
      .output(getReferentielDefinitionOutputSchema)
      .query(async ({ input: { referentielId } }) => {
        return this.getReferentielDefinitionService.getReferentielDefinition(
          referentielId
        );
      }),
  });
}
