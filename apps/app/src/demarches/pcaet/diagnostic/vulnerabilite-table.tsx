'use client';

import {
  DEMARCHE_PCAET_VULNERABILITE_NIVEAU_LABELS,
  DEMARCHE_PCAET_VULNERABILITE_NIVEAU_VARIANTS,
} from '@/app/demarches/pcaet/constants';
import { appLabels } from '@/app/labels/catalog';
import {
  demarchePcaetVulnerabiliteNiveauValues,
  OBJECTIFS_MAX_LENGTH,
  VULNERABILITE_DOMAINE_LABEL_MAX,
  type DemarchePcaetVulnerabilite,
  type DemarchePcaetVulnerabiliteDomaine,
  type DemarchePcaetVulnerabiliteNiveau,
} from '@tet/domain/demarches';
import {
  Badge,
  Button,
  InfoTooltip,
  Input,
  Modal,
  ModalFooterOKCancel,
  Select,
  Table,
  TableCell,
  TableCellTextarea,
  TableHead,
  TableHeaderCell,
  TableRow,
  type TableCellProps,
} from '@tet/ui';
import { useState } from 'react';
import {
  useDemarchePcaetVulnerabilite,
  type AddDomaineFailure,
} from './data/use-vulnerabilite';
import {
  NIVEAU_COLUMNS,
  OBJECTIF_COLUMNS,
  toVulnerabiliteRows,
} from './vulnerabilite-table.rules';

type InlineEditRenderArgs = Parameters<
  NonNullable<NonNullable<TableCellProps['edit']>['renderOnEdit']>
>[0];
type InlineEditOpenState = InlineEditRenderArgs['openState'];

const niveauOptions = demarchePcaetVulnerabiliteNiveauValues.map((niveau) => ({
  value: niveau,
  label: DEMARCHE_PCAET_VULNERABILITE_NIVEAU_LABELS[niveau],
}));

const NiveauBadge = ({
  niveau,
}: {
  niveau: DemarchePcaetVulnerabiliteNiveau;
}) => (
  <Badge
    title={DEMARCHE_PCAET_VULNERABILITE_NIVEAU_LABELS[niveau]}
    variant={DEMARCHE_PCAET_VULNERABILITE_NIVEAU_VARIANTS[niveau]}
    size="sm"
    uppercase={true}
    trim={false}
  />
);

const NiveauSelect = ({
  value,
  onChange,
  openState,
}: {
  value: DemarchePcaetVulnerabiliteNiveau | null;
  onChange: (next: DemarchePcaetVulnerabiliteNiveau | null) => void;
  openState?: InlineEditOpenState;
}) => (
  <Select
    values={value ?? undefined}
    options={niveauOptions}
    onChange={(v) => {
      // Le Select appelle onChange(undefined) quand on reclique la valeur
      // déjà sélectionnée. On convertit cela en null pour effacer le niveau.
      onChange(v ? (v as DemarchePcaetVulnerabiliteNiveau) : null);
    }}
    inlineEdit
    openState={openState}
    custom={{
      renderOptionItem: (item) => (
        <NiveauBadge niveau={item.value as DemarchePcaetVulnerabiliteNiveau} />
      ),
    }}
  />
);

/**
 * Cellule de niveau. Vide au repos, avec une affordance atténuée plutôt
 * qu'invisible : au survol seul, seize lignes de cellules paraissaient
 * inertes sur écran tactile.
 */
