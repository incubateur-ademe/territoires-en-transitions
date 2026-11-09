import { Injectable } from '@nestjs/common';
import { collectiviteRelationsTable } from '@tet/backend/collectivites/shared/models/collectivite-relations.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarchePcaetCollectiviteCouverteTable } from '@tet/backend/demarches/shared/models/demarche-pcaet-collectivite-couverte.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  collectiviteNature,
  type CollectiviteNatureType,
} from '@tet/domain/collectivites';
import {
  DEMARCHE_PCAET_ABOUTIES_STATUSES,
  DEMARCHE_PCAET_EN_COURS_STATUSES,
  DemarcheTypeEnum,
  estNaturePorteusePcaet,
  type DemarchePcaetStatus,
  type CollectiviteCouverte,
  type EngagementPcaet,
  type EpciCandidat,
} from '@tet/domain/demarches';
import { alias } from 'drizzle-orm/pg-core';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

const NATURES_EPCI_FP = collectiviteNature.filter(estNaturePorteusePcaet);

const toDerniereDemarche = (
  demarche: { status: DemarchePcaetStatus; dateDebut: string } | undefined
): EpciCandidat['derniereDemarche'] =>
  demarche ? { status: demarche.status, dateDebut: demarche.dateDebut } : null;

const dateDebut = sql<string>`to_char(coalesce(${demarcheTable.launchedAt}, ${demarcheTable.createdAt}) at time zone 'Europe/Paris', 'YYYY-MM-DD')`;

/**
 * Le périmètre du PCAET d'un Supra : les EPCI à fiscalité propre qu'il couvre.
 */
