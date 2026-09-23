import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { labellisationTable } from '@tet/backend/referentiels/labellisations/labellisation.table';
import { snapshotTable } from '@tet/backend/referentiels/snapshots/snapshot.table';
import { SNAPSHOTS } from '@tet/backend/referentiels/snapshots/snapshots.constants';
import { utilisateurIdentiteOidcTable } from '@tet/backend/users/authentications/oidc/models/utilisateur-identite-oidc.table';
import type { OidcProvider } from '@tet/backend/users/authentications/oidc/oidc.models';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { CollectiviteRole } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { AirtableService } from '../../airtable/airtable.service';
import ConfigurationService from '../../config/configuration.service';
import { DatabaseService } from '../../utils/database/database.service';

const REFERENTIELS = ['cae', 'eci', 'te'] as const;
type Referentiel = (typeof REFERENTIELS)[number];

const ROLE_LABELS: Record<CollectiviteRole, string> = {
  lecture: 'Lecture',
  edition_fiches_indicateurs: 'Édition fiches et indicateurs',
  edition: 'Édition',
  admin: 'Admin',
};

const PROVIDER_LABELS: Record<OidcProvider, string> = {
  proconnect: 'ProConnect',
  moncompteademe: 'MonCompteAdeme',
};

export type CrmNoteData = {
  email: string;
  user: {
    prenom: string | null;
    nom: string | null;
    createdAt: string | null;
  } | null;
  identites: { provider: OidcProvider; email: string }[];
  collectivites: {
    id: number;
    nom: string;
    role: CollectiviteRole | null;
    ficheCrmUrl?: string;
    referentiels: {
      referentiel: Referentiel;
      realise: number | null;
      programme: number | null;
      etoiles: number | null;
      anneeLabellisation: number | null;
    }[];
    plans: { id: number; nom: string | null }[];
  }[];
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });

