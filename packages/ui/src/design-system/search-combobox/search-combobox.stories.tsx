import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { SearchCombobox } from './search-combobox';
import type {
  SearchComboboxGroup,
  SearchComboboxSelection,
} from './search-combobox.types';

const meta: Meta<typeof SearchCombobox> = {
  component: SearchCombobox,
};

export default meta;

type Story = StoryObj<typeof SearchCombobox>;

const COLLECTIVITES = [
  'CC du Pays d’Héricourt',
  'CC du Pays de Lunel',
  'CC du Pays de Lure',
  'Montpellier Méditerranée Métropole',
  'PETR du Pays Lauragais',
];

/**
 * Une recherche naïve, pour la démonstration : dans l'app, les suggestions
 * passent par `rankSearchMatches` de `@tet/domain/utils`.
 */
const getSuggestions = (query: string): SearchComboboxGroup[] => {
  const options = COLLECTIVITES.flatMap((label) => {
    const start = label.toLowerCase().indexOf(query.toLowerCase());
    return start === -1
      ? []
      : [
          {
            id: label,
            label,
            highlightRanges: [[start, start + query.length] as const],
            badge: label.startsWith('PETR') ? 'Supra' : undefined,
          },
        ];
  });
  return options.length
    ? [{ id: 'collectivites', label: 'Collectivités', options }]
    : [];
};

const Demo = () => {
  const [value, setValue] = useState('');
  const [selections, setSelections] = useState<SearchComboboxSelection[]>([]);
  return (
    <div className="flex flex-col gap-4 w-[28rem]">
      <SearchCombobox
        label="Rechercher une collectivité"
        placeholder="Rechercher une collectivité"
        value={value}
        onSearch={setValue}
        getSuggestions={getSuggestions}
        onSelectOption={({ id, label }) =>
          setSelections((current) => [...current, { id, label }])
        }
        selections={selections}
        onRemoveSelection={(id) =>
          setSelections((current) => current.filter((s) => s.id !== id))
        }
      />
      <p className="text-sm text-grey-8">Recherche appliquée : « {value} »</p>
    </div>
  );
};

export const Default: Story = {
  render: () => <Demo />,
};
