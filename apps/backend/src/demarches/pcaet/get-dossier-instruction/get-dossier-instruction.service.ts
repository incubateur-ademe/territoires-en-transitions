import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DemarcheTypeEnum, getDemandeAvisEtat } from '@tet/domain/demarches';
import { eq, sql } from 'drizzle-orm';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import { pcaetInstructionValidationTable } from '../shared/models/pcaet-instruction-validation.table';
import {
  GetDossierInstructionError,
  GetDossierInstructionErrorEnum,
} from './get-dossier-instruction.errors';
import { GetDossierInstructionInput } from './get-dossier-instruction.input';
import { DossierInstruction } from './get-dossier-instruction.output';

@Injectable()
export class GetDossierInstructionService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository
  ) {}

  async getDossierInstruction(
    { demandeAvisId }: GetDossierInstructionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DossierInstruction, GetDossierInstructionError>> {
    const permissionResult =
      await this.depotPermissionsService.canConsulterDepot(demandeAvisId, {
        user,
        tx,
      });
    if (!permissionResult.success) {
      return failure(GetDossierInstructionErrorEnum.UNAUTHORIZED);
    }

    const rows = await (tx ?? this.databaseService.db)
      .select({
        demarcheId: demarcheTable.id,
        titre: demarcheTable.titre,
        status: demarcheTable.status,
        transmittedAt: demarcheTable.transmittedAt,
        avisDeadlineAt: demarcheTable.avisDeadlineAt,
        launchedAt: demarcheTable.launchedAt,
        createdAt: demarcheTable.createdAt,
        modifiedAt: demarcheTable.modifiedAt,
        collectiviteId: collectiviteTable.id,
        collectiviteNom: collectiviteTable.nom,
        nbAvisValides: sql<number>`(
          select count(*)::int from ${pcaetAvisTable}
          where ${pcaetAvisTable.demandeAvisId} = ${pcaetDemandeAvisTable.id}
            and ${pcaetAvisTable.valideLe} is not null
        )`,
        nbAvisBrouillons: sql<number>`(
          select count(*)::int from ${pcaetAvisTable}
          where ${pcaetAvisTable.demandeAvisId} = ${pcaetDemandeAvisTable.id}
            and ${pcaetAvisTable.valideLe} is null
        )`,
      })
      .from(pcaetDemandeAvisTable)
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, pcaetDemandeAvisTable.demarcheId)
      )
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, demarcheTable.collectiviteId)
      )
      .where(eq(pcaetDemandeAvisTable.id, demandeAvisId))
      .limit(1);

    const dossier = rows[0];
    if (!dossier) {
      return failure(GetDossierInstructionErrorEnum.DEMANDE_AVIS_NOT_FOUND);
    }

    const documents = await this.demarcheDocumentsRepository.loadSnapshot(
      {
        demarcheId: dossier.demarcheId,
        demarcheType: DemarcheTypeEnum.PCAET,
      },
      tx
    );

    const partiesValidees = await (tx ?? this.databaseService.db)
      .select({
        partie: pcaetInstructionValidationTable.partie,
        valideLe: pcaetInstructionValidationTable.valideLe,
        validePar: pcaetInstructionValidationTable.validePar,
      })
      .from(pcaetInstructionValidationTable)
      .where(eq(pcaetInstructionValidationTable.demandeAvisId, demandeAvisId));

    const pilotesByDemarcheId =
      await this.getDemarchePcaetRepository.listPilotes(
        [dossier.demarcheId],
        tx
      );
    const pilotes = (pilotesByDemarcheId.get(dossier.demarcheId) ?? []).map(
      ({ nom }) => nom
    );

    return success({
      demandeAvisId,
      demarcheId: dossier.demarcheId,
      titre: dossier.titre,
      status: dossier.status,
      etat: getDemandeAvisEtat(
        {
          demarcheStatus: dossier.status,
          avisDeadlineAt: dossier.avisDeadlineAt,
          nbAvisValides: dossier.nbAvisValides,
          nbAvisBrouillons: dossier.nbAvisBrouillons,
        },
        new Date()
      ),
      transmittedAt: dossier.transmittedAt,
      avisDeadlineAt: dossier.avisDeadlineAt,
      launchedAt: dossier.launchedAt,
      createdAt: dossier.createdAt,
      modifiedAt: dossier.modifiedAt,
      pilotes,
      collectivite: {
        id: dossier.collectiviteId,
        nom: dossier.collectiviteNom,
      },
      documents,
      partiesValidees,
    });
  }
}
