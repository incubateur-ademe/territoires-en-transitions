'use client';

import {
  DEMARCHE_PCAET_VULNERABILITE_DOMAINES,
  DEMARCHE_PCAET_VULNERABILITE_NIVEAU_LABELS,
  DEMARCHE_PCAET_VULNERABILITE_NIVEAU_VARIANTS,
  DEMARCHE_PCAET_VULNERABILITE_NIVEAUX,
} from '@/app/demarches/pcaet/demarche-pcaet.constants';
import { appLabels } from '@/app/labels/catalog';
import type {
  DemarchePcaetVulnerabiliteDomaineId,
  DemarchePcaetVulnerabiliteLigne,
  DemarchePcaetVulnerabiliteNiveau,
  DemarchePcaetVulnerabiliteState,
} from '@/app/demarches/pcaet/demarche-pcaet.types';
import {
  Badge,
  Select,
  Table,
  TableCell,
  TableCellTextarea,
  TableHead,
  TableHeaderCell,
  TableRow,
  type TableCellProps,
} from '@tet/ui';
import { useCallback, useState } from 'react';

type InlineEditRenderArgs = Parameters<
  NonNullable<NonNullable<TableCellProps['edit']>['renderOnEdit']>
>[0];
type InlineEditOpenState = InlineEditRenderArgs['openState'];

type Props = {
  value: DemarchePcaetVulnerabiliteState;
  isReadonly?: boolean;
  onChange: (next: DemarchePcaetVulnerabiliteState) => void;
};

type DiagKey = 'diagMaintenant' | 'diag2050' | 'diag2100';

const DIAG_COLUMNS: ReadonlyArray<{
  key: DiagKey;
  /** Colonnes "suivantes" mises à jour automatiquement lors d'une saisie. */
  cascadeKeys: DiagKey[];
  label: string;
}> = [
  {
    key: 'diagMaintenant',
    label: appLabels.demarchePcaetVulnerabiliteDiagMaintenant,
    cascadeKeys: ['diag2050', 'diag2100'],
  },
  {
    key: 'diag2050',
    label: appLabels.demarchePcaetVulnerabiliteDiag2050,
    cascadeKeys: ['diag2100'],
  },
  {
    key: 'diag2100',
    label: appLabels.demarchePcaetVulnerabiliteDiag2100,
    cascadeKeys: [],
  },
];

