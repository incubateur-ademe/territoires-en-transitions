'use client';

import { appLabels } from '@/app/labels/catalog';
import { Z_INDEX_ABOVE_STICKY_HEADER } from '@tet/design-tokens';
import {
  pcaetStatutInstructionValues,
  type PcaetStatutInstruction,
} from '@tet/domain/demarches';
import { Badge, Field, SelectFilter } from '@tet/ui';
import {
  statutInstructionLabel,
  STATUT_INSTRUCTION_VARIANTS,
} from './instruction.constants';

/**
 * Le filtre de statut, au-dessus du tableau et non dans l'en-tête de sa
 * colonne : il y passait inaperçu, et les agents ne comprenaient pas pourquoi
 * certains dossiers manquaient. Il montre sa sélection, défaut compris.
 *
 * Les statuts suivent l'ordre du cycle de vie — celui de l'enum du domaine.
 */
export const StatutFilter = ({
  deposeAvis,
  statuts,
  onChange,
}: {
  /** Le libellé d'un statut dépend du service : voir `statutInstructionLabel`. */
  deposeAvis: boolean;
  statuts: PcaetStatutInstruction[];
  onChange: (statuts: PcaetStatutInstruction[]) => void;
}) => (
  <Field
    title={appLabels.instructionListeFiltreStatuts}
    small
    className="max-w-2xl"
  >
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
        renderOptionItem: (item) => (
          <Badge
            title={statutInstructionLabel(
              item.value as PcaetStatutInstruction,
              { deposeAvis }
            )}
            variant={
              STATUT_INSTRUCTION_VARIANTS[item.value as PcaetStatutInstruction]
            }
            size="sm"
          />
        ),
      }}
    />
  </Field>
);
