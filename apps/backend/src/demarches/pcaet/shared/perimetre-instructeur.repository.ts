import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { departementTable } from '@tet/backend/collectivites/shared/models/imports-departement.table';
import { regionTable } from '@tet/backend/collectivites/shared/models/imports-region.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { CollectiviteType } from '@tet/domain/collectivites';
import {
  getPerimetreInstructeur,
  PerimetreInstructeurEnum,
} from '@tet/domain/demarches';
import { asc, eq, inArray } from 'drizzle-orm';
import { perimetreCodesSql } from './perimetre-instructeur.columns';

type Db = Transaction | DatabaseService['db'];

export type MaillePerimetre = 'region' | 'departement';

/** Le territoire d'un service, une fois sa famille juridique interrogée. */
export type PerimetreCouvert = {
  /** Le national ne se compare à aucun code : il couvre toutes les déposantes. */
  national: boolean;
  maille: MaillePerimetre;
  /**
   * Les codes du service à sa maille, dédoublonnés. Vide au national, et vide
   * aussi pour un service régional sans région — qui ne couvre alors personne.
   */
  codes: string[];
};

export type PerimetreInstructeur = {
  type: CollectiviteType;
  /**
   * `null` quand la famille juridique du service n'a aucun périmètre
   * d'instruction : une collectivité ordinaire n'instruit rien.
   */
  couvert: PerimetreCouvert | null;
};

/** Une région du périmètre, telle que l'écran l'affiche et la filtre. */
export type RegionPerimetre = {
  code: string;
  libelle: string;
};

/**
 * Le territoire d'un service instructeur : à quelle maille il travaille, et
 * quels codes il couvre.
 *
 * Séparé des requêtes qui s'en servent — lister des dossiers, situer un
 * dossier — parce que la réponse ne dépend que du service : sa famille
 * juridique donne la maille, ses périmètres donnent les codes.
 */
@Injectable()
export class PerimetreInstructeurRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /** `null` quand la collectivité n'existe pas. */
  async getPerimetre(
    instructeurCollectiviteId: number,
    tx?: Db
  ): Promise<PerimetreInstructeur | null> {
    const db = tx ?? this.databaseService.db;

    const [instructrice] = await db
      .select({
        type: collectiviteTable.type,
        regionCodes: perimetreCodesSql(collectiviteTable, 'region'),
        departementCodes: perimetreCodesSql(collectiviteTable, 'departement'),
      })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, instructeurCollectiviteId))
      .limit(1);

    if (!instructrice) {
      return null;
    }

    const perimetre = getPerimetreInstructeur(instructrice.type);
    if (!perimetre) {
      return { type: instructrice.type, couvert: null };
    }

    const maille: MaillePerimetre =
      perimetre === PerimetreInstructeurEnum.DEPARTEMENT
        ? 'departement'
        : 'region';

    // Dédoublonnés : rien n'oblige `collectivite_perimetre_secondaire` à ne pas
    // répéter le code du siège, et un doublon ferait croire à un service
    // mono-région qu'il en couvre deux — la colonne « Région » apparaîtrait,
    // avec deux fois la même option dans son filtre.
    const codes = [
      ...new Set(
        maille === 'region'
          ? instructrice.regionCodes
          : instructrice.departementCodes
      ),
    ];

    return {
      type: instructrice.type,
      couvert: {
        national: perimetre === PerimetreInstructeurEnum.NATIONAL,
        maille,
        codes,
      },
    };
  }

  /**
   * Les régions du périmètre, par ordre alphabétique.
   *
   * Toutes pour un service national. Pour un service à la maille région, celles
   * de ses codes ; à la maille département, celles dont ses départements
   * relèvent — une DDT n'a pas de code région propre.
   *
   * À la maille région, un code que le référentiel géographique ne connaît pas
   * est tout de même rendu, son libellé valant son code : le service n'a pas à
   * perdre le filtre d'une partie de son territoire parce qu'une ligne manque
   * dans `imports.region`. Rien de tel n'est possible à la maille département —
   * un code départemental inconnu ne désigne aucune région.
   */
  async listRegions(
    { national, maille, codes }: PerimetreCouvert,
    tx?: Db
  ): Promise<RegionPerimetre[]> {
    const db = tx ?? this.databaseService.db;
    const colonnes = { code: regionTable.code, libelle: regionTable.libelle };

    if (national) {
      return db
        .select(colonnes)
        .from(regionTable)
        .orderBy(asc(regionTable.libelle));
    }

    if (codes.length === 0) {
      return [];
    }

    if (maille === 'departement') {
      return db
        .selectDistinct(colonnes)
        .from(regionTable)
        .innerJoin(
          departementTable,
          eq(departementTable.regionCode, regionTable.code)
        )
        .where(inArray(departementTable.code, codes))
        .orderBy(asc(regionTable.libelle));
    }

    const connues = await db
      .select(colonnes)
      .from(regionTable)
      .where(inArray(regionTable.code, codes));

    const parCode = new Map(connues.map((region) => [region.code, region]));
    return codes
      .map((code) => parCode.get(code) ?? { code, libelle: code })
      .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
  }
}