@Injectable()
export class DemarchePcaetPerimetreRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getNatureInsee(
    collectiviteId: number,
    tx?: Transaction
  ): Promise<CollectiviteNatureType | null> {
    const db = tx ?? this.databaseService.db;
    const [row] = await db
      .select({ natureInsee: collectiviteTable.natureInsee })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, collectiviteId))
      .limit(1);
    return row?.natureInsee ?? null;
  }

  /**
   * Les EPCI à fiscalité propre membres du Supra d'après les relations BANATIC
   * (`collectivite_relations`), avec la dernière démarche PCAET de chacun, la
   * sienne ou le dépôt d'un Supra qui le couvre.
   */
  async listEpciCandidats(
    porteurId: number,
    tx?: Transaction
  ): Promise<EpciCandidat[]> {
    const db = tx ?? this.databaseService.db;

    const epcis = await db
      .select({
        id: collectiviteTable.id,
        nom: collectiviteTable.nom,
        departementCode: collectiviteTable.departementCode,
      })
      .from(collectiviteRelationsTable)
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, collectiviteRelationsTable.id)
      )
      .where(
        and(
          eq(collectiviteRelationsTable.parentId, porteurId),
          inArray(collectiviteTable.natureInsee, NATURES_EPCI_FP)
        )
      )
      .orderBy(asc(collectiviteTable.nom));

    if (epcis.length === 0) {
      return [];
    }

    const epciIds = epcis.map(({ id }) => id);
    const estPcaet = eq(demarcheTable.type, DemarcheTypeEnum.PCAET);
    const colonnes = {
      status: demarcheTable.status,
      dateDebut,
      creeLe:
        sql<number>`extract(epoch from ${demarcheTable.createdAt})`.mapWith(
          Number
        ),
    };
    // Ses propres démarches et les dépôts de Supra qui le couvrent : la plus
    // récente l'emporte.
    const [propres, viaSupra] = await Promise.all([
      db
        .select({ collectiviteId: demarcheTable.collectiviteId, ...colonnes })
        .from(demarcheTable)
        .where(and(estPcaet, inArray(demarcheTable.collectiviteId, epciIds))),
      db
        .select({
          collectiviteId: demarchePcaetCollectiviteCouverteTable.collectiviteId,
          ...colonnes,
        })
        .from(demarchePcaetCollectiviteCouverteTable)
        .innerJoin(
          demarcheTable,
          eq(
            demarcheTable.id,
            demarchePcaetCollectiviteCouverteTable.demarcheId
          )
        )
        .where(
          and(
            estPcaet,
            inArray(
              demarchePcaetCollectiviteCouverteTable.collectiviteId,
              epciIds
            )
          )
        ),
    ]);

    const derniereParEpci = new Map<
      number,
      { status: DemarchePcaetStatus; dateDebut: string; creeLe: number }
    >();
    for (const { collectiviteId, ...demarche } of [...propres, ...viaSupra]) {
      const retenue = derniereParEpci.get(collectiviteId);
      if (!retenue || demarche.creeLe > retenue.creeLe) {
        derniereParEpci.set(collectiviteId, demarche);
      }
    }
    const engagements = await this.listEngagementsEnCours(
      epcis.map((epci) => epci.id),
      tx
    );

    return epcis.map((epci) => ({
      ...epci,
      derniereDemarche: toDerniereDemarche(derniereParEpci.get(epci.id)),
      engagement: engagements.get(epci.id) ?? null,
    }));
  }

  /**
   * La démarche PCAET en cours qui engage chaque collectivité : la sienne, ou
   * le dépôt d'un Supra qui la couvre. Absente de la map si rien ne l'engage.
   */
  async listEngagementsEnCours(
    collectiviteIds: number[],
    tx?: Transaction
  ): Promise<Map<number, EngagementPcaet>> {
    const engagements = new Map<number, EngagementPcaet>();
    if (collectiviteIds.length === 0) {
      return engagements;
    }
    const db = tx ?? this.databaseService.db;
    const enCours = and(
      eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
      inArray(demarcheTable.status, [...DEMARCHE_PCAET_EN_COURS_STATUSES])
    );
    const porteurTable = alias(collectiviteTable, 'porteur');

    const [propres, couvertes] = await Promise.all([
      db
        .select({ collectiviteId: demarcheTable.collectiviteId, dateDebut })
        .from(demarcheTable)
        .where(
          and(enCours, inArray(demarcheTable.collectiviteId, collectiviteIds))
        ),
      db
        .select({
          collectiviteId: demarchePcaetCollectiviteCouverteTable.collectiviteId,
          porteurId: porteurTable.id,
          porteurNom: porteurTable.nom,
          dateDebut,
        })
        .from(demarchePcaetCollectiviteCouverteTable)
        .innerJoin(
          demarcheTable,
          eq(
            demarcheTable.id,
            demarchePcaetCollectiviteCouverteTable.demarcheId
          )
        )
        .innerJoin(
          porteurTable,
          eq(porteurTable.id, demarcheTable.collectiviteId)
        )
        .where(
          and(
            enCours,
            inArray(
              demarchePcaetCollectiviteCouverteTable.collectiviteId,
              collectiviteIds
            )
          )
        ),
    ]);

    for (const {
      collectiviteId,
      porteurId,
      porteurNom,
      dateDebut,
    } of couvertes) {
      engagements.set(collectiviteId, {
        porteur: { id: porteurId, nom: porteurNom },
        dateDebut,
      });
    }
    for (const { collectiviteId, dateDebut } of propres) {
      engagements.set(collectiviteId, { porteur: null, dateDebut });
    }
    return engagements;
  }

  /**
   * Sérialise les créations qui touchent ces collectivités jusqu'à la fin de la
   * transaction : sans ce verrou, un Supra et un EPCI membre qui déposent en
   * même temps passeraient tous deux la vérification d'engagement.
   *
   * `FOR NO KEY UPDATE` ne bloque pas les insertions qui référencent ces
   * collectivités par clé étrangère.
   */
  async lockCollectivites(
    collectiviteIds: number[],
    tx: Transaction
  ): Promise<void> {
    await tx
      .select({ id: collectiviteTable.id })
      .from(collectiviteTable)
      .where(inArray(collectiviteTable.id, collectiviteIds))
      .orderBy(asc(collectiviteTable.id))
      .for('no key update');
  }

  /**
   * Le périmètre du dernier dépôt mené à son terme par le porteur : c'est lui
   * qu'un renouvellement reprend. Vide si le porteur n'a jamais abouti, ou si
   * son dernier dépôt abouti ne couvrait aucun EPCI.
   */
  async getPerimetrePrecedent(
    porteurId: number,
    tx?: Transaction
  ): Promise<number[]> {
    const db = tx ?? this.databaseService.db;

    const [precedent] = await db
      .select({ id: demarcheTable.id })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.collectiviteId, porteurId),
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
          inArray(demarcheTable.status, [...DEMARCHE_PCAET_ABOUTIES_STATUSES])
        )
      )
      .orderBy(desc(demarcheTable.createdAt))
      .limit(1);

    if (!precedent) {
      return [];
    }

    const rows = await db
      .select({
        collectiviteId: demarchePcaetCollectiviteCouverteTable.collectiviteId,
      })
      .from(demarchePcaetCollectiviteCouverteTable)
      .where(
        eq(demarchePcaetCollectiviteCouverteTable.demarcheId, precedent.id)
      );
    return rows.map((row) => row.collectiviteId);
  }

  /**
   * Les dépôts PCAET, quel que soit leur statut, qui couvrent la collectivité,
   * avec leur porteur.
   */
  async listDemarchesCouvrantes(
    collectiviteId: number,
    tx?: Transaction
  ): Promise<
    {
      demarcheId: number;
      porteur: {
        id: number;
        nom: string;
        natureInsee: CollectiviteNatureType | null;
      };
    }[]
  > {
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select({
        demarcheId: demarcheTable.id,
        porteurId: collectiviteTable.id,
        porteurNom: collectiviteTable.nom,
        porteurNature: collectiviteTable.natureInsee,
      })
      .from(demarchePcaetCollectiviteCouverteTable)
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, demarchePcaetCollectiviteCouverteTable.demarcheId)
      )
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, demarcheTable.collectiviteId)
      )
      .where(
        and(
          eq(
            demarchePcaetCollectiviteCouverteTable.collectiviteId,
            collectiviteId
          ),
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET)
        )
      );
    return rows.map(({ demarcheId, porteurId, porteurNom, porteurNature }) => ({
      demarcheId,
      porteur: { id: porteurId, nom: porteurNom, natureInsee: porteurNature },
    }));
  }

  /**
   * L'utilisateur est-il membre actif d'un EPCI que couvre cette démarche de
   * ce porteur ? Le porteur est dans la requête : une démarche d'une autre
   * collectivité ne s'ouvre pas sous son identifiant.
   */
  async isMembreDUneCollectiviteCouverte(
    {
      demarcheId,
      porteurId,
      userId,
    }: { demarcheId: number; porteurId: number; userId: string },
    tx?: Transaction
  ): Promise<boolean> {
    const db = tx ?? this.databaseService.db;
    const [row] = await db
      .select({ id: demarcheTable.id })
      .from(demarchePcaetCollectiviteCouverteTable)
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, demarchePcaetCollectiviteCouverteTable.demarcheId)
      )
      .innerJoin(
        utilisateurCollectiviteAccessTable,
        eq(
          utilisateurCollectiviteAccessTable.collectiviteId,
          demarchePcaetCollectiviteCouverteTable.collectiviteId
        )
      )
      .where(
        and(
          eq(demarcheTable.id, demarcheId),
          eq(demarcheTable.collectiviteId, porteurId),
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.isActive, true)
        )
      )
      .limit(1);
    return row !== undefined;
  }

  async isMembreActif(
    { collectiviteId, userId }: { collectiviteId: number; userId: string },
    tx?: Transaction
  ): Promise<boolean> {
    const db = tx ?? this.databaseService.db;
    const [row] = await db
      .select({ id: utilisateurCollectiviteAccessTable.id })
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId),
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.isActive, true)
        )
      )
      .limit(1);
    return row !== undefined;
  }

  async insertCollectivitesCouvertes(
    {
      demarcheId,
      collectiviteIds,
      userId,
    }: { demarcheId: number; collectiviteIds: number[]; userId: string },
    tx: Transaction
  ): Promise<void> {
    if (collectiviteIds.length === 0) {
      return;
    }
    await tx.insert(demarchePcaetCollectiviteCouverteTable).values(
      collectiviteIds.map((collectiviteId) => ({
        demarcheId,
        collectiviteId,
        createdBy: userId,
      }))
    );
  }

  async listCollectivitesCouvertes(
    demarcheIds: number[],
    tx?: Transaction
  ): Promise<Map<number, CollectiviteCouverte[]>> {
    const parDemarche = new Map<number, CollectiviteCouverte[]>();
    if (demarcheIds.length === 0) {
      return parDemarche;
    }
    const db = tx ?? this.databaseService.db;

    const rows = await db
      .select({
        demarcheId: demarchePcaetCollectiviteCouverteTable.demarcheId,
        id: collectiviteTable.id,
        nom: collectiviteTable.nom,
      })
      .from(demarchePcaetCollectiviteCouverteTable)
      .innerJoin(
        collectiviteTable,
        eq(
          collectiviteTable.id,
          demarchePcaetCollectiviteCouverteTable.collectiviteId
        )
      )
      .where(
        inArray(demarchePcaetCollectiviteCouverteTable.demarcheId, demarcheIds)
      )
      .orderBy(asc(collectiviteTable.nom));

    for (const { demarcheId, ...collectivite } of rows) {
      const couvertes = parDemarche.get(demarcheId) ?? [];
      couvertes.push(collectivite);
      parDemarche.set(demarcheId, couvertes);
    }
    return parDemarche;
  }
}
