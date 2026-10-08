import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { banaticTable } from '@tet/backend/collectivites/shared/models/imports-banatic.table';
import { importCodeSirenCommuneTable } from '@tet/backend/collectivites/shared/models/imports-code-siren-commune.table';
import { importCommuneTable } from '@tet/backend/collectivites/shared/models/imports-commune.table';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  collectiviteTypeEnum,
  defaultCollectivitePreferences,
} from '@tet/domain/collectivites';
import { eq, sql } from 'drizzle-orm';
import {
  CollectiviteRapprochee,
  GetCollectiviteBySiretService,
  SIRET_PATTERN,
} from '../get-collectivite-by-siret/get-collectivite-by-siret.service';

type FicheImports = Pick<
  typeof collectiviteTable.$inferInsert,
  | 'type'
  | 'nom'
  | 'communeCode'
  | 'departementCode'
  | 'regionCode'
  | 'population'
  | 'natureInsee'
>;

/**
 * La commune ou l'EPCI que désigne un SIRET, créé à partir des tables
 * `imports` (fiche INSEE, BANATIC) quand `collectivite` ne le connaît pas
 * encore — ce que fait à la main la page Support « Ajouter une collectivité ».
 *
 * Jamais sur la seule foi du jeton : un SIREN absent de ces listes publiques,
 * celui d'un bureau d'études par exemple, ne crée rien. Le NIC n'est pas
 * retenu : celui du jeton peut désigner une annexe, et le rapprochement
 * retombe sur le SIREN seul.
 */
@Injectable()
export class CreateCollectiviteFromImportsService {
  private readonly logger = new Logger(
    CreateCollectiviteFromImportsService.name
  );

  constructor(
    private readonly getCollectiviteBySiretService: GetCollectiviteBySiretService,
    private readonly transactionManager: TransactionManager
  ) {}

  /** `null` : rien à créer — SIREN hors des imports, ou valeur qui n'est pas un SIRET. */
  async createFromSiret(
    siret: string,
    tx?: Transaction
  ): Promise<Result<CollectiviteRapprochee | null, string>> {
    // Même règle que `getBySiret` : un SIREN seul, que MonCompteAdeme a pu
    // renvoyer, n'y est pas rapproché et ne doit pas davantage créer.
    if (!SIRET_PATTERN.test(siret)) {
      return success(null);
    }
    const siren = siret.slice(0, 9);

    return this.transactionManager.executeSingle<
      CollectiviteRapprochee | null,
      string
    >(async (transaction) => {
      // Sérialise deux premières connexions d'une même collectivité :
      // `collectivite` n'a aucune unicité sur le SIREN, chacune en créerait une.
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`collectivite:${siren}`}))`
      );

      const existante = await this.getCollectiviteBySiretService.getBySiret(
        siret,
        transaction
      );
      if (existante) {
        return success(existante);
      }

      const fiche =
        (await this.lireCommune(siren, transaction)) ??
        (await this.lireEpci(siren, transaction));
      if (!fiche) {
        return success(null);
      }

      const [creee] = await transaction
        .insert(collectiviteTable)
        .values({
          ...fiche,
          siren,
          preferences: defaultCollectivitePreferences,
        })
        .returning({
          collectiviteId: collectiviteTable.id,
          nom: collectiviteTable.nom,
          type: collectiviteTable.type,
          siren: collectiviteTable.siren,
        });

      this.logger.log(
        `Collectivité #${creee.collectiviteId} « ${creee.nom} » (${creee.type}) créée depuis les imports pour le SIREN ${siren}`
      );

      return success({ ...creee, siret });
    }, tx);
  }

  private async lireCommune(
    siren: string,
    tx: Transaction
  ): Promise<FicheImports | null> {
    const [commune] = await tx
      .select({
        nom: importCommuneTable.libelle,
        libelleCorrespondance: importCodeSirenCommuneTable.libelle,
        communeCode: importCommuneTable.code,
        departementCode: importCommuneTable.departementCode,
        regionCode: importCommuneTable.regionCode,
        population: importCommuneTable.population,
      })
      .from(importCodeSirenCommuneTable)
      .innerJoin(
        importCommuneTable,
        eq(
          importCommuneTable.code,
          sql`lpad(${importCodeSirenCommuneTable.insee}, 5, '0')`
        )
      )
      .where(eq(importCodeSirenCommuneTable.siren, siren))
      .limit(1);

    if (!commune) {
      return null;
    }
    const { libelleCorrespondance, ...fiche } = commune;
    return {
      ...fiche,
      type: collectiviteTypeEnum.COMMUNE,
      nom: fiche.nom ?? libelleCorrespondance,
    };
  }

  private async lireEpci(
    siren: string,
    tx: Transaction
  ): Promise<FicheImports | null> {
    const [epci] = await tx
      .select({
        nom: banaticTable.libelle,
        departementCode: banaticTable.departementCode,
        regionCode: banaticTable.regionCode,
        population: banaticTable.population,
        natureInsee: banaticTable.nature,
      })
      .from(banaticTable)
      .where(eq(banaticTable.siren, siren))
      .limit(1);

    if (!epci) {
      return null;
    }
    return {
      ...epci,
      type: collectiviteTypeEnum.EPCI,
      nom: epci.nom ?? siren,
    };
  }
}