const NiveauCell = ({
  domaineLabel,
  horizonLabel,
  niveau,
  isReadonly,
  onChange,
}: {
  domaineLabel: string;
  horizonLabel: string;
  niveau: DemarchePcaetVulnerabiliteNiveau | null;
  isReadonly: boolean;
  onChange: (next: DemarchePcaetVulnerabiliteNiveau | null) => void;
}) => (
  <TableCell
    className="group/niveau"
    canEdit={!isReadonly}
    // Sans nom composé, les 48 cellules du tableau sont homonymes au lecteur
    // d'écran : ni le domaine ni l'horizon ne ressortent du badge seul.
    aria-label={appLabels.demarcheVulnerabiliteCelluleNiveau({
      domaine: domaineLabel,
      horizon: horizonLabel,
      niveau:
        niveau === null
          ? appLabels.demarcheVulnerabiliteNiveauNonRenseigne
          : DEMARCHE_PCAET_VULNERABILITE_NIVEAU_LABELS[niveau],
    })}
    edit={{
      renderOnEdit: ({ openState }) => (
        <NiveauSelect
          value={niveau}
          openState={openState}
          onChange={(next) => {
            onChange(next);
            openState.setIsOpen(false);
          }}
        />
      ),
    }}
  >
    {niveau !== null ? (
      <NiveauBadge niveau={niveau} />
    ) : (
      <span
        aria-hidden
        className="text-sm text-grey-8 opacity-60 transition-opacity group-hover/niveau:opacity-100 group-focus-visible/niveau:opacity-100"
      >
        {isReadonly ? '' : appLabels.demarcheVulnerabiliteAjouterNiveau}
      </span>
    )}
  </TableCell>
);

/**
 * Cellule d'objectif. Rien n'est exigé sur ce volet : toutes les cellules
 * invitent de la même façon, quel que soit le niveau de l'horizon.
 *
 * Le brouillon vaut `null` tant que rien n'est saisi : l'affichage retombe
 * alors sur la valeur serveur. Sans cela, un brouillon figé au premier rendu
 * réécrivait une valeur périmée dès la fermeture suivante de la cellule.
 */
const ObjectifCell = ({
  domaineLabel,
  horizonLabel,
  value,
  isReadonly,
  onCommit,
}: {
  domaineLabel: string;
  horizonLabel: string;
  value: string | null;
  isReadonly: boolean;
  onCommit: (next: string) => void;
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const texte = draft ?? value ?? '';

  return (
    <TableCell
      className="align-top"
      canEdit={!isReadonly}
      aria-label={appLabels.demarcheVulnerabiliteCelluleObjectifs({
        domaine: domaineLabel,
        horizon: horizonLabel,
        renseigne: Boolean(value),
      })}
      edit={{
        floatingMatchReferenceHeight: false,
        onClose: () => {
          if (draft !== null && draft.trim() !== (value ?? '').trim()) {
            onCommit(draft.trim());
          }
          setDraft(null);
        },
        renderOnEdit: ({ openState }) => (
          <TableCellTextarea
            value={texte}
            maxLength={OBJECTIFS_MAX_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            closeEditing={() => openState.setIsOpen(false)}
            placeholder={appLabels.demarcheVulnerabiliteObjectifs}
            className="text-primary-9"
          />
        ),
      }}
    >
      <span
        className={`line-clamp-3 text-sm ${
          value ? 'text-primary-9' : 'text-grey-8'
        }`}
      >
        {value ||
          (isReadonly ? '' : appLabels.demarcheVulnerabiliteObjectifs)}
      </span>
    </TableCell>
  );
};

/**
 * Corbeille de la case du domaine. Le clic est arrêté avant la cellule :
 * celle-ci ouvre l'édition du libellé, retirer et renommer ne doivent pas se
 * déclencher ensemble.
 */
const SupprimerDomaineButton = ({
  domaine,
  onRemove,
}: {
  domaine: DemarchePcaetVulnerabiliteDomaine;
  onRemove: () => void;
}) => (
  <span
    className="inline-flex opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
    onClick={(e) => e.stopPropagation()}
    onKeyDown={(e) => e.stopPropagation()}
  >
    <Modal
      title={appLabels.demarcheVulnerabiliteSupprimerDomaineTitre}
      subTitle={appLabels.demarcheVulnerabiliteSupprimerDomaineDescription({
        label: domaine.label,
      })}
      render={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            // Une action destructrice se nomme : « Valider » ne dit pas ce
            // qu'on valide.
            children: appLabels.demarcheVulnerabiliteSupprimerDomaineConfirmer,
            onClick: () => {
              onRemove();
              close();
            },
          }}
        />
      )}
    >
      <Button
        icon="delete-bin-line"
        variant="white"
        size="xs"
        className="text-grey-8 hover:text-error-1"
        aria-label={appLabels.demarcheVulnerabiliteSupprimerDomaineNomme({
          label: domaine.label,
        })}
        title={appLabels.demarcheVulnerabiliteSupprimerDomaine}
      />
    </Modal>
  </span>
);

