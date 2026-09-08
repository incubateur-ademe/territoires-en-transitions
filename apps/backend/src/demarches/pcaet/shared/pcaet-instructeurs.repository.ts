import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { CollectiviteType } from '@tet/domain/collectivites';
import {
  PcaetPerimetreSaisineEnum,
  PerimetreInstructeurEnum,
  typesInstructeurDuPerimetre,
  type PcaetPerimetreSaisine,
} from '@tet/domain/demarches';
import { and, eq, inArray, ne, or, sql, SQL } from 'drizzle-orm';
import {
  couvreLesCodesSql,
  perimetreCodesSql,
} from './perimetre-instructeur.columns';
import { pcaetDemandeAvisTable } from './models/pcaet-demande-avis.table';

/** Le type d'instructeur, ventilé par le périmètre qu'il couvre. */
const typesParRegion = typesInstructeurDuPerimetre(
  PerimetreInstructeurEnum.REGION
);
const typesParDepartement = typesInstructeurDuPerimetre(
  PerimetreInstructeurEnum.DEPARTEMENT
);
const typesNationaux = typesInstructeurDuPerimetre(
  PerimetreInstructeurEnum.NATIONAL
);

export type InstructeurSaisi = {
  collectiviteId: number;
  nom: string;
  /**
   * Le territoire de la déposante par lequel ce service est atteint. Un service
   * qui ne la touche que par un périmètre secondaire reçoit le dossier en
   * lecture : l'avis revient à celui du siège.
   */
  perimetre: PcaetPerimetreSaisine;
};

@Injectable()
export class PcaetInstructeursRepository {
  private readonly logger = new Logger(PcaetInstructeursRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Les collectivités que la transmission d'un dossier atteint : celles dont le
   * périmètre couvre la déposante.
   *
   * La déposante ne se saisit jamais elle-même : une région qui déposerait son
   * propre dossier n'a pas à figurer parmi ses destinataires.
   */
  async listInstructeursCouvrants(
    collectiviteId: number,
    tx?: Transaction
  ): Promise<InstructeurSaisi[]> {
    const db = tx ?? this.databaseService.db;

    // Les territoires de la déposante : son code principal et ses secondaires.
    // Un EPCI peut chevaucher plusieurs départements — Redon Agglomération
    // s'étale sur 44, 56 et 35 — et doit alors être saisi par les instructeurs
    // de chacun, pas seulement par ceux de son siège.
    const deposantes = await db
      .select({
        regionCodes: perimetreCodesSql(collectiviteTable, 'region'),
        departementCodes: perimetreCodesSql(collectiviteTable, 'departement'),
        // Les codes du siège à part : ce sont eux qui départagent une saisine
        // principale d'une secondaire.
        regionPrincipale: collectiviteTable.regionCode,
        departementPrincipal: collectiviteTable.departementCode,
      })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, collectiviteId))
      .limit(1);

    const deposante = deposantes[0];
    if (!deposante) {
      return [];
    }

    /**
     * Les services d'une maille qui couvrent l'un des territoires de la
     * déposante — par leur code propre ou par un périmètre secondaire.
     */
    const couvreLaDeposante = (
      types: readonly CollectiviteType[],
      maille: 'region' | 'departement',
      codesDeposante: string[]
    ): SQL | undefined =>
      // Une déposante sans territoire à cette maille ne se compare à rien.
      types.length === 0 || codesDeposante.length === 0
        ? undefined
        : and(
            inArray(collectiviteTable.type, types),
            couvreLesCodesSql(collectiviteTable, maille, codesDeposante)
          );

    const perimetres = [
      couvreLaDeposante(typesParRegion, 'region', deposante.regionCodes),
      couvreLaDeposante(
        typesParDepartement,
        'departement',
        deposante.departementCodes
      ),
      // Le national couvre la déposante quels que soient ses codes.
      typesNationaux.length > 0
        ? inArray(collectiviteTable.type, typesNationaux)
        : undefined,
    ].filter((clause) => clause !== undefined);

    if (perimetres.length === 0) {
      return [];
    }

    /**
     * Le même croisement, mais restreint au territoire du siège : un service qui
     * y répond est saisi au titre du périmètre principal, les autres ne touchent
     * la déposante que par un de ses territoires secondaires.
     *
     * Le national est principal par construction — il couvre le pays, pas un
     * territoire qui pourrait être secondaire.
     *
     * Mesuré sur les périmètres Banatic : aucun service ne répond aux deux à la
     * fois, un périmètre secondaire étant par construction distinct du principal.
     * La formulation tranche quand même en faveur du principal, qui est le plus
     * favorable — un droit ne se perd pas sur une ambiguïté.
     */
    const couvreLeSiege = [
      typesNationaux.length > 0
        ? inArray(collectiviteTable.type, typesNationaux)
        : undefined,
      couvreLaDeposante(
        typesParRegion,
        'region',
        deposante.regionPrincipale ? [deposante.regionPrincipale] : []
      ),
      couvreLaDeposante(
        typesParDepartement,
        'departement',
        deposante.departementPrincipal ? [deposante.departementPrincipal] : []
      ),
    ].filter((clause) => clause !== undefined);

    const perimetre =
      couvreLeSiege.length === 0
        ? sql<PcaetPerimetreSaisine>`${PcaetPerimetreSaisineEnum.SECONDAIRE}`
        : sql<PcaetPerimetreSaisine>`case when ${or(
            ...couvreLeSiege
          )} then ${PcaetPerimetreSaisineEnum.PRINCIPAL} else ${
            PcaetPerimetreSaisineEnum.SECONDAIRE
          } end`;

    return db
      .select({
        collectiviteId: collectiviteTable.id,
        nom: collectiviteTable.nom,
        perimetre,
      })
      .from(collectiviteTable)
      .where(and(or(...perimetres), ne(collectiviteTable.id, collectiviteId)));
  }

  /**
   * Inscrit une demande d'avis par instructeur couvrant, sans toucher à celles
   * qui existent déjà — leur date de saisine fait foi. Un dossier ne se transmet
   * qu'une fois, mais l'écriture reste idempotente : c'est une transmission
   * rejouée, non un second envoi, et elle ne doit rien dupliquer.
   */
  async saisirInstructeurs(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<InstructeurSaisi[]> {
    const db = tx ?? this.databaseService.db;

    const instructeurs = await this.listInstructeursCouvrants(
      collectiviteId,
      tx
    );
    if (instructeurs.length === 0) {
      this.logger.warn(
        `Aucun instructeur ne couvre la collectivité ${collectiviteId} : la démarche ${demarcheId} est transmise sans destinataire`
      );
      return [];
    }

    await db
      .insert(pcaetDemandeAvisTable)
      .values(
        instructeurs.map((instructeur) => ({
          demarcheId,
          instructeurCollectiviteId: instructeur.collectiviteId,
          source: 'transmission' as const,
          perimetre: instructeur.perimetre,
        }))
      )
      .onConflictDoNothing({
        target: [
          pcaetDemandeAvisTable.demarcheId,
          pcaetDemandeAvisTable.instructeurCollectiviteId,
        ],
      });

    return instructeurs;
  }
}
