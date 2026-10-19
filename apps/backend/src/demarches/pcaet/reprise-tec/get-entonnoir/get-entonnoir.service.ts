import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DossiersRecetteRepository } from '../shared/dossiers-recette.repository';
import {
  GetEntonnoirError,
  GetEntonnoirErrorEnum,
} from './get-entonnoir.errors';
import { Entonnoir } from './get-entonnoir.output';

@Injectable()
export class GetEntonnoirService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly dossiersRecetteRepository: DossiersRecetteRepository
  ) {}

  async getEntonnoir({
    user,
    tx,
  }: ServiceSecondArg): Promise<Result<Entonnoir, GetEntonnoirError>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.REPRISE-TEC.READ'],
      ResourceType.PLATEFORME,
      null,
      tx
    );
    if (!permissionResult.success) {
      return failure(GetEntonnoirErrorEnum.UNAUTHORIZED);
    }

    const dossiersResult = await this.dossiersRecetteRepository.listDossiers(
      tx
    );
    if (!dossiersResult.success) {
      return failure(dossiersResult.error);
    }

    const flux = new Map<string, Entonnoir['flux'][number]>();
    for (const d of dossiersResult.data) {
      const motif = d.statut === null ? d.motif : null;
      const cle = [d.etat, d.statut, motif].join('|');
      const existant = flux.get(cle);
      if (existant) {
        existant.nombre += 1;
      } else {
        flux.set(cle, { etat: d.etat, statut: d.statut, motif, nombre: 1 });
      }
    }

    return success({
      total: dossiersResult.data.length,
      repris: dossiersResult.data.filter((d) => d.statut !== null).length,
      flux: [...flux.values()].sort((a, b) => b.nombre - a.nombre),
    });
  }
}
