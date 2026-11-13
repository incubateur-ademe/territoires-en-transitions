import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import {
  ListDossiersInstructionError,
  ListDossiersInstructionErrorEnum,
} from '../list-dossiers-instruction/list-dossiers-instruction.errors';
import { ListDossiersInstructionRepository } from '../list-dossiers-instruction/list-dossiers-instruction.repository';
import { listDistinctDepartements } from '../list-dossiers-instruction/list-dossiers-instruction.rules';
import { ListCollectivitesSuiviesInput } from './list-collectivites-suivies.input';
import { ListCollectivitesSuiviesOutput } from './list-collectivites-suivies.output';
import { buildCollectivitesSuivies } from './list-collectivites-suivies.rules';

/**
 * Le territoire d'un service, réduit à ce qui se cherche : de quoi suggérer
 * une collectivité, un département ou une région dans sa liste d'instruction.
 *
 * Même périmètre et même droit que la liste, sans ce qui coûte : ni avis, ni
 * pilotes, ni compteurs. L'écran le charge une fois et cherche dedans à chaque
 * frappe, sans requête.
 */
@Injectable()
export class ListCollectivitesSuiviesService {
  constructor(
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly listDossiersInstructionRepository: ListDossiersInstructionRepository
  ) {}

  async listCollectivitesSuivies(
    input: ListCollectivitesSuiviesInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<ListCollectivitesSuiviesOutput, ListDossiersInstructionError>
  > {
    const permissionResult =
      await this.depotPermissionsService.canListerDemandes(
        input.collectiviteId,
        { user, tx }
      );
    if (!permissionResult.success) {
      return failure(ListDossiersInstructionErrorEnum.UNAUTHORIZED);
    }

    const rowsResult =
      await this.listDossiersInstructionRepository.listDossiersCouvertsWithCollectivitesCouvertes(
        input.collectiviteId,
        tx
      );
    if (!rowsResult.success) {
      return rowsResult;
    }
    const { rows, perimetreRegions, couvertesParDemarche } = rowsResult.data;

    const collectivites = buildCollectivitesSuivies(rows, couvertesParDemarche);
    return success({
      collectivites,
      departements: listDistinctDepartements(collectivites),
      regions: perimetreRegions,
    });
  }
}