/**
 * Première colonne. La corbeille se range à droite de la case du domaine : au
 * bout de la ligne, elle imposait un défilement horizontal pour retirer un
 * domaine, et à gauche elle empiétait sur le libellé. Le créneau est réservé
 * sur toutes les lignes pour que les libellés restent alignés.
 */
const DomaineCell = ({
  domaine,
  isReadonly,
  onRename,
  onRemove,
}: {
  domaine: DemarchePcaetVulnerabiliteDomaine;
  isReadonly: boolean;
  onRename: (label: string) => void;
  onRemove: () => void;
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const isEditable = !isReadonly && !domaine.isSocle;

  const contenu = (
    <div className="flex items-start gap-1">
      <span className="grow text-sm text-primary-9">{domaine.label}</span>
      <span className="w-6 shrink-0">
        {isEditable && (
          <SupprimerDomaineButton domaine={domaine} onRemove={onRemove} />
        )}
      </span>
    </div>
  );

  if (!isEditable) {
    return (
      <TableCell pinnedLeft className="pr-2 font-medium">
        {contenu}
      </TableCell>
    );
  }

  return (
    <TableCell
      pinnedLeft
      className="pr-2 font-medium"
      canEdit
      aria-label={appLabels.demarcheVulnerabiliteCelluleDomaine({
        label: domaine.label,
      })}
      edit={{
        floatingMatchReferenceHeight: false,
        onClose: () => {
          const trimmed = draft?.trim();
          if (trimmed && trimmed !== domaine.label) {
            onRename(trimmed);
          }
          setDraft(null);
        },
        renderOnEdit: ({ openState }) => (
          <TableCellTextarea
            value={draft ?? domaine.label}
            maxLength={VULNERABILITE_DOMAINE_LABEL_MAX}
            onChange={(e) => setDraft(e.target.value)}
            closeEditing={() => openState.setIsOpen(false)}
            placeholder={appLabels.demarcheVulnerabiliteNomDomaine}
            className="text-primary-9"
          />
        ),
      }}
    >
      {contenu}
    </TableCell>
  );
};

/**
 * Ajout d'un domaine. La modale ne se ferme qu'au succès : un libellé refusé
 * doit pouvoir être corrigé sans le ressaisir.
 */
const AjouterDomaineModal = ({
  onAdd,
}: {
  onAdd: (label: string) => Promise<AddDomaineFailure | null>;
}) => {
  const [label, setLabel] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const soumettre = async (close: () => void) => {
    const trimmed = label.trim();
    if (trimmed.length === 0 || isPending) {
      return;
    }
    setIsPending(true);
    setErreur(null);
    const echec = await onAdd(trimmed);
    setIsPending(false);
    if (echec === null) {
      close();
      return;
    }
    setErreur(
      echec === 'DOMAINE_DEJA_EXISTANT'
        ? appLabels.demarcheVulnerabiliteDomaineDejaExistant
        : appLabels.mutationError
    );
  };

  return (
    <Modal
      title={appLabels.demarcheVulnerabiliteAjouterDomaine}
      onClose={() => {
        setLabel('');
        setErreur(null);
      }}
      render={({ close }) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void soumettre(close);
          }}
        >
          <Input
            type="text"
            value={label}
            autoFocus
            maxLength={VULNERABILITE_DOMAINE_LABEL_MAX}
            aria-label={appLabels.demarcheVulnerabiliteNomDomaine}
            placeholder={appLabels.demarcheVulnerabiliteNomDomaine}
            aria-invalid={erreur !== null}
            aria-describedby={
              erreur === null ? undefined : 'vulnerabilite-domaine-erreur'
            }
            onChange={(e) => {
              setLabel(e.target.value);
              setErreur(null);
            }}
          />
          {erreur !== null && (
            <p
              id="vulnerabilite-domaine-erreur"
              role="alert"
              className="mt-2 text-sm text-error-1"
            >
              {erreur}
            </p>
          )}
          <ModalFooterOKCancel
            btnCancelProps={{ onClick: close, type: 'button' }}
            btnOKProps={{
              type: 'submit',
              disabled: label.trim().length === 0 || isPending,
            }}
          />
        </form>
      )}
    >
      <Button
        icon="add-line"
        size="sm"
        dataTest="demarches.pcaet.vulnerabilite.ajouter-domaine-button"
      >
        {appLabels.demarcheVulnerabiliteAjouterDomaine}
      </Button>
    </Modal>
  );
};

