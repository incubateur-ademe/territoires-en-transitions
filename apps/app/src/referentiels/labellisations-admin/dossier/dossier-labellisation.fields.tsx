'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  EtoileAsString,
  etoileAsStringEnumValues,
  SujetDemande,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import { MetadataItem } from '@/app/ui/metadata-line';
import {
  InlineEditWrapper,
  Modal,
  ModalFooterOKCancel,
  Select,
  SelectMultiple,
} from '@tet/ui';
import { useState } from 'react';
import { uniqBy } from 'es-toolkit';
import {
  DossierLabellisation,
  useAddAuditeur,
  useListAuditeurs,
  useRemoveAuditeur,
  useUpdateDemandeLabellisation,
} from '../data/use-dossiers-labellisation';
import { formatEtoile } from '../labellisations-admin.utils';

type DemandeItemProps = {
  dossier: DossierLabellisation;
  isReadOnly: boolean;
};

/** Sujet de la demande, éditable en place dans la ligne de métadonnées. */
export const DemandeSujetItem = ({ dossier, isReadOnly }: DemandeItemProps) => {
  const { mutate: updateDemande, isPending } = useUpdateDemandeLabellisation();
  const disabled = isReadOnly || isPending;
  return (
    <InlineEditWrapper
      disabled={disabled}
      renderOnEdit={({ openState }) => (
        <Select
          inlineEdit
          openState={openState}
          dataTest="referentiels.labellisations-admin.demande-sujet"
          options={Object.values(SujetDemandeEnum).map((value) => ({
            value,
            label: appLabels.labellisationsAdminSujet[value],
          }))}
          values={dossier.sujet ?? undefined}
          onChange={(value) => {
            const sujet = value as SujetDemande | undefined;
            if (!sujet) return;
            // Un audit COT seul ne porte pas d'étoile ; une labellisation en exige une
            updateDemande({
              auditId: dossier.auditId,
              sujet,
              etoiles: sujet === 'cot' ? null : dossier.etoiles ?? '1',
            });
          }}
        />
      )}
    >
      <MetadataItem
        hideSeparator
        interactive={!disabled}
        icon="file-list-3-line"
        label={appLabels.labellisationsAdminSujetLabel}
        value={
          dossier.sujet
            ? appLabels.labellisationsAdminSujet[dossier.sujet]
            : null
        }
      />
    </InlineEditWrapper>
  );
};

/** Étoile demandée, éditable en place dans la ligne de métadonnées. */
export const DemandeEtoileItem = ({
  dossier,
  isReadOnly,
}: DemandeItemProps) => {
  const { mutate: updateDemande, isPending } = useUpdateDemandeLabellisation();
  const { sujet } = dossier;
  const disabled = isReadOnly || isPending;
  return (
    <InlineEditWrapper
      disabled={disabled}
      renderOnEdit={({ openState }) => (
        <Select
          inlineEdit
          openState={openState}
          dataTest="referentiels.labellisations-admin.demande-etoile"
          options={etoileAsStringEnumValues.map((value) => ({
            value,
            label: formatEtoile(value),
          }))}
          values={dossier.etoiles ?? undefined}
          onChange={(value) =>
            value &&
            sujet &&
            updateDemande({
              auditId: dossier.auditId,
              sujet,
              etoiles: value as EtoileAsString,
            })
          }
        />
      )}
    >
      <MetadataItem
        hideSeparator
        interactive={!disabled}
        icon="star-line"
        label={appLabels.labellisationsAdminEtoileDemandee}
        value={dossier.etoiles ? formatEtoile(dossier.etoiles) : null}
      />
    </InlineEditWrapper>
  );
};

/** Auditeurs du dossier, choisis en place parmi les personnes ayant le rôle auditeur, ou ajoutés par email. */
export const AuditeursEditor = ({
  dossier,
  isClos,
}: {
  dossier: DossierLabellisation;
  isClos: boolean;
}) => {
  const { data: auditeurs, isLoading } = useListAuditeurs();
  const { mutate: addAuditeur, isPending: isAdding } = useAddAuditeur();
  const { mutate: removeAuditeur, isPending: isRemoving } = useRemoveAuditeur();
  const disabled = isClos || isAdding || isRemoving;
  // Email saisi hors de la liste : l'ajout donne le rôle auditeur, il est confirmé
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const toLabel = (p: { prenom: string; nom: string; email: string }) =>
    `${p.prenom} ${p.nom}`.trim() || p.email;

  // Les auditeurs déjà attribués restent affichés même s'ils ont perdu le rôle
  const options = uniqBy(
    [...dossier.auditeurs, ...(auditeurs ?? [])],
    (p) => p.userId
  ).map((p) => ({ value: p.userId, label: toLabel(p) }));

  return (
    <>
      <InlineEditWrapper
        disabled={disabled}
        renderOnEdit={({ openState }) => (
          <SelectMultiple
            inlineEdit
            isSearcheable
            openState={openState}
            isLoading={isLoading}
            dataTest="referentiels.labellisations-admin.auditeurs"
            options={options}
            values={dossier.auditeurs.map((a) => a.userId)}
            // Personne absente de la liste : ajoutée par son email, après confirmation
            createProps={{
              userCreatedOptions: [],
              onCreate: (email) => setPendingEmail(email.trim()),
            }}
            onChange={({ selectedValue }) => {
              const userId = String(selectedValue);
              const payload = { auditId: dossier.auditId, userId };
              if (dossier.auditeurs.some((a) => a.userId === userId)) {
                removeAuditeur(payload);
              } else {
                addAuditeur(payload);
              }
            }}
          />
        )}
      >
        <MetadataItem
          hideSeparator
          interactive={!disabled}
          icon="user-search-line"
          label={appLabels.labellisationsAdminAuditeurs}
          emptyLabel={
            isClos
              ? appLabels.labellisationsAdminAucunAuditeurAttribue
              : undefined
          }
          value={dossier.auditeurs.map(toLabel).join(', ') || null}
        />
      </InlineEditWrapper>
      {pendingEmail && (
        <Modal
          openState={{
            isOpen: true,
            setIsOpen: (isOpen) => !isOpen && setPendingEmail(null),
          }}
          title={appLabels.labellisationsAdminAjouterAuditeurParEmail}
          size="sm"
          render={() => (
            <p className="m-0 text-sm text-grey-8">
              {appLabels.labellisationsAdminAjouterAuditeurParEmailDescription(
                pendingEmail
              )}
            </p>
          )}
          renderFooter={({ close }) => (
            <ModalFooterOKCancel
              btnCancelProps={{ onClick: close, size: 'sm' }}
              btnOKProps={{
                size: 'sm',
                children: appLabels.labellisationsAdminAjouter,
                disabled: isAdding,
                'data-test':
                  'referentiels.labellisations-admin.ajouter-auditeur-email',
                onClick: () =>
                  addAuditeur(
                    { auditId: dossier.auditId, email: pendingEmail },
                    { onSuccess: () => setPendingEmail(null) }
                  ),
              }}
            />
          )}
        />
      )}
    </>
  );
};
