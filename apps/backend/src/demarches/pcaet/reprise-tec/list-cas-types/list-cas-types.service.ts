import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { listExemples, toDossierRef } from '../shared/dossier-ref';
import { DossiersRecetteRepository } from '../shared/dossiers-recette.repository';
import {
  casTypes,
  getCasType,
  getParticularites,
  particularites,
  SECTIONS_PAR_CAS_TYPE,
  SECTIONS_PAR_PARTICULARITE,
} from './cas-types.rules';
import {
  ListCasTypesError,
  ListCasTypesErrorEnum,
} from './list-cas-types.errors';
import { CasTypes } from './list-cas-types.output';

@Injectable()
export class ListCasTypesService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly dossiersRecetteRepository: DossiersRecetteRepository
  ) {}

  async listCasTypes({
    user,
    tx,
  }: ServiceSecondArg): Promise<Result<CasTypes, ListCasTypesError>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.REPRISE-TEC.READ'],
      ResourceType.PLATEFORME,
      null,
      tx
    );
    if (!permissionResult.success) {
      return failure(ListCasTypesErrorEnum.UNAUTHORIZED);
    }

    const dossiersResult = await this.dossiersRecetteRepository.listDossiers(
      tx
    );
    if (!dossiersResult.success) {
      return failure(dossiersResult.error);
    }
    const dossiers = dossiersResult.data.map((d) => ({
      dossier: d,
      casType: getCasType(d),
      particularites: getParticularites(d),
    }));

    return success({
      casTypes: casTypes.map((code) => {
        const duCas = dossiers.filter((d) => d.casType === code);
        const sansParticularite = duCas.filter(
          (d) => d.particularites.length === 0
        );
        return {
          code,
          sections: SECTIONS_PAR_CAS_TYPE[code],
          nombre: duCas.length,
          exemple:
            listExemples(
              (sansParticularite.length ? sansParticularite : duCas).map(
                (d) => d.dossier
              ),
              1
            )[0] ?? null,
          dossiers: duCas.map((d) => ({
            ...toDossierRef(d.dossier),
            particularites: d.particularites,
          })),
        };
      }),
      particularites: particularites.map((code) => ({
        code,
        sections: SECTIONS_PAR_PARTICULARITE[code],
        nombre: dossiers.filter((d) => d.particularites.includes(code)).length,
      })),
    });
  }
}