const niveauOptions = DEMARCHE_PCAET_VULNERABILITE_NIVEAUX.map((niveau) => ({
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
  value: DemarchePcaetVulnerabiliteNiveau;
  onChange: (next: DemarchePcaetVulnerabiliteNiveau) => void;
  openState?: InlineEditOpenState;
}) => (
  <Select
    values={value}
    options={niveauOptions}
    onChange={(v) => v && onChange(v as DemarchePcaetVulnerabiliteNiveau)}
    inlineEdit
    openState={openState}
    custom={{
      renderOptionItem: (item) => (
        <NiveauBadge niveau={item.value as DemarchePcaetVulnerabiliteNiveau} />
      ),
    }}
  />
);

const DescriptionCell = ({
  value,
  isReadonly,
  placeholder,
  onCommit,
}: {
  value: string;
  isReadonly: boolean;
  placeholder: string;
  onCommit: (next: string) => void;
}) => {
  const [draft, setDraft] = useState(value);

  return (
    <TableCell
      className="align-top"
      canEdit={!isReadonly}
      edit={{
        floatingMatchReferenceHeight: false,
        onClose: () => {
          if (draft.trim() !== value.trim()) {
            onCommit(draft.trim());
          }
        },
        renderOnEdit: ({ openState }) => (
          <TableCellTextarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            closeEditing={() => openState.setIsOpen(false)}
            placeholder={placeholder}
            className="text-primary-9"
          />
        ),
      }}
    >
      <span
        className={`line-clamp-3 text-sm ${
          value ? 'text-primary-9' : 'text-grey-6'
        }`}
        title={value || placeholder}
      >
        {value || (!isReadonly ? placeholder : '')}
      </span>
    </TableCell>
  );
};

/**
 * Tableau éditable des diagnostics de vulnérabilité du territoire.
 * Règles de saisie:
 * - Modifier `diagMaintenant` propage la même valeur à `diag2050` et `diag2100`.
 * - Modifier `diag2050` propage à `diag2100`.
 * - Sélectionner `non_concerne` sur une colonne fait passer toute la ligne à `non_concerne`.
 */
export const VulnerabiliteTable = ({
  value,
  isReadonly = false,
  onChange,
}: Props) => {
  const updateLigne = useCallback(
    (
      domaineId: DemarchePcaetVulnerabiliteDomaineId,
      patch: Partial<DemarchePcaetVulnerabiliteLigne>
    ) => {
      onChange({
        lignes: value.lignes.map((ligne) =>
          ligne.domaineId === domaineId ? { ...ligne, ...patch } : ligne
        ),
      });
    },
    [onChange, value.lignes]
  );

  const handleNiveauChange = (
    ligne: DemarchePcaetVulnerabiliteLigne,
    column: (typeof DIAG_COLUMNS)[number],
    niveau: DemarchePcaetVulnerabiliteNiveau
  ) => {
    if (niveau === 'non_concerne') {
      updateLigne(ligne.domaineId, {
        diagMaintenant: 'non_concerne',
        diag2050: 'non_concerne',
        diag2100: 'non_concerne',
      });
      return;
    }
    const patch: Partial<DemarchePcaetVulnerabiliteLigne> = {
      [column.key]: niveau,
    };
    column.cascadeKeys.forEach((key) => {
      patch[key] = niveau;
    });
    updateLigne(ligne.domaineId, patch);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <colgroup>
            <col className="w-44" />
            {DIAG_COLUMNS.map((col) => (
              <col key={col.key} className="w-44" />
            ))}
            <col />
            <col />
          </colgroup>
          <TableHead>
            <tr>
              <TableHeaderCell title="Domaines" pinnedLeft />
              {DIAG_COLUMNS.map((col) => (
                <TableHeaderCell key={col.key} title={col.label} />
              ))}
              <TableHeaderCell title="Description des objectifs 2050" />
              <TableHeaderCell title="Description des objectifs 2100" />
            </tr>
          </TableHead>
          <tbody>
            {value.lignes.map((ligne) => {
              const domaine = DEMARCHE_PCAET_VULNERABILITE_DOMAINES.find(
                (d) => d.id === ligne.domaineId
              );
              if (!domaine) return null;

              return (
                <TableRow
                  key={ligne.domaineId}
                  className="text-sm"
                  data-test={`vulnerabilite-row-${ligne.domaineId}`}
                >
                  <TableCell pinnedLeft className="font-medium text-primary-9">
                    {domaine.label}
                  </TableCell>
                  {DIAG_COLUMNS.map((col) => (
                    <TableCell
                      key={col.key}
                      canEdit={!isReadonly}
                      edit={{
                        renderOnEdit: ({ openState }) => (
                          <NiveauSelect
                            value={ligne[col.key]}
                            openState={openState}
                            onChange={(niveau) => {
                              handleNiveauChange(ligne, col, niveau);
                              openState.setIsOpen(false);
                            }}
                          />
                        ),
                      }}
                    >
                      <NiveauBadge niveau={ligne[col.key]} />
                    </TableCell>
                  ))}
                  <DescriptionCell
                    value={ligne.description2050}
                    isReadonly={isReadonly}
                    placeholder={appLabels.demarchePcaetVulnerabiliteObjectifs}
                    onCommit={(description2050) =>
                      updateLigne(ligne.domaineId, { description2050 })
                    }
                  />
                  <DescriptionCell
                    value={ligne.description2100}
                    isReadonly={isReadonly}
                    placeholder={appLabels.demarchePcaetVulnerabiliteObjectifs}
                    onCommit={(description2100) =>
                      updateLigne(ligne.domaineId, { description2100 })
                    }
                  />
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      </div>
      <p className="text-xs text-grey-7 mt-2">
        * Diagnostic correspondant à la situation actuelle du territoire.
      </p>
    </div>
  );
};
