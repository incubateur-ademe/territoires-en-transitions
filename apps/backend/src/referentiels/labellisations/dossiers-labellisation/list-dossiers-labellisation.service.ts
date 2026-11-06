import { Injectable } from '@nestjs/common';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { utilisateurSupportTable } from '@tet/backend/users/authorizations/roles/utilisateur-support.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DOSSIER_LABELLISATION_STATUTS_PAR_DEFAUT,
  getDossierLabellisationStatut,
  ReferentielId,
} from '@tet/domain/referentiels';
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
import { checkLabellisationsAdmin } from './check-labellisations-admin.utils';
import {
  DossiersLabellisationError,
  DossiersLabellisationErrorEnum,
} from './dossiers-labellisation.errors';
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
export class ListDossiersLabellisationService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  private readonly db = this.databaseService.db;

  /**
   * Autorise le programme TETE à télécharger l'acte d'engagement d'un dossier,
   * même sans être membre de la collectivité : le fichier doit être rattaché
   * à la demande du dossier.
   */
  async checkActeEngagementOfDossier(
    { auditId, fichierId }: GetActeEngagementDownloadUrlInput,
    { user }: ServiceSecondArg
  ): Promise<Result<{ collectiviteId: number }, DossiersLabellisationError>> {
    const isAllowed = await checkLabellisationsAdmin(
      this.permissionService,
      user
    );
    if (!isAllowed.success) {
      return isAllowed;
    }

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
    if (!preuve) {
      return failure(DossiersLabellisationErrorEnum.DOSSIER_NOT_FOUND);
    }
    return success({ collectiviteId: preuve.collectiviteId });
  }

  async listDossiers(
    {
      statuts = [...DOSSIER_LABELLISATION_STATUTS_PAR_DEFAUT],
      referentielIds = [],
      sujets = [],
      search,
    }: ListDossiersLabellisationInput,
    { user }: ServiceSecondArg
  ) {
    const isAllowed = await checkLabellisationsAdmin(
      this.permissionService,
      user
    );
    if (!isAllowed.success) {
      return isAllowed;
    }

    const rows = await this.selectDossiers(
      and(
        // Les dossiers clos sont de loin les plus nombreux : on les écarte en
        // base quand le filtre ne les demande pas.
        statuts.length && !statuts.includes('clos')
          ? not(auditTable.clos)
          : undefined,
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

    // ponytail: pas de pagination, quelques centaines de dossiers au plus ; à
    // ajouter si la liste « tous » devient lente.
    // Le statut se déduit de l'audit et de la demande : il se filtre ici.
    return success(
      rows
        .map(toDossier)
        .filter(
          (dossier) => !statuts.length || statuts.includes(dossier.statut)
        )
    );
  }

  async getDossier(
    { auditId }: { auditId: number },
    { user }: ServiceSecondArg
  ) {
    const isAllowed = await checkLabellisationsAdmin(
      this.permissionService,
      user
    );
    if (!isAllowed.success) {
      return isAllowed;
    }

    const [row] = await this.selectDossiers(eq(auditTable.id, auditId));
    if (!row) {
      return failure(DossiersLabellisationErrorEnum.DOSSIER_NOT_FOUND);
    }
    const dossier = toDossier(row);

    const [historique, labellisations, preuves, cot] = await Promise.all([
      // Audits précédents de la collectivité sur le référentiel : l'ADEME en
      // déduit si un audit COT est initial ou final.
      this.selectDossiers(
        and(
          eq(auditTable.collectiviteId, dossier.collectiviteId),
          eq(auditTable.referentielId, dossier.referentielId),
          ne(auditTable.id, dossier.auditId)
        )
      ).then((rows) => rows.map(toDossier)),

      // Toutes les labellisations, y compris celles sans audit (1ères
      // étoiles, labellisations obtenues hors plateforme).
      this.db
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
            eq(labellisationTable.collectiviteId, dossier.collectiviteId),
            eq(labellisationTable.referentiel, dossier.referentielId)
          )
        )
        .orderBy(desc(labellisationTable.obtenueLe)),

      row.demandeId
        ? this.db
            .select({
              fichierId: preuveLabellisationTable.fichierId,
              objet: preuveLabellisationTable.objet,
            })
            .from(preuveLabellisationTable)
            .where(
              and(
                eq(preuveLabellisationTable.demandeId, row.demandeId),
                // Seule pièce exigée pour une 1ère étoile (aucune en COT)
                eq(preuveLabellisationTable.objet, 'acte_engagement'),
                isNotNull(preuveLabellisationTable.fichierId)
              )
            )
        : [],

      this.db
        .select({ actif: cotTable.actif })
        .from(cotTable)
        .where(eq(cotTable.collectiviteId, dossier.collectiviteId))
        .then((rows) => rows[0] ?? null),
    ]);

    return success({
      ...dossier,
      isCotActif: cot?.actif ?? false,
      preuves,
      historique,
      labellisations,
    });
  }

  /** Personnes ayant le rôle auditeur, proposées à l'attribution d'un dossier. */
  async listAuditeurs({ user }: ServiceSecondArg) {
    const isAllowed = await checkLabellisationsAdmin(
      this.permissionService,
      user
    );
    if (!isAllowed.success) {
      return isAllowed;
    }

    return success(
      await this.db
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
        .orderBy(dcpTable.nom, dcpTable.prenom)
    );
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

type DossierRow = Awaited<
  ReturnType<ListDossiersLabellisationService['selectDossiers']>
>[number];

function toDossier(row: DossierRow) {
  const demande = row.demandeId
    ? { etoiles: row.etoiles, sujet: row.sujet }
    : null;
  return {
    ...row,
    referentielId: row.referentielId as ReferentielId,
    statut: getDossierLabellisationStatut({ audit: row, demande }),
  };
}
