import { Injectable } from '@nestjs/common';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePlansContenuRepository } from '@tet/backend/demarches/shared/demarche-plans-contenu.repository';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import type { DemarchePlanContenu } from '@tet/backend/demarches/shared/models/demarche-plan-contenu.dto';
import {
  PermissionService,
  type NonReferentielPermissionOperation,
} from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarcheTypeEnum,
  type DemarcheDocumentsSnapshot,
  type DemarchePcaetPublic,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq, inArray } from 'drizzle-orm';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import { DemarchePcaetPublicAccessService } from '../shared/demarche-pcaet-public-access.service';
import { toDemarchePcaetPublic } from '../shared/models/demarche-pcaet-public.dto';
import { demarchePcaetSelectColumns } from '../shared/models/demarche-pcaet.dto';
import {
  GetPublicDemarchePcaetError,
  GetPublicDemarchePcaetErrorEnum,
} from './get-public-demarche-pcaet.errors';
import { GetPublicDemarchePcaetInput } from './get-public-demarche-pcaet.input';

/**
 * Qui a déposé une pièce, et ce qu'il en a noté, restent entre les membres :
 * l'écran public n'affiche ni l'un ni l'autre.
 */
const withoutAuteurs = (
  snapshot: DemarcheDocumentsSnapshot
): DemarcheDocumentsSnapshot => ({
  ...snapshot,
  documents: snapshot.documents.map((document) => ({
    ...document,
    modifiedBy: null,
    commentaire: '',
  })),
  documentsAdditional: snapshot.documentsAdditional.map((document) => ({
    ...document,
    modifiedBy: null,
    commentaire: '',
  })),
});

export type DemarchePcaetConsultation = {
  demarche: DemarchePcaetPublic;
  documents: DemarcheDocumentsSnapshot;
  plans: DemarchePlanContenu[];
};

/**
 * Une démarche PCAET publique, telle qu'on la consulte : son en-tête, ses
 * pièces et son programme d'actions — jamais ses avis.
 *
 * Les pièces et les fiches confidentielles n'y figurent que pour qui a le droit
 * de les lire ; les plans encore en cours d'import ou de vérification n'y
 * figurent pas.
 */
@Injectable()
export class GetPublicDemarchePcaetService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly publicAccessService: DemarchePcaetPublicAccessService,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository,
    private readonly plansContenuRepository: DemarchePlansContenuRepository
  ) {}

  async getPublicDemarchePcaet(
    { demarcheId, collectiviteId }: GetPublicDemarchePcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaetConsultation, GetPublicDemarchePcaetError>> {
    const accessResult = await this.publicAccessService.canReadDemarche(
      { demarcheId, collectiviteId },
      { user, tx }
    );
    if (!accessResult.success) {
      return failure(GetPublicDemarchePcaetErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
    }
    const { isPrivate } = accessResult.data;

    const [
      canReadPlans,
      canReadFichesRestreintes,
      canReadDocumentsConfidentiels,
    ] = await Promise.all([
      // Le programme d'actions est un plan : il se lit aux droits des plans,
      // que certains rôles n'ont pas tout en lisant les démarches.
      this.isAllowed(
        isPrivate
          ? PermissionOperationEnum['PLANS.READ_CONFIDENTIEL']
          : PermissionOperationEnum['PLANS.READ'],
        collectiviteId,
        { user, tx }
      ),
      this.isAllowed(
        PermissionOperationEnum['PLANS.FICHES.READ_CONFIDENTIEL'],
        collectiviteId,
        { user, tx }
      ),
      this.isAllowed(
        PermissionOperationEnum['COLLECTIVITES.DOCUMENTS.READ_CONFIDENTIEL'],
        collectiviteId,
        { user, tx }
      ),
    ]);

    const [demarche, snapshot, plans] = await Promise.all([
      this.loadDemarche({ demarcheId, collectiviteId }, tx),
      this.demarcheDocumentsRepository.loadSnapshot(
        { demarcheId, demarcheType: DemarcheTypeEnum.PCAET, collectiviteId },
        tx
      ),
      canReadPlans
        ? this.plansContenuRepository.listPlansAvecContenu(
            {
              demarcheId,
              collectiviteId,
              hideFichesRestreintes: !canReadFichesRestreintes,
              activePlansOnly: true,
            },
            tx
          )
        : [],
    ]);
    if (!demarche) {
      return failure(GetPublicDemarchePcaetErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
    }

    const documents = canReadDocumentsConfidentiels
      ? snapshot
      : await this.withoutFichiersConfidentiels(snapshot, collectiviteId, tx);

    return success({
      demarche,
      documents: withoutAuteurs(documents),
      plans,
    });
  }

  /** L'en-tête seul : ni les plans rattachés, ni les capacités du workflow. */
  private async loadDemarche(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<DemarchePcaetPublic | null> {
    const [row] = await (tx ?? this.databaseService.db)
      .select(demarchePcaetSelectColumns)
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.id, demarcheId),
          eq(demarcheTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1);
    if (!row) {
      return null;
    }

    const pilotesByDemarcheId =
      await this.getDemarchePcaetRepository.listPilotes([demarcheId], tx);
    return toDemarchePcaetPublic({
      ...row,
      pilotes: pilotesByDemarcheId.get(demarcheId) ?? [],
    });
  }

  private async isAllowed(
    operation: NonReferentielPermissionOperation,
    collectiviteId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<boolean> {
    const result = await this.permissionService.isAllowed(
      user,
      operation,
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    return result.success;
  }

  /**
   * Retire la ligne entière, pas seulement son fichier : une pièce sans fichier
   * se lirait comme couverte par une déclaration d'inclusion. Écartée, elle se
   * lit comme non déposée, et son nom ne fuit pas.
   */
  private async withoutFichiersConfidentiels(
    snapshot: DemarcheDocumentsSnapshot,
    collectiviteId: number,
    tx?: Transaction
  ): Promise<DemarcheDocumentsSnapshot> {
    const fichierIds = [
      ...snapshot.documents,
      ...snapshot.documentsAdditional,
    ].flatMap(({ fichier }) => (fichier ? [fichier.id] : []));
    if (fichierIds.length === 0) {
      return snapshot;
    }

    const confidentiels = await (tx ?? this.databaseService.db)
      .select({ id: bibliothequeFichierTable.id })
      .from(bibliothequeFichierTable)
      .where(
        and(
          inArray(bibliothequeFichierTable.id, fichierIds),
          eq(bibliothequeFichierTable.collectiviteId, collectiviteId),
          eq(bibliothequeFichierTable.confidentiel, true)
        )
      );
    if (confidentiels.length === 0) {
      return snapshot;
    }

    const confidentielIds = new Set(confidentiels.map(({ id }) => id));
    const isReadable = ({ fichier }: { fichier: { id: number } | null }) =>
      fichier === null || !confidentielIds.has(fichier.id);

    return {
      ...snapshot,
      documents: snapshot.documents.filter(isReadable),
      documentsAdditional: snapshot.documentsAdditional.filter(isReadable),
    };
  }
}
