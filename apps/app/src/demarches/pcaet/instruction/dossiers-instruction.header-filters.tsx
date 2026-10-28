'use client';

import { appLabels } from '@/app/labels/catalog';
import { Z_INDEX_ABOVE_STICKY_HEADER } from '@tet/design-tokens';
import {
  collectivitePcaetObligationValues,
  pcaetStatutInstructionValues,
  type CollectivitePcaetObligation,
  type PcaetStatutInstruction,
} from '@tet/domain/demarches';
import { HeaderFilterButton } from '@/app/demarches/components/header-filter.button';
import { Badge, SelectFilter } from '@tet/ui';
import {
  OBLIGATION_LABELS,
  OBLIGATION_VARIANTS,
  statutInstructionLabel,
  STATUT_INSTRUCTION_VARIANTS,
} from './instruction.constants';

/** Les statuts, dans l'ordre du cycle de vie — celui de l'enum du domaine. */
export const StatutHeaderFilter = ({
  deposeAvis,
  statuts,
  filterCount,
  onChange,
}: {
  /** Le libellé d'un statut dépend du service : voir `statutInstructionLabel`. */
  deposeAvis: boolean;
  statuts: PcaetStatutInstruction[];
  filterCount: number;
  onChange: (statuts: PcaetStatutInstruction[]) => void;
}) => (
  <SelectFilter
    dataTest="demarches.pcaet.instruction.filtre-statut"
    dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
    options={pcaetStatutInstructionValues.map((value) => ({
      value,
      label: statutInstructionLabel(value, { deposeAvis }),
    }))}
    values={statuts}
    onChange={({ values }) =>
      onChange((values ?? []) as PcaetStatutInstruction[])
    }
    placeholder={appLabels.filtrer}
    small
    custom={{
      triggerButton: {
        button: <HeaderFilterButton filterCount={filterCount} />,
      },
      renderOptionItem: (item) => (
        <Badge
          title={statutInstructionLabel(item.value as PcaetStatutInstruction, {
            deposeAvis,
          })}
          variant={
            STATUT_INSTRUCTION_VARIANTS[item.value as PcaetStatutInstruction]
          }
          size="sm"
        />
      ),
    }}
  />
);

/**
 * Obligatoire, volontaire ou non obligée, dans l'en-tête de la colonne
 * « Collectivité » :
 * c'est une propriété de la collectivité au regard du PCAET, pas du dossier.
 */
export const ObligationHeaderFilter = ({
  obligations,
  filterCount,
  onChange,
}: {
  obligations: CollectivitePcaetObligation[];
  filterCount: number;
  onChange: (obligations: CollectivitePcaetObligation[]) => void;
}) => (
  <SelectFilter
    dataTest="demarches.pcaet.instruction.filtre-obligation"
    dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
    options={collectivitePcaetObligationValues.map((value) => ({
      value,
      label: OBLIGATION_LABELS[value],
    }))}
    values={obligations}
    onChange={({ values }) =>
      onChange((values ?? []) as CollectivitePcaetObligation[])
    }
    placeholder={appLabels.filtrer}
    small
    custom={{
      triggerButton: {
        button: <HeaderFilterButton filterCount={filterCount} />,
      },
      renderOptionItem: (item) => (
        <Badge
          title={OBLIGATION_LABELS[item.value as CollectivitePcaetObligation]}
          variant={
            OBLIGATION_VARIANTS[item.value as CollectivitePcaetObligation]
          }
          size="sm"
          uppercase={false}
        />
      ),
    }}
  />
);

/**
 * Les régions couvertes par le service. N'apparaît que là où la colonne le
 * fait : un service qui n'en couvre qu'une n'a rien à trier.
 */
export const RegionHeaderFilter = ({
  regions,
  options,
  filterCount,
  onChange,
}: {
  regions: string[];
  options: { code: string; libelle: string }[];
  filterCount: number;
  onChange: (regions: string[]) => void;
}) => (
  <SelectFilter
    dataTest="demarches.pcaet.instruction.filtre-region"
    dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
    options={options.map(({ code, libelle }) => ({
      value: code,
      label: libelle,
    }))}
    values={regions}
    onChange={({ values }) => onChange((values ?? []) as string[])}
    placeholder={appLabels.filtrer}
    small
    isSearcheable={options.length > 10}
    custom={{
      triggerButton: {
        button: <HeaderFilterButton filterCount={filterCount} />,
      },
    }}
  />
);
