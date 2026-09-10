import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { regionTable } from '@tet/backend/collectivites/shared/models/imports-region.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type {
  CollectiviteNatureType,
  CollectiviteType,
} from '@tet/domain/collectivites';
import {
  DemarcheTypeEnum,
  PcaetPerimetreSaisineEnum,
  type DemarchePcaetObligation,
  type DemarchePcaetStatus,
  type PcaetPerimetreSaisine,
} from '@tet/domain/demarches';
import { and, eq, inArray, isNotNull, or, sql, type SQL } from 'drizzle-orm';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import { couvreLesCodesSql } from '../shared/perimetre-instructeur.columns';
import { PerimetreInstructeurRepository } from '../shared/perimetre-instructeur.repository';
import {
  ListDossiersInstructionError,
  ListDossiersInstructionErrorEnum,
} from './list-dossiers-instruction.errors';
import type { PerimetreRegion } from './list-dossiers-instruction.output';

/**
 * Les familles juridiques qui portent un PCAET, pour filtrer l'assiette en SQL.
 *
 * Reprend `estNaturePorteusePcaet`, que la requête ne peut pas appeler. Un test
 * vérifie que les deux disent la même chose : la règle reste au domaine, ce
 * tableau n'en est que la projection.
 */
export const NATURES_PORTEUSES_PCAET = [
  'CC',
  'CA',
  'CU',
  'METRO',
  'EPT',
] as const satisfies readonly CollectiviteNatureType[];

export type DossierInstructionRow = {
  demarcheId: number | null;
  demandeAvisId: number | null;
  demarcheTitre: string | null;
  demarcheStatus: DemarchePcaetStatus | null;
  obligation: DemarchePcaetObligation | null;
  launchedAt: string | null;
  avisDeadlineAt: string | null;
  transmittedAt: string | null;
  publishedAt: string | null;
  collectiviteId: number;
  collectiviteNom: string;
  collectiviteDepartementCode: string | null;
  collectiviteRegionCode: string | null;
  collectiviteRegionLibelle: string | null;
  collectiviteNatureInsee: CollectiviteNatureType | null;
  collectivitePopulation: number | null;
  /**
   * Le territoire de la déposante qui vaut cette saisine. Il varie d'une ligne
   * à l'autre : la même DREAL est principale sur un dossier et secondaire sur
   * un autre, et n'y lit donc pas la même chose.
   */
  perimetre: PcaetPerimetreSaisine;
  nbAvisValides: number;
  nbAvisBrouillons: number;
  /**
   * Validation du dernier avis rendu sur la demande, `null` si aucun ne l'est.
   * Avec `transmittedAt`, c'est ce qui mesure la durée d'une instruction.
   */
  dernierAvisValideLe: string | null;
};

export type DossiersCouverts = {
  instructeurType: CollectiviteType;
  rows: DossierInstructionRow[];
  perimetreRegions: PerimetreRegion[];
};

@Injectable()
export class ListDossiersInstructionRepository {
  private readonly logger = new Logger(ListDossiersInstructionRepository.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly perimetreInstructeurRepository: PerimetreInstructeurRepository
  ) {}

