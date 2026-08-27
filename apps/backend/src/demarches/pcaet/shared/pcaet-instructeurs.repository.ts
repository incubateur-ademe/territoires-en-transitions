import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  getCleGeoInstructeur,
  typesInstructeur,
} from '@tet/domain/demarches';
import { and, eq, inArray, ne, or } from 'drizzle-orm';
import { pcaetDemandeAvisTable } from './models/pcaet-demande-avis.table';

/** Le type d'instructeur, ventilé par le périmètre qu'il couvre. */
const typesParRegion = typesInstructeur.filter(
  (type) => getCleGeoInstructeur(type) === 'regionCode'
);
const typesParDepartement = typesInstructeur.filter(
  (type) => getCleGeoInstructeur(type) === 'departementCode'
);

export type InstructeurSaisi = {
  collectiviteId: number;
  nom: string;
};

@Injectable()
export class PcaetInstructeursRepository {
  private readonly logger = new Logger(PcaetInstructeursRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Les collectivités que la transmission d'un dossier atteint : celles dont le
   * périmètre couvre la déposante — la région pour la DREAL et le conseil
   * régional, le département pour la DDT.
   *
   * La déposante ne se saisit jamais elle-même : une région qui déposerait son
   * propre dossier n'a pas à figurer parmi ses destinataires.
   */
  async listInstructeursCouvrants(
    collectiviteId: number,
    tx?: Transaction
  ): Promise<InstructeurSaisi[]> {
    const db = tx ?? this.databaseService.db;

    const deposantes = await db
      .select({
        regionCode: collectiviteTable.regionCode,
        departementCode: collectiviteTable.departementCode,
      })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, collectiviteId))
      .limit(1);

    const deposante = deposantes[0];
    if (!deposante) {
      return [];
    }

    // Un code absent ne couvre rien : sans lui, le périmètre correspondant est
    // simplement écarté plutôt que comparé à NULL.
    const perimetres = [
      deposante.regionCode && typesParRegion.length > 0
        ? and(
            inArray(collectiviteTable.type, typesParRegion),
            eq(collectiviteTable.regionCode, deposante.regionCode)
          )
        : undefined,
      deposante.departementCode && typesParDepartement.length > 0
        ? and(
            inArray(collectiviteTable.type, typesParDepartement),
            eq(collectiviteTable.departementCode, deposante.departementCode)
          )
        : undefined,
    ].filter((clause) => clause !== undefined);

    if (perimetres.length === 0) {
      return [];
    }

    return db
      .select({
        collectiviteId: collectiviteTable.id,
        nom: collectiviteTable.nom,
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