type Props = {
  vulnerabilite: DemarchePcaetVulnerabilite;
  demarcheId: number;
  isReadonly?: boolean;
};

/**
 * Tableau des niveaux de vulnérabilité par domaine et des objectifs
 * d'adaptation associés. Poser un niveau pré-remplit les horizons plus
 * lointains restés vides ; les domaines du socle ne se retirent pas,
 * « non concerné » en tient lieu.
 */
export const VulnerabiliteTable = ({
  vulnerabilite,
  demarcheId,
  isReadonly = false,
}: Props) => {
  const { setLigne, addDomaine, updateDomaine, removeDomaine } =
    useDemarchePcaetVulnerabilite(demarcheId);

  const rows = toVulnerabiliteRows(vulnerabilite);

  return (
    <div>
      {/* Région défilante atteignable au clavier (WCAG 2.1.1). */}
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label={appLabels.demarcheVulnerabiliteTableauAriaLabel}
      >
        <Table
          role="grid"
          aria-label={appLabels.demarcheVulnerabiliteTableauAriaLabel}
        >
          <colgroup>
            {/* La première colonne loge la corbeille dans sa marge droite. */}
            <col className="w-52" />
            {NIVEAU_COLUMNS.map((col) => (
              <col key={col.key} className="w-44" />
            ))}
            {OBJECTIF_COLUMNS.map((col) => (
              <col key={col.key} className="w-80" />
            ))}
          </colgroup>
          <TableHead>
            <tr>
              <TableHeaderCell
                scope="col"
                title={appLabels.demarcheVulnerabiliteDomaines}
                pinnedLeft
              />
              {NIVEAU_COLUMNS.map((col) => (
                <TableHeaderCell key={col.key} scope="col" title={col.label} />
              ))}
              {OBJECTIF_COLUMNS.map((col) => (
                <TableHeaderCell
                  key={col.key}
                  scope="col"
                  title={
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <InfoTooltip
                        label={appLabels.demarcheVulnerabiliteObjectifsAide}
                        activatedBy="click"
                        size="xs"
                      />
                    </span>
                  }
                />
              ))}
            </tr>
          </TableHead>
          <tbody>
            {rows.map(({ domaine, ligne }) => (
              <TableRow
                key={domaine.id}
                className="text-sm"
                data-test={`demarches.pcaet.vulnerabilite.row-${
                  domaine.code ?? domaine.id
                }`}
              >
                <DomaineCell
                  domaine={domaine}
                  isReadonly={isReadonly}
                  onRename={(label) => updateDomaine(domaine.id, label)}
                  onRemove={() => removeDomaine(domaine.id)}
                />
                {NIVEAU_COLUMNS.map((col) => (
                  <NiveauCell
                    key={col.key}
                    domaineLabel={domaine.label}
                    horizonLabel={col.label}
                    niveau={ligne[col.key]}
                    isReadonly={isReadonly}
                    onChange={(valeur) =>
                      setLigne({
                        domaineId: domaine.id,
                        niveau: { horizon: col.horizon, valeur },
                      })
                    }
                  />
                ))}
                {OBJECTIF_COLUMNS.map((col) => (
                  <ObjectifCell
                    key={col.key}
                    domaineLabel={domaine.label}
                    horizonLabel={col.horizon}
                    value={ligne[col.key]}
                    isReadonly={isReadonly}
                    onCommit={(texte) =>
                      setLigne({ domaineId: domaine.id, [col.key]: texte })
                    }
                  />
                ))}
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      {!isReadonly && (
        <div className="m-4">
          <AjouterDomaineModal onAdd={addDomaine} />
        </div>
      )}

    </div>
  );
};
