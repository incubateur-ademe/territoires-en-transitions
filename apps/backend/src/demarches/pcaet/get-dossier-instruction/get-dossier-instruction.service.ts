import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarcheTypeEnum,
  getDemandeAvisEtat,
  isDemarchePcaetAvisTousRendus,
  getTitresAvisInstructeur,
} from '@tet/domain/demarches';
import { eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import {
  GetDossierInstructionError,
  GetDossierInstructionErrorEnum,
} from './get-dossier-instruction.errors';
import { GetDossierInstructionInput } from './get-dossier-instruction.input';
import { DemarchePlansContenuRepository } from '@tet/backend/demarches/shared/demarche-plans-contenu.repository';
import { DossierInstruction } from './get-dossier-instruction.output';

@Injectable()
export class GetDossierInstructionService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository,
    private readonly plansContenuRepository: DemarchePlansContenuRepository,
    private readonly pcaetAvisRepository: PcaetAvisRepository
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

    // La déposante et l'instructrice sont toutes deux des collectivités : sans
    // alias, la seconde jointure écraserait la première.
    const instructrice = alias(collectiviteTable, 'instructrice');

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
        instructeurType: instructrice.type,
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
      .innerJoin(
        instructrice,
        eq(instructrice.id, pcaetDemandeAvisTable.instructeurCollectiviteId)
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

    const plans = await this.plansContenuRepository.listPlansAvecContenu(
      {
        demarcheId: dossier.demarcheId,
        collectiviteId: dossier.collectiviteId,
      },
      tx
    );

    const avis = await this.pcaetAvisRepository.listByDemande(
      demandeAvisId,
      tx
    );

    const pilotesByDemarcheId =
      await this.getDemarchePcaetRepository.listPilotes(
        [dossier.demarcheId],
        tx
      );
    const pilotes = (pilotesByDemarcheId.get(dossier.demarcheId) ?? []).map(
      ({ nom }) => nom
    );

    // « Instruit » ne se dit qu'une fois rendus **tous les titres attendus de ce
    // destinataire**, et par la règle du guard `avisTousRendus` elle-même : le
    // badge de l'écran et la bascule de statut ne peuvent ainsi pas diverger. Un
    // seul avis validé sur les deux de la DREAL laisse l'échéance affichée — il
    // en reste un à produire.
    //
    // La vue porte sur cette demande seule : l'écran dit où en est l'instructeur
    // qui la consulte, pas si les autres instances ont rendu la leur.
    const titresAttendus = getTitresAvisInstructeur(dossier.instructeurType);
    const avisValides = avis.filter(({ valideLe }) => valideLe !== null);
    const instruitLe = isDemarchePcaetAvisTousRendus([
      {
        titresAttendus,
        titresValides: avisValides.map(({ auTitreDe }) => auTitreDe),
      },
    ])
      ? avisValides.reduce<string | null>(
          (plusRecente, { valideLe }) =>
            plusRecente === null ||
            (valideLe !== null && valideLe > plusRecente)
              ? valideLe
              : plusRecente,
          null
        )
      : null;

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
      instruitLe,
      titresDeposables: [...titresAttendus],
      launchedAt: dossier.launchedAt,
      createdAt: dossier.createdAt,
      modifiedAt: dossier.modifiedAt,
      pilotes,
      collectivite: {
        id: dossier.collectiviteId,
        nom: dossier.collectiviteNom,
      },
      documents,
      plans,
      avis,
    });
  }
}
