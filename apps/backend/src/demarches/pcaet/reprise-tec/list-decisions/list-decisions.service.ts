import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { listExemples } from '../shared/dossier-ref';
import { DossiersRecetteRepository } from '../shared/dossiers-recette.repository';
import { DECISIONS } from './decisions.rules';
import {
  ListDecisionsError,
  ListDecisionsErrorEnum,
} from './list-decisions.errors';
import { Decisions } from './list-decisions.output';

const NOMBRE_EXEMPLES = 3;

@Injectable()
export class ListDecisionsService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly dossiersRecetteRepository: DossiersRecetteRepository
  ) {}

  async listDecisions({
    user,
    tx,
  }: ServiceSecondArg): Promise<Result<Decisions, ListDecisionsError>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['UTILS.BACKOFFICE.READ'],
      ResourceType.PLATEFORME,
      null,
      tx
    );
    if (!permissionResult.success) {
      return failure(ListDecisionsErrorEnum.UNAUTHORIZED);
    }

    const dossiersResult = await this.dossiersRecetteRepository.listDossiers(
      tx
    );
    if (!dossiersResult.success) {
      return failure(dossiersResult.error);
    }
    const ecartsResult =
      await this.dossiersRecetteRepository.listEcartsDesDossiersRepris(tx);
    if (!ecartsResult.success) {
      return failure(ecartsResult.error);
    }
    const dossierParId = new Map(
      dossiersResult.data.map((d) => [d.tecDossierId, d])
    );

    return success(
      DECISIONS.map(({ code, sections, etat, critere }) => {
        if (critere.type === 'dossier') {
          const concernes = dossiersResult.data.filter(critere.estConcerne);
          return {
            code,
            sections,
            etat,
            nombreDossiers: concernes.length,
            nombreLignes: null,
            exemples: listExemples(concernes, NOMBRE_EXEMPLES),
          };
        }
        const ecarts = ecartsResult.data.filter(critere.estConcerne);
        const ids = [...new Set(ecarts.map((e) => e.tecDossierId))];
        return {
          code,
          sections,
          etat,
          nombreDossiers: ids.length,
          nombreLignes: ecarts.reduce((n, e) => n + e.nombre, 0),
          exemples: listExemples(
            ids.flatMap((id) => dossierParId.get(id) ?? []),
            NOMBRE_EXEMPLES
          ),
        };
      })
    );
  }
}