const formatPercent = (value: number) =>
  `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;

const toPercent = (points: number, potentiel: number) =>
  potentiel > 0 ? (points * 100) / potentiel : null;

export const formatCrmNote = (
  data: CrmNoteData,
  appUrl: string | undefined
): string => {
  if (!data.user) {
    return `👤 Aucun compte TeT pour ${data.email}`;
  }

  const { prenom, nom, createdAt } = data.user;
  const lines = [
    `👤 ${[prenom, nom].filter(Boolean).join(' ') || data.email}${
      createdAt ? ` — compte TeT créé le ${formatDate(createdAt)}` : ''
    }`,
    data.identites.length
      ? data.identites
          .map(
            (identite) =>
              `🔐 ProConnect : ${identite.email} (${
                PROVIDER_LABELS[identite.provider]
              })`
          )
          .join('\n')
      : '🔐 Connexion par email (pas de ProConnect)',
  ];

  if (!data.collectivites.length) {
    lines.push('', '🏛 Rattaché à aucune collectivité');
  }

  for (const collectivite of data.collectivites) {
    const collectiviteUrl = appUrl
      ? `${appUrl}/collectivite/${collectivite.id}`
      : undefined;
    lines.push(
      '',
      `🏛 ${collectivite.nom}${
        collectivite.role ? ` — ${ROLE_LABELS[collectivite.role]}` : ''
      }`
    );
    if (collectivite.ficheCrmUrl) {
      lines.push(`   Fiche CRM : ${collectivite.ficheCrmUrl}`);
    }

    if (collectivite.referentiels.length) {
      lines.push('   Référentiels :');
      for (const ref of collectivite.referentiels) {
        const labellisation = ref.etoiles
          ? `${ref.etoiles}★${
              ref.anneeLabellisation ? ` (${ref.anneeLabellisation})` : ''
            }`
          : 'non labellisée';
        const scores = [
          ref.realise !== null ? `réalisé ${formatPercent(ref.realise)}` : null,
          ref.programme !== null
            ? `programmé ${formatPercent(ref.programme)}`
            : null,
        ].filter(Boolean);
        lines.push(
          `     • ${ref.referentiel.toUpperCase()} : ${[
            labellisation,
            ...scores,
          ].join(' · ')}`
        );
      }
    }

    lines.push(
      `   Plans (${collectivite.plans.length})${
        collectiviteUrl && collectivite.plans.length
          ? ` : ${collectiviteUrl}/plans`
          : ''
      }`
    );
    for (const plan of collectivite.plans) {
      lines.push(
        `     • ${plan.nom || 'Sans titre'}${
          collectiviteUrl ? ` → ${collectiviteUrl}/plans/${plan.id}` : ''
        }`
      );
    }
  }

  return lines.join('\n');
};

@Injectable()
export class BuildCrispCrmNoteService {
  private readonly logger = new Logger(BuildCrispCrmNoteService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly airtableService: AirtableService,
    private readonly configurationService: ConfigurationService
  ) {}

  async buildCrmNote(email: string): Promise<string> {
    const data = await this.getCrmNoteData(email.trim().toLowerCase());
    return formatCrmNote(data, this.configurationService.get('APP_URL'));
  }

  private async getCrmNoteData(email: string): Promise<CrmNoteData> {
    const db = this.databaseService.db;

    const [user] = await db
      .select({
        id: authUsersTable.id,
        createdAt: authUsersTable.createdAt,
        prenom: dcpTable.prenom,
        nom: dcpTable.nom,
      })
      .from(authUsersTable)
      .leftJoin(dcpTable, eq(dcpTable.id, authUsersTable.id))
      .where(eq(sql`lower(${authUsersTable.email})`, email));

    if (!user) {
      return { email, user: null, identites: [], collectivites: [] };
    }

    const [identites, droits] = await Promise.all([
      db
        .select({
          provider: utilisateurIdentiteOidcTable.provider,
          email: utilisateurIdentiteOidcTable.email,
        })
        .from(utilisateurIdentiteOidcTable)
        .where(eq(utilisateurIdentiteOidcTable.userId, user.id)),
      db
        .select({
          id: collectiviteTable.id,
          nom: collectiviteTable.nom,
          role: utilisateurCollectiviteAccessTable.role,
        })
        .from(utilisateurCollectiviteAccessTable)
        .innerJoin(
          collectiviteTable,
          eq(
            collectiviteTable.id,
            utilisateurCollectiviteAccessTable.collectiviteId
          )
        )
        .where(
          and(
            eq(utilisateurCollectiviteAccessTable.userId, user.id),
            eq(utilisateurCollectiviteAccessTable.isActive, true)
          )
        )
        .orderBy(asc(collectiviteTable.nom)),
    ]);

    const collectiviteIds = droits.map((droit) => droit.id);
    const [plans, scores, labellisations, ficheCrmUrls] = collectiviteIds.length
      ? await Promise.all([
          db
            .select({
              id: axeTable.id,
              nom: axeTable.nom,
              collectiviteId: axeTable.collectiviteId,
            })
            .from(axeTable)
            .where(
              and(
                inArray(axeTable.collectiviteId, collectiviteIds),
                isNull(axeTable.parent)
              )
            )
            .orderBy(asc(axeTable.nom)),
          db
            .select({
              collectiviteId: snapshotTable.collectiviteId,
              referentiel: snapshotTable.referentielId,
              pointFait: snapshotTable.pointFait,
              pointProgramme: snapshotTable.pointProgramme,
              pointPotentiel: snapshotTable.pointPotentiel,
            })
            .from(snapshotTable)
            .where(
              and(
                inArray(snapshotTable.collectiviteId, collectiviteIds),
                eq(snapshotTable.ref, SNAPSHOTS.SCORE_COURANT_REF)
              )
            ),
          db
            .select({
              collectiviteId: labellisationTable.collectiviteId,
              referentiel: labellisationTable.referentiel,
              etoiles: labellisationTable.etoiles,
              annee: labellisationTable.annee,
            })
            .from(labellisationTable)
            .where(inArray(labellisationTable.collectiviteId, collectiviteIds))
            .orderBy(desc(labellisationTable.obtenueLe)),
          // Les fiches CRM sont un plus : une panne Airtable ne doit pas priver
          // l'opérateur du reste de la note.
          this.airtableService
            .getCollectiviteUrlsByIds(collectiviteIds)
            .catch((error) => {
              this.logger.warn(
                `Fiches CRM des collectivités indisponibles : ${getErrorMessage(
                  error
                )}`
              );
              return new Map<number, string>();
            }),
        ])
      : [[], [], [], new Map<number, string>()];

    return {
      email,
      user: {
        prenom: user.prenom,
        nom: user.nom,
        createdAt: user.createdAt,
      },
      identites,
      collectivites: droits.map((droit) => ({
        ...droit,
        ficheCrmUrl: ficheCrmUrls.get(droit.id),
        plans: plans.filter((plan) => plan.collectiviteId === droit.id),
        referentiels: REFERENTIELS.flatMap((referentiel) => {
          const score = scores.find(
            (s) =>
              s.collectiviteId === droit.id && s.referentiel === referentiel
          );
          // Triées par date d'obtention décroissante : la première est la plus récente.
          const labellisation = labellisations.find(
            (l) =>
              l.collectiviteId === droit.id && l.referentiel === referentiel
          );
          if (!score && !labellisation) {
            return [];
          }
          return [
            {
              referentiel,
              realise: score
                ? toPercent(score.pointFait, score.pointPotentiel)
                : null,
              programme: score
                ? toPercent(score.pointProgramme, score.pointPotentiel)
                : null,
              etoiles: labellisation?.etoiles ?? null,
              anneeLabellisation: labellisation?.annee ?? null,
            },
          ];
        }),
      })),
    };
  }
}
