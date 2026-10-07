import { groupBy } from 'es-toolkit';
import { useState } from 'react';
import { cn } from '../../../utils/cn';
import { Table } from '../table';
import { TableCell } from '../table.cell';
import { TableHead } from '../table.head';
import { TableHeaderCell } from '../table.header-cell';
import { TableRow } from '../table.row';
import {
  TableTreeBranch,
  TableTreeToggle,
  TableTreeTogglePlaceholder,
  tableTreeChildIndentClassName,
} from '../table.tree';

type Ligne = {
  id: number;
  label: string;
  /** `null` pour une racine. La hiérarchie tient sur un seul niveau. */
  parentId: number | null;
  responsable: string;
  echeance: string;
};

const LIGNES: readonly Ligne[] = [
  {
    id: 1,
    label: 'Mobilités',
    parentId: null,
    responsable: 'Camille',
    echeance: '2026',
  },
  {
    id: 2,
    label: 'Risques naturels',
    parentId: null,
    responsable: 'Dominique',
    echeance: '2027',
  },
  {
    id: 3,
    label: 'Sécheresse',
    parentId: 2,
    responsable: 'Dominique',
    echeance: '2027',
  },
  {
    id: 4,
    label: 'Inondation',
    parentId: 2,
    responsable: 'Alex',
    echeance: '2028',
  },
  {
    id: 5,
    label: 'Incendie de forêt et de végétation',
    parentId: 2,
    responsable: 'Alex',
    echeance: '2028',
  },
  {
    id: 6,
    label: 'Submersion marine',
    parentId: 2,
    responsable: 'Camille',
    echeance: '2030',
  },
  {
    id: 7,
    label: 'Bâtiments',
    parentId: null,
    responsable: 'Alex',
    echeance: '2029',
  },
];

type Rangee = {
  ligne: Ligne;
  isEnfant: boolean;
  isDernierEnfant: boolean;
  nombreEnfants: number;
  isReplie: boolean;
};

/**
 * Aplatit l'arbre en rangées de tableau : chaque enfant suit sa parente, le
 * dernier de la fratrie est marqué (son coude referme le trait), et la grappe
 * repliée retire ses enfants sans retirer sa parente.
 */
const toRangees = (
  lignes: readonly Ligne[],
  repliees: ReadonlySet<number>
): Rangee[] => {
  const racines = lignes.filter(({ parentId }) => parentId === null);
  const parParent = groupBy(
    lignes.filter(({ parentId }) => parentId !== null),
    ({ parentId }) => parentId as number
  );
  return racines.flatMap((racine) => {
    const fratrie = parParent[racine.id] ?? [];
    const isReplie = fratrie.length > 0 && repliees.has(racine.id);
    const parente: Rangee = {
      ligne: racine,
      isEnfant: false,
      isDernierEnfant: false,
      nombreEnfants: fratrie.length,
      isReplie,
    };
    if (isReplie) {
      return [parente];
    }
    return [
      parente,
      ...fratrie.map((ligne, index) => ({
        ligne,
        isEnfant: true,
        isDernierEnfant: index === fratrie.length - 1,
        nombreEnfants: 0,
        isReplie: false,
      })),
    ];
  });
};

/**
 * Tableau hiérarchique sur un seul sous-niveau : traits d'arborescence,
 * chevron de repli, et les lignes filles qui se rangent derrière leur parente.
 *
 * La première colonne est `pinnedLeft` : `TableTreeBranch` s'y positionne en
 * absolu, et c'est le `sticky` de cette option qui lui sert d'ancre.
 */
export const TableTree = () => {
  const [repliees, setRepliees] = useState<ReadonlySet<number>>(new Set());

  const basculer = (id: number) =>
    setRepliees((precedent) => {
      const suivant = new Set(precedent);
      if (!suivant.delete(id)) {
        suivant.add(id);
      }
      return suivant;
    });

  return (
    <Table>
      <colgroup>
        <col className="w-80" />
        <col className="w-48" />
        <col className="w-32" />
      </colgroup>
      <TableHead>
        <tr>
          <TableHeaderCell scope="col" title="Thématique" pinnedLeft />
          <TableHeaderCell scope="col" title="Responsable" />
          <TableHeaderCell scope="col" title="Échéance" />
        </tr>
      </TableHead>
      <tbody>
        {toRangees(LIGNES, repliees).map(
          ({ ligne, isEnfant, isDernierEnfant, nombreEnfants, isReplie }) => (
            <TableRow key={ligne.id} className="text-sm">
              <TableCell pinnedLeft>
                {isEnfant && <TableTreeBranch isLast={isDernierEnfant} />}
                <div
                  className={cn('flex items-center gap-1', {
                    [tableTreeChildIndentClassName]: isEnfant,
                  })}
                >
                  {nombreEnfants > 0 ? (
                    <TableTreeToggle
                      isExpanded={!isReplie}
                      onToggle={() => basculer(ligne.id)}
                      label={
                        isReplie
                          ? `Déplier ${ligne.label}`
                          : `Replier ${ligne.label}`
                      }
                    />
                  ) : (
                    !isEnfant && <TableTreeTogglePlaceholder />
                  )}
                  <span>{ligne.label}</span>
                </div>
              </TableCell>
              <TableCell>{ligne.responsable}</TableCell>
              <TableCell>{ligne.echeance}</TableCell>
            </TableRow>
          )
        )}
      </tbody>
    </Table>
  );
};
