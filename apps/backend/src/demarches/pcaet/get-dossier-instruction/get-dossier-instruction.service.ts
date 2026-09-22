import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePlansContenuRepository } from '@tet/backend/demarches/shared/demarche-plans-contenu.repository';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarcheTypeEnum,
  getDemandeAvisEtat,
  getEtatDossierEnLecture,
  getTitresAvisSaisine,
  isDemarchePcaetAvisTousRendus,
} from '@tet/domain/demarches';
import { eq } from 'drizzle-orm';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import type { DepotPermissionsError } from '../shared/depot-permissions.errors';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import {
  GetDossierInstructionError,
  GetDossierInstructionErrorEnum,
} from './get-dossier-instruction.errors';
import { GetDossierInstructionInput } from './get-dossier-instruction.input';
import { DossierInstruction } from './get-dossier-instruction.output';

/** Les refus du préambule, dans le vocabulaire de cette route. */
const toGetDossierError = (
  error: DepotPermissionsError
): GetDossierInstructionError =>
  error === 'DEMANDE_AVIS_NOT_FOUND'
    ? error
    : error === 'NOT_FOUND'
    ? GetDossierInstructionErrorEnum.DEMARCHE_PCAET_NOT_FOUND
    : GetDossierInstructionErrorEnum.UNAUTHORIZED;

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
    ref: GetDossierInstructionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DossierInstruction, GetDossierInstructionError>> {
    const consultableResult =
      await this.depotPermissionsService.canConsulterDossier(ref, {
        user,
        tx,
      });
    if (!consultableResult.success) {
      return failure(toGetDossierError(consultableResult.error));
    }
    const { demarcheId, collectiviteId, demandeAvisId, instructeurType, perimetre } =
      consultableResult.data;

    const rows = await (tx ?? this.databaseService.db)
      .select({
        titre: demarcheTable.titre,
        status: demarcheTable.status,
        isScotAec: demarcheTable.isScotAec,
        transmittedAt: demarcheTable.transmittedAt,
        avisDeadlineAt: demarcheTable.avisDeadlineAt,
        launchedAt: demarcheTable.launchedAt,
        createdAt: demarcheTable.createdAt,
        modifiedAt: demarcheTable.modifiedAt,
        collectiviteNom: collectiviteTable.nom,
      })
      .from(demarcheTable)
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, demarcheTable.collectiviteId)
      )
      .where(eq(demarcheTable.id, demarcheId))
      .limit(1);

    const dossier = rows[0];
    if (!dossier) {
      return failure(GetDossierInstructionErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
    }

    const documents = await this.demarcheDocumentsRepository.loadSnapshot(
      {
        demarcheId,
        demarcheType: DemarcheTypeEnum.PCAET,
        collectiviteId,
      },
      tx
    );

    const plans = await this.plansContenuRepository.listPlansAvecContenu(
      { demarcheId, collectiviteId },
      tx
    );

    // Sans saisine, rien n'a été rendu ni ne peut l'être : un dépôt en
    // élaboration n'a pas encore été transmis.
    const avis =
      demandeAvisId === null
        ? []
        : await this.pcaetAvisRepository.listByDemande(demandeAvisId, tx);
    const avisAutresDestinataires =
      demandeAvisId === null
        ? []
        : await this.pcaetAvisRepository.listValidesAutresDemandes(
            demandeAvisId,
            tx
          );

    const pilotesByDemarcheId =
      await this.getDemarchePcaetRepository.listPilotes([demarcheId], tx);
    const pilotes = (pilotesByDemarcheId.get(demarcheId) ?? []).map(
      ({ nom }) => nom
    );

    // Deux lectures du même dossier, selon ce que le destinataire y fait.
    //
    // Celui qui dépose un avis — DREAL, conseil régional — lit où *il* en est :
    // « instruit » ne se dit qu'une fois rendus tous les titres attendus de lui,
    // et par la règle du guard `avisTousRendus` elle-même, si bien que le badge
    // de l'écran et la bascule de statut ne peuvent pas diverger.
    //
    // Celui qui n'en dépose aucun — DDT, DR ADEME, service national, et depuis
    // les périmètres secondaires toute famille saisie au titre d'un territoire
    // qui n'est pas le siège — lit où en est *le dossier* : l'état de sa propre
    // demande ne lui dit rien, elle restera vide par nature, et son délai passé
    // la faisait afficher « Pas d'avis déposé » sur un dossier pourtant instruit.
    //
    // Sans saisine, aucun titre : le service lit un dépôt qui ne lui a pas été
    // transmis, il n'a rien à y rendre.
    const titresAttendus =
      demandeAvisId === null
        ? []
        : getTitresAvisSaisine(instructeurType, perimetre);
    const deposeAvis = titresAttendus.length > 0;

    const avisValides = avis.filter(({ valideLe }) => valideLe !== null);
    const achevement = deposeAvis
      ? [
          {
            titresAttendus,
            titresValides: avisValides.map(({ auTitreDe }) => auTitreDe),
          },
        ]
      : await this.pcaetAvisRepository.listAchevementDemandes(demarcheId, tx);

    // La date qui datera l'instruction : la plus récente des validations que ce
    // destinataire a sous les yeux — les siennes, ou celles du dossier.
    const validesVisibles = deposeAvis ? avisValides : avisAutresDestinataires;
    const instruitLe = isDemarchePcaetAvisTousRendus(achevement)
      ? validesVisibles.reduce<string | null>(
          (plusRecente, { valideLe }) =>
            plusRecente === null ||
            (valideLe !== null && valideLe > plusRecente)
              ? valideLe
              : plusRecente,
          null
        )
      : null;

    // L'état d'une saisine ne se lit que sur une saisine : un dépôt en
    // élaboration n'en a pas, et son statut de démarche dit tout ce qu'il y a à
    // dire.
    const etat =
      demandeAvisId === null
        ? null
        : deposeAvis
        ? getDemandeAvisEtat(
            {
              demarcheStatus: dossier.status,
              avisDeadlineAt: dossier.avisDeadlineAt,
              nbAvisValides: avisValides.length,
              nbAvisBrouillons: avis.length - avisValides.length,
            },
            new Date()
          )
        : getEtatDossierEnLecture(
            {
              demarcheStatus: dossier.status,
              avisDeadlineAt: dossier.avisDeadlineAt,
              achevement,
            },
            new Date()
          );

    return success({
      demandeAvisId,
      demarcheId,
      titre: dossier.titre,
      status: dossier.status,
      isScotAec: dossier.isScotAec,
      etat,
      transmittedAt: dossier.transmittedAt,
      avisDeadlineAt: dossier.avisDeadlineAt,
      instruitLe,
      titresDeposables: [...titresAttendus],
      launchedAt: dossier.launchedAt,
      createdAt: dossier.createdAt,
      modifiedAt: dossier.modifiedAt,
      pilotes,
      collectivite: {
        id: collectiviteId,
        nom: dossier.collectiviteNom,
      },
      documents,
      plans,
      avis,
      avisAutresDestinataires,
    });
  }
}
