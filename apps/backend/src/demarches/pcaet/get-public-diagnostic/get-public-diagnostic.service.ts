import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { PcaetDiagnostic } from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetPublicAccessService } from '../shared/demarche-pcaet-public-access.service';
import {
  GetPublicDiagnosticError,
  GetPublicDiagnosticErrorEnum,
} from './get-public-diagnostic.errors';
import { GetPublicDiagnosticInput } from './get-public-diagnostic.input';

/**
 * Le diagnostic d'une démarche PCAET publique.
 *
 * Ses valeurs viennent de la seule source PCAET de la démarche : la règle de
 * confidentialité des indicateurs, qui ne masque que le dernier résultat de la
 * source collectivité, n'a rien à y retirer. Reste la lecture des valeurs,
 * exigée comme sur le chemin de la déposante.
 */
@Injectable()
export class GetPublicDiagnosticService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly publicAccessService: DemarchePcaetPublicAccessService,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  async getPublicDiagnostic(
    { demarcheId, collectiviteId }: GetPublicDiagnosticInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetDiagnostic, GetPublicDiagnosticError>> {
    const accessResult = await this.publicAccessService.canReadDemarche(
      { demarcheId, collectiviteId },
      { user, tx }
    );
    if (!accessResult.success) {
      return failure(GetPublicDiagnosticErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
    }

    const valeursResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.VALEURS.READ'],
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!valeursResult.success) {
      return failure(GetPublicDiagnosticErrorEnum.UNAUTHORIZED);
    }

    return success(
      await this.diagnosticService.loadPayload(
        { demarcheId, collectiviteId },
        tx
      )
    );
  }
}
