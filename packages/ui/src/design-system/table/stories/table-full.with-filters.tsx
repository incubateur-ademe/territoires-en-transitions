import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Badge } from '../../Badge';
import { Button } from '../../Button';
import { SelectFilter } from '../../Select';
import { TableCell, TableHeaderCell } from '../index';
import { ReactTable } from '../react-table';
import { FakeVueTabulaireAction, fakeVueTabulaireData } from './fixtures';

type ColonneTriable = 'statut' | 'dateDeFin';
type DirectionTri = 'asc' | 'desc';

const statutOptions = ['En cours', 'À venir', 'Terminé'];

const piloteOptions = [
  ...new Set(fakeVueTabulaireData.flatMap((action) => action.pilotes ?? [])),
];

/**
 * Le déclencheur d'un filtre de colonne : discret tant que rien n'est posé,
 * porteur du nombre de valeurs retenues ensuite.
 */
const FilterButton = ({ filterCount }: { filterCount: number }) => (
  <Button
    size="xs"
    variant="grey"
    className="font-normal text-grey-8"
    notification={
      filterCount > 0 ? { size: 'xs', number: filterCount } : undefined
    }
  >
    Filtrer
  </Button>
);

const HeaderFilter = ({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) => (
  <SelectFilter
    options={options.map((value) => ({ value, label: value }))}
    values={values}
    onChange={({ values }) => onChange((values ?? []) as string[])}
    placeholder="Filtrer"
    small
    custom={{
      triggerButton: {
        button: <FilterButton filterCount={values.length} />,
      },
    }}
  />
);

const columnHelper = createColumnHelper<FakeVueTabulaireAction>();

type Props = {
  isLoading?: boolean;
  /** Les filtres déjà posés à l'ouverture, pour montrer un état donné. */
  filtresInitiaux?: { statuts?: string[]; pilotes?: string[] };
};

/**
 * Un tableau dont l'en-tête porte le tri et les filtres de chaque colonne.
 *
 * Le tri et le filtrage sont ici locaux, mais rien ne les y oblige : les deux
 * sont pilotés par l'appelant, et une liste paginée côté serveur se branche de
 * la même façon.
 */
export const TableFullWithFilters = ({ isLoading, filtresInitiaux }: Props) => {
  const [statuts, setStatuts] = useState<string[]>(
    filtresInitiaux?.statuts ?? []
  );
  const [pilotes, setPilotes] = useState<string[]>(
    filtresInitiaux?.pilotes ?? []
  );
  const [sort, setSort] = useState<ColonneTriable>('dateDeFin');
  const [direction, setDirection] = useState<DirectionTri>('asc');

  // Une seconde pression sur la même colonne inverse le sens ; changer de
  // colonne repart du sens croissant.
  const trierPar = (colonne: ColonneTriable) => {
    if (colonne === sort) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSort(colonne);
    setDirection('asc');
  };

  const data = useMemo(() => {
    const filtrees = fakeVueTabulaireData.filter(
      (action) =>
        (statuts.length === 0 || statuts.includes(action.statut)) &&
        (pilotes.length === 0 ||
          (action.pilotes ?? []).some((pilote) => pilotes.includes(pilote)))
    );

    return [...filtrees].sort((a, b) => {
      const comparaison = (a[sort] ?? '').localeCompare(b[sort] ?? '');
      return direction === 'asc' ? comparaison : -comparaison;
    });
  }, [statuts, pilotes, sort, direction]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: () => <TableHeaderCell title="Titre" />,
        cell: (info) => (
          <TableCell>
            <div className="line-clamp-2">{info.getValue()}</div>
          </TableCell>
        ),
      }),
      columnHelper.accessor('statut', {
        header: () => (
          <TableHeaderCell
            className="w-40"
            title="Statut"
            sortFn={() => trierPar('statut')}
            sortDirection={sort === 'statut' ? direction : null}
            filter={
              <HeaderFilter
                options={statutOptions}
                values={statuts}
                onChange={setStatuts}
              />
            }
          />
        ),
        cell: (info) => (
          <TableCell>
            <Badge variant="info" title={info.getValue()} size="sm" />
          </TableCell>
        ),
      }),
      columnHelper.accessor('pilotes', {
        header: () => (
          <TableHeaderCell
            className="w-44"
            title="Pilotes"
            filter={
              <HeaderFilter
                options={piloteOptions}
                values={pilotes}
                onChange={setPilotes}
              />
            }
          />
        ),
        cell: (info) => <TableCell>{info.getValue()?.join(', ')}</TableCell>,
      }),
      columnHelper.accessor('dateDeFin', {
        header: () => (
          <TableHeaderCell
            className="w-36"
            title="Date de fin"
            sortFn={() => trierPar('dateDeFin')}
            sortDirection={sort === 'dateDeFin' ? direction : null}
          />
        ),
        cell: (info) => <TableCell>{info.getValue()}</TableCell>,
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statuts, pilotes, sort, direction]
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <ReactTable
      table={table}
      ariaLabel="Actions filtrables"
      isLoading={isLoading}
      // L'état vide reste dans le tableau, en-tête compris : ce sont les
      // filtres qu'il faut pouvoir desserrer.
      isEmpty={data.length === 0}
      emptyCard={{
        title: 'Aucun résultat pour ces filtres',
        className: 'min-h-[12rem]',
        actions: [
          {
            children: 'Réinitialiser les filtres',
            onClick: () => {
              setStatuts([]);
              setPilotes([]);
            },
            variant: 'outlined',
            size: 'sm',
          },
        ],
      }}
      getRowProps={(row) => ({
        'data-test': `action-${row.id}`,
      })}
    />
  );
};
