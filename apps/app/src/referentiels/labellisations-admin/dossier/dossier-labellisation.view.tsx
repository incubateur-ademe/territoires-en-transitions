'use client';

import { appLabels } from '@/app/labels/catalog';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { DetailedAction } from '@/app/ui/detailed-action/detailed-action.layout';
import { MetadataItem, MetadataLine } from '@/app/ui/metadata-line';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import {
  Badge,
  Button,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';
import { useEffect } from 'react';
import {
  DossierLabellisationDetail,
  useDownloadActeEngagement,
  useGetDossierLabellisation,
} from '../data/use-dossiers-labellisation';
import {
  formatDate,
  formatShortDate,
  statutBadgeVariant,
} from '../labellisations-admin.utils';
import { Etoiles } from '../labellisations-admin.etoiles';
import { ReferentielBadge } from '../labellisations-admin.referentiel-badge';
import { DossierLabellisationDecision } from './dossier-labellisation.decision';
import {
  AuditeursEditor,
  DemandeEtoileItem,
  DemandeSujetItem,
} from './dossier-labellisation.fields';
import { DossierSection } from './dossier-labellisation.section';

/** Détail d'un dossier, affiché dans le side panel de la liste. */
export const DossierLabellisationView = ({ auditId }: { auditId: number }) => {
  const {
    data: dossier,
    isLoading,
    isError,
    refetch,
  } = useGetDossierLabellisation(auditId);
  const { setTitle } = useSidePanel();

  useEffect(() => {
    if (dossier) {
      setTitle(dossier.collectiviteNom);
    }
  }, [dossier, setTitle]);

  if (isLoading) {
    return (
      <div className="flex py-12">
        <SpinnerLoader className="m-auto" />
      </div>
    );
  }
  if (isError || !dossier) {
    return (
      <ErrorCard
        title={appLabels.uneErreurEstSurvenue}
        retry={() => refetch()}
      />
    );
  }

  const isClos = dossier.statut === 'clos';
  const isPremiereEtoile = dossier.statut === 'premiere_etoile_a_valider';

  return (
    <div
      className="flex flex-col gap-6"
      data-test="referentiels.labellisations-admin.dossier"
    >
      {/* Le panneau est trop étroit pour une ligne : un élément par ligne. */}
      <MetadataLine className="flex-col items-start">
        <MetadataItem
          hideSeparator
          icon="book-2-line"
          label={appLabels.labellisationsAdminReferentiel}
          value={
            <ReferentielBadge referentielId={dossier.referentielId} size="md" />
          }
        />
        <MetadataItem
          hideSeparator
          icon="flag-line"
          label={appLabels.labellisationsAdminColonneStatut}
          value={
            <Badge
              size="sm"
              trim={false}
              variant={statutBadgeVariant(dossier)}
              title={appLabels.labellisationsAdminStatut[dossier.statut]}
            />
          }
        />
        <MetadataItem
          hideSeparator
          icon="calendar-event-line"
          label={appLabels.labellisationsAdminEnvoyeeLe}
          value={formatDate(dossier.envoyeeLe)}
          emptyLabel={appLabels.labellisationsAdminNonRenseigne}
        />
        <MetadataItem
          hideSeparator
          icon="user-line"
          label={appLabels.labellisationsAdminDemandeur}
          value={
            dossier.demandeur
              ? `${dossier.demandeur.prenom} ${dossier.demandeur.nom}`
              : null
          }
          emptyLabel={appLabels.labellisationsAdminNonRenseigne}
        />
        {dossier.auditAttribueLe && (
          <MetadataItem
            hideSeparator
            icon="calendar-check-line"
            label={appLabels.labellisationsAdminAuditAttribueLe}
            value={formatDate(dossier.auditAttribueLe)}
          />
        )}
      </MetadataLine>

      {/* Champs éditables, séparés des informations en lecture seule */}
      {(dossier.sujet || !isPremiereEtoile) && (
        <MetadataLine className="flex-col items-start pt-4 border-t border-grey-3">
          {dossier.sujet && (
            <DemandeSujetItem dossier={dossier} isReadOnly={isClos} />
          )}
          {dossier.sujet && dossier.sujet !== 'cot' && (
            <DemandeEtoileItem dossier={dossier} isReadOnly={isClos} />
          )}
          {!isPremiereEtoile && (
            <AuditeursEditor dossier={dossier} isClos={isClos} />
          )}
        </MetadataLine>
      )}

      {isPremiereEtoile && <AVerifierSection dossier={dossier} />}

      <HistoriqueSection dossier={dossier} />

      <DossierLabellisationDecision dossier={dossier} />
    </div>
  );
};

const AVerifierSection = ({
  dossier,
}: {
  dossier: DossierLabellisationDetail;
}) => {
  const { mutate: downloadActeEngagement } = useDownloadActeEngagement();

  return (
    <DossierSection title={appLabels.labellisationsAdminAVerifier}>
      <ul className="m-0 p-0 list-none flex flex-col gap-3">
        {/* En COT, la 1ère étoile ne demande aucune pièce. */}
        {!dossier.isCotActif &&
          (dossier.preuves.length === 0 ? (
            <li className="text-sm font-normal">
              {appLabels.labellisationsAdminAucunActeEngagement}
            </li>
          ) : (
            dossier.preuves.map(({ fichierId }) =>
              fichierId ? (
                <li key={fichierId}>
                  <DetailedAction.Item
                    small
                    icon="file-text-line"
                    label={appLabels.labellisationsAdminActeEngagement}
                  >
                    <Button
                      variant="underlined"
                      size="xs"
                      icon="download-line"
                      onClick={() =>
                        downloadActeEngagement({
                          auditId: dossier.auditId,
                          fichierId,
                        })
                      }
                    >
                      {appLabels.labellisationsAdminVoirDocument}
                    </Button>
                  </DetailedAction.Item>
                </li>
              ) : null
            )
          ))}
        <li>
          <DetailedAction.Item small icon="shield-check-line">
            {dossier.isCotActif
              ? appLabels.labellisationsAdminRienAVerifierCot
              : appLabels.labellisationsAdminCollectiviteHorsCot}
          </DetailedAction.Item>
        </li>
      </ul>
    </DossierSection>
  );
};

/**
 * Audits et labellisations passés de la collectivité sur le référentiel :
 * l'ADEME en déduit si un audit COT est initial ou final.
 */
const HistoriqueSection = ({
  dossier,
}: {
  dossier: DossierLabellisationDetail;
}) => {
  const items = [
    ...dossier.historique.map((audit) => ({
      key: `audit-${audit.auditId}`,
      date: audit.dateFin ?? audit.envoyeeLe ?? audit.dateDebut,
      sujet: audit.sujet,
      etoiles: audit.etoiles,
      statut: appLabels.labellisationsAdminStatut[audit.statut],
    })),
    // Labellisations sans audit sur la plateforme (1ères étoiles, reprises)
    ...dossier.labellisations
      .filter(
        (l) =>
          l.auditId !== dossier.auditId &&
          !dossier.historique.some((audit) => audit.auditId === l.auditId)
      )
      .map((l) => ({
        key: `labellisation-${l.id}`,
        date: l.obtenueLe,
        sujet: 'labellisation' as const,
        etoiles: l.etoiles,
        statut: appLabels.labellisationsAdminLabellisee,
      })),
  ].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  return (
    <DossierSection
      title={appLabels.labellisationsAdminHistorique}
      badge={
        <ReferentielBadge referentielId={dossier.referentielId} size="md" />
      }
    >
      {items.length === 0 ? (
        <p className="m-0 text-sm font-normal">
          {appLabels.labellisationsAdminHistoriqueVide}
        </p>
      ) : (
        <Table className="table-auto text-sm font-normal">
          <TableHead>
            <TableRow>
              <TableHeaderCell title={appLabels.labellisationsAdminDate} />
              <TableHeaderCell
                title={appLabels.labellisationsAdminColonneSujet}
              />
              <TableHeaderCell
                title={appLabels.labellisationsAdminColonneEtoile}
              />
              <TableHeaderCell
                title={appLabels.labellisationsAdminColonneStatut}
              />
            </TableRow>
          </TableHead>
          <tbody>
            {items.map((item) => (
              <TableRow key={item.key}>
                <TableCell>{formatShortDate(item.date) ?? '—'}</TableCell>
                <TableCell>
                  {item.sujet
                    ? appLabels.labellisationsAdminSujet[item.sujet]
                    : '—'}
                </TableCell>
                <TableCell>
                  {item.etoiles ? <Etoiles etoiles={item.etoiles} /> : '—'}
                </TableCell>
                <TableCell>{item.statut}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}
    </DossierSection>
  );
};
