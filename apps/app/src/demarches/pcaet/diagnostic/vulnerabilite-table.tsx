'use client';

import {
  DEMARCHE_PCAET_VULNERABILITE_NIVEAU_LABELS,
  DEMARCHE_PCAET_VULNERABILITE_NIVEAU_VARIANTS,
} from '@/app/demarches/pcaet/constants';
import { appLabels } from '@/app/labels/catalog';
import {
  demarchePcaetVulnerabiliteNiveauValues,
  OBJECTIFS_MAX_LENGTH,
  VULNERABILITE_THEMATIQUE_LABEL_MAX,
  type DemarchePcaetVulnerabilite,
  type DemarchePcaetVulnerabiliteNiveau,
  type DemarchePcaetVulnerabiliteThematique,
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
  TableTreeBranch,
  TableTreeToggle,
  TableTreeTogglePlaceholder,
  tableTreeChildIndentClassName,
  type TableCellProps,
} from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { useId, useState } from 'react';
import {
  useDemarchePcaetVulnerabilite,
  type AddThematiqueFailure,
} from './data/use-vulnerabilite';
import {
  NIVEAU_COLUMNS,
  OBJECTIF_COLUMNS,
  toVulnerabiliteRows,
  type VulnerabiliteRow,
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
  thematiqueLabel,
  horizonLabel,
  niveau,
  isReadonly,
  onChange,
}: {
  thematiqueLabel: string;
  horizonLabel: string;
  niveau: DemarchePcaetVulnerabiliteNiveau | null;
  isReadonly: boolean;
  onChange: (next: DemarchePcaetVulnerabiliteNiveau | null) => void;
}) => (
  <TableCell
    className="group/niveau"
    canEdit={!isReadonly}
    // Sans nom composé, les 48 cellules du tableau sont homonymes au lecteur
    // d'écran : ni la thématique ni l'horizon ne ressortent du badge seul.
    aria-label={appLabels.demarcheVulnerabiliteCelluleNiveau({
      thematique: thematiqueLabel,
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
  thematiqueLabel,
  horizonLabel,
  value,
  isReadonly,
  onCommit,
}: {
  thematiqueLabel: string;
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
        thematique: thematiqueLabel,
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
        {value || (isReadonly ? '' : appLabels.demarcheVulnerabiliteObjectifs)}
      </span>
    </TableCell>
  );
};

/**
 * Ajout d'une thématique, ou d'une sous-thématique quand une parente est
 * donnée. La modale ne se ferme qu'au succès : un libellé refusé doit pouvoir
 * être corrigé sans le ressaisir.
 */
const AjouterThematiqueModal = ({
  parent,
  onAdd,
}: {
  parent?: DemarchePcaetVulnerabiliteThematique;
  onAdd: (label: string) => Promise<AddThematiqueFailure | null>;
}) => {
  const [label, setLabel] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  // Une modale par racine éligible, plus la globale : un identifiant en dur
  // ferait pointer `aria-describedby` sur le message d'une autre.
  const erreurId = useId();

  const titre = parent
    ? appLabels.demarcheVulnerabiliteAjouterSousThematiqueNomme({
        parent: parent.label,
      })
    : appLabels.demarcheVulnerabiliteAjouterThematique;
  const nomDuChamp = parent
    ? appLabels.demarcheVulnerabiliteNomSousThematique
    : appLabels.demarcheVulnerabiliteNomThematique;

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
      echec === 'THEMATIQUE_DEJA_EXISTANT'
        ? appLabels.demarcheVulnerabiliteThematiqueDejaExistant
        : appLabels.mutationError
    );
  };

  return (
    <Modal
      title={titre}
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
            maxLength={VULNERABILITE_THEMATIQUE_LABEL_MAX}
            aria-label={nomDuChamp}
            placeholder={nomDuChamp}
            aria-invalid={erreur !== null}
            aria-describedby={erreur === null ? undefined : erreurId}
            onChange={(e) => {
              setLabel(e.target.value);
              setErreur(null);
            }}
          />
          {erreur !== null && (
            <p id={erreurId} role="alert" className="mt-2 text-sm text-error-1">
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
      {parent ? (
        // Dans la case de la parente, le libellé ne tiendrait pas : l'icône
        // porte le nom accessible, comme la corbeille voisine.
        <Button
          icon="add-line"
          variant="white"
          size="xs"
          className="text-grey-8 opacity-60 transition-opacity hover:text-info-1 group-hover:opacity-100 group-focus-within:opacity-100"
          aria-label={titre}
          title={appLabels.demarcheVulnerabiliteAjouterSousThematique}
          dataTest={`demarches.pcaet.vulnerabilite.ajouter-sous-thematique-button-${parent.id}`}
        />
      ) : (
        <Button
          icon="add-line"
          size="sm"
          dataTest="demarches.pcaet.vulnerabilite.ajouter-thematique-button"
        >
          {appLabels.demarcheVulnerabiliteAjouterThematique}
        </Button>
      )}
    </Modal>
  );
};

type Props = {
  vulnerabilite: DemarchePcaetVulnerabilite;
  demarcheId: number;
  isReadonly?: boolean;
};

/** Corbeille de la case de la thématique. */
const SupprimerThematiqueButton = ({
  thematique,
  enfants,
  onRemove,
}: {
  thematique: DemarchePcaetVulnerabiliteThematique;
  enfants: number;
  onRemove: () => void;
}) => (
  <Modal
    title={appLabels.demarcheVulnerabiliteSupprimerThematiqueTitre}
    subTitle={appLabels.demarcheVulnerabiliteSupprimerThematiqueDescription({
      label: thematique.label,
      enfants,
    })}
    render={({ close }) => (
      <ModalFooterOKCancel
        btnCancelProps={{ onClick: close }}
        btnOKProps={{
          // Une action destructrice se nomme : « Valider » ne dit pas ce
          // qu'on valide.
          children: appLabels.demarcheVulnerabiliteSupprimerThematiqueConfirmer,
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
      className="text-grey-8 opacity-60 transition-opacity hover:text-error-1 group-hover:opacity-100 group-focus-within:opacity-100"
      aria-label={appLabels.demarcheVulnerabiliteSupprimerThematiqueNomme({
        label: thematique.label,
      })}
      title={appLabels.demarcheVulnerabiliteSupprimerThematique}
    />
  </Modal>
);

/**
 * Première colonne. Les deux boutons se rangent à droite de la case de la
 * thématique : au bout de la ligne ils imposaient un défilement horizontal, et
 * à gauche ils empiétaient sur le libellé. Le créneau est réservé sur toutes
 * les lignes pour que les libellés restent alignés.
 *
 * Une sous-thématique se met en retrait, et tout ce que la collectivité a
 * ajouté se teinte : sans cela, rien ne distingue à l'œil ce qui relève du
 * cadre réglementaire de ce qu'elle a écrit elle-même.
 */
const ThematiqueCell = ({
  row,
  isReadonly,
  onRename,
  onRemove,
  onAddEnfant,
  onToggle,
}: {
  row: VulnerabiliteRow;
  isReadonly: boolean;
  onRename: (label: string) => void;
  onRemove: () => void;
  onAddEnfant: (label: string) => Promise<AddThematiqueFailure | null>;
  onToggle: () => void;
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const {
    thematique,
    isEnfant,
    isDernierEnfant,
    peutRecevoirEnfant,
    nombreEnfants,
    isReplie,
    parentLabel,
  } = row;
  const isEditable = !isReadonly && !thematique.isSocle;

  const contenu = (
    <>
      {isEnfant && <TableTreeBranch isLast={isDernierEnfant} />}
      <div
        className={cn('flex items-center gap-1', {
          [tableTreeChildIndentClassName]: isEnfant,
        })}
      >
        {nombreEnfants > 0 ? (
          <TableTreeToggle
            isExpanded={!isReplie}
            onToggle={onToggle}
            label={
              isReplie
                ? appLabels.demarcheVulnerabiliteDeplierThematique({
                    label: thematique.label,
                    enfants: nombreEnfants,
                  })
                : appLabels.demarcheVulnerabiliteReplierThematique({
                    label: thematique.label,
                  })
            }
            dataTest={`demarches.pcaet.vulnerabilite.replier-button-${
              thematique.code ?? thematique.id
            }`}
          />
        ) : (
          !isEnfant && <TableTreeTogglePlaceholder />
        )}
        <span className="grow text-sm text-primary-9">{thematique.label}</span>
        {parentLabel !== null && (
          // Les traits d'arborescence sont décoratifs : sans cela,
          // « Sécheresse » s'entend sans qu'on sache de quoi elle relève.
          // Voisine du libellé, et non dans son nœud, pour ne pas polluer le
          // texte visible sur lequel les tests et la recherche s'appuient.
          <span className="sr-only">
            {appLabels.demarcheVulnerabiliteSousThematiqueDe({
              parent: parentLabel,
            })}
          </span>
        )}
        {/*
          Le clic est arrêté avant la cellule : celle-ci ouvre l'édition du
          libellé en ligne, qui volerait le focus au champ de la modale — on
          se retrouvait à taper dans les deux à la fois.
        */}
        <span
          className="flex w-12 shrink-0 justify-end"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {!isReadonly && peutRecevoirEnfant && (
            <AjouterThematiqueModal parent={thematique} onAdd={onAddEnfant} />
          )}
          {isEditable && (
            <SupprimerThematiqueButton
              thematique={thematique}
              enfants={nombreEnfants}
              onRemove={onRemove}
            />
          )}
        </span>
      </div>
    </>
  );

  const className = 'pr-2 font-medium';

  if (!isEditable) {
    return (
      <TableCell pinnedLeft className={className}>
        {contenu}
      </TableCell>
    );
  }

  return (
    <TableCell
      pinnedLeft
      className={className}
      canEdit
      aria-label={appLabels.demarcheVulnerabiliteCelluleThematique({
        label: thematique.label,
      })}
      edit={{
        floatingMatchReferenceHeight: false,
        onClose: () => {
          const trimmed = draft?.trim();
          if (trimmed && trimmed !== thematique.label) {
            onRename(trimmed);
          }
          setDraft(null);
        },
        renderOnEdit: ({ openState }) => (
          <TableCellTextarea
            value={draft ?? thematique.label}
            maxLength={VULNERABILITE_THEMATIQUE_LABEL_MAX}
            onChange={(e) => setDraft(e.target.value)}
            closeEditing={() => openState.setIsOpen(false)}
            placeholder={
              isEnfant
                ? appLabels.demarcheVulnerabiliteNomSousThematique
                : appLabels.demarcheVulnerabiliteNomThematique
            }
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
 * Tableau des niveaux de vulnérabilité par thématique et des objectifs
 * d'adaptation associés. Chaque horizon se saisit pour lui seul ; les
 * thématiques du socle ne se retirent pas, « non concerné » en tient lieu.
 */
export const VulnerabiliteTable = ({
  vulnerabilite,
  demarcheId,
  isReadonly = false,
}: Props) => {
  const { setLigne, addThematique, updateThematique, removeThematique } =
    useDemarchePcaetVulnerabilite(demarcheId);

  // Repli de confort, propre à l'écran : rien ne le persiste, une grappe
  // repliée n'est pas une donnée du dépôt.
  const [repliees, setRepliees] = useState<ReadonlySet<number>>(new Set());

  const basculerRepli = (thematiqueId: number) =>
    setRepliees((precedent) => {
      const suivant = new Set(precedent);
      if (!suivant.delete(thematiqueId)) {
        suivant.add(thematiqueId);
      }
      return suivant;
    });

  const rows = toVulnerabiliteRows(vulnerabilite, repliees);

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
            {/* La première colonne loge le chevron de repli à gauche, les
                boutons d'ajout et de retrait dans sa marge droite. */}
            <col className="w-64" />
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
                title={appLabels.demarcheVulnerabiliteThematiques}
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
            {rows.map((row) => {
              const { thematique, ligne } = row;
              return (
                <TableRow
                  key={thematique.id}
                  className="text-sm"
                  data-test={`demarches.pcaet.vulnerabilite.row-${
                    thematique.code ?? thematique.id
                  }`}
                >
                  <ThematiqueCell
                    row={row}
                    isReadonly={isReadonly}
                    onRename={(label) => updateThematique(thematique.id, label)}
                    onRemove={() => removeThematique(thematique.id)}
                    onAddEnfant={(label) => addThematique(label, thematique.id)}
                    onToggle={() => basculerRepli(thematique.id)}
                  />
                  {NIVEAU_COLUMNS.map((col) => (
                    <NiveauCell
                      key={col.key}
                      thematiqueLabel={thematique.label}
                      horizonLabel={col.label}
                      niveau={ligne[col.key]}
                      isReadonly={isReadonly}
                      onChange={(valeur) =>
                        setLigne({
                          thematiqueId: thematique.id,
                          niveau: { horizon: col.horizon, valeur },
                        })
                      }
                    />
                  ))}
                  {OBJECTIF_COLUMNS.map((col) => (
                    <ObjectifCell
                      key={col.key}
                      thematiqueLabel={thematique.label}
                      horizonLabel={col.horizon}
                      value={ligne[col.key]}
                      isReadonly={isReadonly}
                      onCommit={(texte) =>
                        setLigne({
                          thematiqueId: thematique.id,
                          [col.key]: texte,
                        })
                      }
                    />
                  ))}
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      </div>

      {!isReadonly && (
        <div className="m-4">
          <AjouterThematiqueModal onAdd={addThematique} />
        </div>
      )}
    </div>
  );
};
