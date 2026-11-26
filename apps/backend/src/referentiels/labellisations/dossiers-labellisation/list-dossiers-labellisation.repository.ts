import { Injectable } from '@nestjs/common';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { utilisateurSupportTable } from '@tet/backend/users/authorizations/roles/utilisateur-support.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ReferentielId } from '@tet/domain/referentiels';
import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  ne,
  not,
  or,
  SQL,
  sql,
} from 'drizzle-orm';
import { auditTable } from '../audit.table';
import { auditeurTable } from '../auditeur.table';
import { cotTable } from '../cot.table';
import { labellisationDemandeTable } from '../labellisation-demande.table';
import { labellisationTable } from '../labellisation.table';
import {
  GetActeEngagementDownloadUrlInput,
  ListDossiersLabellisationInput,
} from './dossiers-labellisation.input';

type Demandeur = Omit<Auditeur, 'userId'>;

type Auditeur = {
  userId: string;
  prenom: string;
  nom: string;
  email: string;
};

@Injectable()
export class ListDossiersLabellisationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private readonly db = this.databaseService.db;

  async getActeEngagementOfDossier({
    auditId,
    fichierId,
  }: GetActeEngagementDownloadUrlInput) {
    const [preuve] = await this.db
      .select({ collectiviteId: auditTable.collectiviteId })
      .from(auditTable)
      .innerJoin(
        preuveLabellisationTable,
        and(
          eq(preuveLabellisationTable.demandeId, auditTable.demandeId),
          eq(preuveLabellisationTable.collectiviteId, auditTable.collectiviteId)
        )
      )
      .where(
        and(
          eq(auditTable.id, auditId),
          eq(preuveLabellisationTable.fichierId, fichierId),
          eq(preuveLabellisationTable.objet, 'acte_engagement')
        )
      )
      .limit(1);
    return preuve;
  }

  listDossiers({
    includeClosed,
    referentielIds = [],
    sujets = [],
    search,
  }: Omit<ListDossiersLabellisationInput, 'statuts'> & {
    includeClosed: boolean;
  }) {
    return this.selectDossiers(
      and(
        // Les dossiers clos sont de loin les plus nombreux : on les écarte en
        // base quand le filtre ne les demande pas.
        !includeClosed ? not(auditTable.clos) : undefined,
        referentielIds.length
          ? inArray(auditTable.referentielId, referentielIds)
          : undefined,
        sujets.length
          ? inArray(labellisationDemandeTable.sujet, sujets)
          : undefined,
        search
          ? or(
              ilike(collectiviteTable.nom, `%${search}%`),
              // Au-delà d'un int4, l'id ne peut correspondre et Postgres lèverait une erreur
              /^\d{1,9}$/.test(search)
                ? eq(collectiviteTable.id, Number(search))
                : undefined
            )
          : undefined
      )
    );
  }

  async getDossier(auditId: number) {
    const [row] = await this.selectDossiers(eq(auditTable.id, auditId));
    return row;
  }

  listHistorique({
    collectiviteId,
    referentielId,
    auditId,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
    auditId: number;
  }) {
    return this.selectDossiers(
      and(
        eq(auditTable.collectiviteId, collectiviteId),
        eq(auditTable.referentielId, referentielId),
        ne(auditTable.id, auditId)
      )
    );
  }

  listLabellisations({
    collectiviteId,
    referentielId,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
  }) {
    return this.db
      .select({
        id: labellisationTable.id,
        auditId: labellisationTable.auditId,
        etoiles: labellisationTable.etoiles,
        obtenueLe: sqlToDateTimeISO(labellisationTable.obtenueLe),
        scoreRealise: labellisationTable.scoreRealise,
      })
      .from(labellisationTable)
      .where(
        and(
          eq(labellisationTable.collectiviteId, collectiviteId),
          eq(labellisationTable.referentiel, referentielId)
        )
      )
      .orderBy(desc(labellisationTable.obtenueLe));
  }

  listActesEngagement(demandeId: number) {
    return this.db
      .select({
        fichierId: preuveLabellisationTable.fichierId,
        objet: preuveLabellisationTable.objet,
      })
      .from(preuveLabellisationTable)
      .where(
        and(
          eq(preuveLabellisationTable.demandeId, demandeId),
          // Seule pièce exigée pour une 1ère étoile (aucune en COT)
          eq(preuveLabellisationTable.objet, 'acte_engagement'),
          isNotNull(preuveLabellisationTable.fichierId)
        )
      );
  }

  async getCot(collectiviteId: number) {
    const [cot] = await this.db
      .select({ actif: cotTable.actif })
      .from(cotTable)
      .where(eq(cotTable.collectiviteId, collectiviteId));
    return cot ?? null;
  }

  listAuditeurs() {
    return this.db
      .select({
        userId: dcpTable.id,
        prenom: dcpTable.prenom,
        nom: dcpTable.nom,
        email: dcpTable.email,
      })
      .from(utilisateurSupportTable)
      .innerJoin(dcpTable, eq(dcpTable.id, utilisateurSupportTable.userId))
      .where(
        and(
          eq(utilisateurSupportTable.hasRoleTeteAuditeur, true),
          eq(dcpTable.deleted, false)
        )
      )
      .orderBy(dcpTable.nom, dcpTable.prenom);
  }

  /**
   * Un dossier = un audit dont la demande a été envoyée ou qui a démarré. Les
   * audits « fantômes », créés vides à l'ouverture de la page labellisation
   * d'une collectivité, sont exclus (même filtre que l'ancienne vue Retool).
   */
  private selectDossiers(where: SQL | undefined) {
    return this.db
      .select({
        auditId: auditTable.id,
        collectiviteId: auditTable.collectiviteId,
        collectiviteNom: collectiviteTable.nom,
        referentielId: auditTable.referentielId,
        dateDebut: sqlToDateTimeISO(auditTable.dateDebut),
        dateFin: sqlToDateTimeISO(auditTable.dateFin),
        dateCnl: sqlToDateTimeISO(auditTable.dateCnl),
        valide: auditTable.valide,
        valideLabellisation: auditTable.valideLabellisation,
        clos: auditTable.clos,
        demandeId: labellisationDemandeTable.id,
        sujet: labellisationDemandeTable.sujet,
        etoiles: labellisationDemandeTable.etoiles,
        envoyeeLe: sqlToDateTimeISO(labellisationDemandeTable.envoyeeLe),
        demandeur: sql<Demandeur | null>`(
          select json_build_object(
            'prenom', ${dcpTable.prenom},
            'nom', ${dcpTable.nom},
            'email', ${dcpTable.email}
          )
          from ${dcpTable}
          where ${dcpTable.id} = ${labellisationDemandeTable.demandeur}
        )`,
        auditeurs: sql<Auditeur[]>`coalesce((
          select json_agg(json_build_object(
            'userId', ${dcpTable.id},
            'prenom', ${dcpTable.prenom},
            'nom', ${dcpTable.nom},
            'email', ${dcpTable.email}
          ) order by ${auditeurTable.createdAt})
          from ${auditeurTable}
          join ${dcpTable} on ${dcpTable.id} = ${auditeurTable.auditeur}
          where ${auditeurTable.auditId} = ${auditTable.id}
        ), '[]'::json)`,
        // Premier auditeur attribué au dossier
        auditAttribueLe: sqlToDateTimeISO(sql`(
          select min(${auditeurTable.createdAt})
          from ${auditeurTable}
          where ${auditeurTable.auditId} = ${auditTable.id}
        )`) as SQL<string | null>,
        labellisationObtenueLe: sqlToDateTimeISO(labellisationTable.obtenueLe),
        labellisationEtoiles: labellisationTable.etoiles,
      })
      .from(auditTable)
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, auditTable.collectiviteId)
      )
      .leftJoin(
        labellisationDemandeTable,
        and(
          eq(labellisationDemandeTable.id, auditTable.demandeId),
          eq(labellisationDemandeTable.enCours, false)
        )
      )
      .leftJoin(
        labellisationTable,
        and(
          eq(labellisationTable.auditId, auditTable.id),
          eq(labellisationTable.collectiviteId, auditTable.collectiviteId)
        )
      )
      .where(
        and(
          or(
            isNotNull(auditTable.dateDebut),
            isNotNull(labellisationDemandeTable.id)
          ),
          where
        )
      )
      .orderBy(
        auditTable.clos,
        sql`${labellisationDemandeTable.envoyeeLe} desc nulls last`,
        desc(auditTable.id)
      );
  }
}

export type DossierRow = Awaited<
  ReturnType<ListDossiersLabellisationRepository['listDossiers']>
>[number];