  /**
   * Le territoire d'un service : une ligne par démarche PCAET des collectivités
   * qu'il couvre, plus une ligne par collectivité porteuse qui n'a rien déposé.
   *
   * La liste ne part plus des saisines. Elles naissent à la transmission, ce
   * qui rendait structurellement invisibles les deux populations que le service
   * doit relancer : les dépôts en chantier et les collectivités absentes.
   *
   * Une collectivité peut donc apparaître plusieurs fois — un PCAET publié et
   * son renouvellement en cours sont deux lignes, comme deux dossiers.
   */
  async listDossiersCouverts(
    instructeurCollectiviteId: number,
    tx?: Transaction
  ): Promise<Result<DossiersCouverts, ListDossiersInstructionError>> {
    const db = tx ?? this.databaseService.db;

    try {
      const instructeur =
        await this.perimetreInstructeurRepository.getPerimetre(
          instructeurCollectiviteId,
          db
        );

      // La collectivité n'existe pas : le type ne sera lu par personne, aucune
      // ligne ne lui étant rattachée.
      if (!instructeur) {
        return success({
          instructeurType: 'test' as CollectiviteType,
          rows: [],
          perimetreRegions: [],
        });
      }

      const vide: DossiersCouverts = {
        instructeurType: instructeur.type,
        rows: [],
        perimetreRegions: [],
      };

      const couvert = instructeur.couvert;
      if (!couvert) {
        return success(vide);
      }

      const { national, maille, codes } = couvert;

      // Aucun filtre au national : le service voit toutes les déposantes.
      // Ailleurs, un service sans territoire ne couvre personne.
      let filtrePerimetre: SQL | undefined;
      if (!national) {
        if (codes.length === 0) {
          return success(vide);
        }
        // `collectiviteTable` est ici la déposante : ses territoires — le
        // principal comme les secondaires — sont confrontés à ceux du service.
        filtrePerimetre = couvreLesCodesSql(collectiviteTable, maille, codes);
      }

      const perimetreRegions =
        await this.perimetreInstructeurRepository.listRegions(couvert, db);

      /**
       * Principal ou secondaire, du point de vue de la déposante : la saisine
       * est principale quand le service couvre le **siège** de la déposante,
       * secondaire quand il ne l'atteint que par un territoire débordant.
       *
       * Le national est principal par construction — il couvre le pays, pas un
       * territoire qui pourrait être secondaire.
       */
      const colonnePerimetre = national
        ? sql<PcaetPerimetreSaisine>`${PcaetPerimetreSaisineEnum.PRINCIPAL}`
        : sql<PcaetPerimetreSaisine>`case when ${inArray(
            maille === 'region'
              ? collectiviteTable.regionCode
              : collectiviteTable.departementCode,
            codes
          )} then ${PcaetPerimetreSaisineEnum.PRINCIPAL} else ${
            PcaetPerimetreSaisineEnum.SECONDAIRE
          } end`;

      /**
       * Les avis d'une saisine, comptés une fois pour toutes.
       *
       * Une agrégation groupée plutôt que trois sous-requêtes corrélées : à
       * l'échelle d'un périmètre national, la liste passe de trois requêtes
       * par ligne à une seule pour l'ensemble.
       */
      const avis = db
        .select({
          demandeAvisId: pcaetAvisTable.demandeAvisId,
          nbValides:
            sql<number>`count(*) filter (where ${pcaetAvisTable.valideLe} is not null)::int`.as(
              'nb_valides'
            ),
          nbBrouillons:
            sql<number>`count(*) filter (where ${pcaetAvisTable.valideLe} is null)::int`.as(
              'nb_brouillons'
            ),
          dernierValideLe: sql<
            string | null
          >`max(${pcaetAvisTable.valideLe})`.as('dernier_valide_le'),
        })
        .from(pcaetAvisTable)
        .groupBy(pcaetAvisTable.demandeAvisId)
        .as('avis');

      // Une collectivité entre dans l'assiette si elle a déposé — quoi qu'elle
      // soit devenue depuis — ou si sa famille juridique porte un PCAET. Sans
      // le second terme, « aucun dépôt » n'existerait pas ; sans le premier,
      // une déposante d'une autre nature disparaîtrait avec son dossier.
      const dansLAssiette = or(
        isNotNull(demarcheTable.id),
        inArray(collectiviteTable.natureInsee, [...NATURES_PORTEUSES_PCAET])
      );

      const rows = await db
        .select({
          demarcheId: demarcheTable.id,
          demandeAvisId: pcaetDemandeAvisTable.id,
          demarcheTitre: demarcheTable.titre,
          demarcheStatus: demarcheTable.status,
          obligation: demarcheTable.obligation,
          launchedAt: demarcheTable.launchedAt,
          avisDeadlineAt: demarcheTable.avisDeadlineAt,
          transmittedAt: demarcheTable.transmittedAt,
          publishedAt: demarcheTable.publishedAt,
          collectiviteId: collectiviteTable.id,
          collectiviteNom: collectiviteTable.nom,
          collectiviteDepartementCode: collectiviteTable.departementCode,
          collectiviteRegionCode: collectiviteTable.regionCode,
          collectiviteRegionLibelle: regionTable.libelle,
          collectiviteNatureInsee: collectiviteTable.natureInsee,
          collectivitePopulation: collectiviteTable.population,
          perimetre: colonnePerimetre,
          nbAvisValides: sql<number>`coalesce(${avis.nbValides}, 0)`,
          nbAvisBrouillons: sql<number>`coalesce(${avis.nbBrouillons}, 0)`,
          dernierAvisValideLe: avis.dernierValideLe,
        })
        .from(collectiviteTable)
        .leftJoin(
          demarcheTable,
          and(
            eq(demarcheTable.collectiviteId, collectiviteTable.id),
            eq(demarcheTable.type, DemarcheTypeEnum.PCAET)
          )
        )
        .leftJoin(
          pcaetDemandeAvisTable,
          and(
            eq(pcaetDemandeAvisTable.demarcheId, demarcheTable.id),
            eq(
              pcaetDemandeAvisTable.instructeurCollectiviteId,
              instructeurCollectiviteId
            )
          )
        )
        .leftJoin(avis, eq(avis.demandeAvisId, pcaetDemandeAvisTable.id))
        .leftJoin(
          regionTable,
          eq(regionTable.code, collectiviteTable.regionCode)
        )
        .where(and(filtrePerimetre, dansLAssiette));

      return success({
        instructeurType: instructeur.type,
        rows,
        perimetreRegions,
      });
    } catch (error) {
      this.logger.error(
        `Error listing dossiers instruction for collectivite ${instructeurCollectiviteId}: ${error}`
      );
      return failure(
        ListDossiersInstructionErrorEnum.LIST_DOSSIERS_INSTRUCTION_ERROR
      );
    }
  }
}
