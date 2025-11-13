import { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { action } from 'storybook/actions';
import { FilterBadges, FilterCategory } from '.';

// Define typed category keys for better type safety
type TaskFilterKeys = 'status' | 'priority' | 'category' | 'assignee';
type ProjectFilterKeys = 'phase' | 'team' | 'budget';

const meta: Meta<typeof FilterBadges> = {
  component: FilterBadges,
  title: 'Design System/FilterBadges',
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays filter chips organized by categories. Each category shows its title and the selected filter values as removable chips. The component is generic and supports typed category keys for better type safety.',
      },
    },
  },
  decorators: [(story) => <div className="p-4 max-w-4xl">{story()}</div>],
};

export default meta;

type Story = StoryObj<typeof FilterBadges>;

// Sample data for stories with generic typing
const sampleFilterCategories: FilterCategory<TaskFilterKeys>[] = [
  {
    key: 'status',
    title: 'Statut',
    selectedFilters: ['En cours', 'Terminé', 'En attente'],
  },
  {
    key: 'priority',
    title: 'Priorité',
    selectedFilters: ['Haute', 'Moyenne'],
  },
  {
    key: 'category',
    title: 'Catégorie',
    selectedFilters: ['Développement', 'Design', 'Marketing'],
  },
];

const singleCategoryFilters: FilterCategory<TaskFilterKeys>[] = [
  {
    key: 'status',
    title: 'Statut',
    selectedFilters: ['En cours', 'Terminé'],
  },
];

const manyFilters: FilterCategory<TaskFilterKeys>[] = [
  {
    key: 'status',
    title: 'Statut',
    selectedFilters: [
      'En cours',
      'Terminé',
      'En attente',
      'Annulé',
      'En révision',
    ],
  },
  {
    key: 'priority',
    title: 'Priorité',
    selectedFilters: ['Haute', 'Moyenne', 'Basse', 'Urgente'],
  },
  {
    key: 'category',
    title: 'Catégorie',
    selectedFilters: [
      'Développement',
      'Design',
      'Marketing',
      'Finance',
      'RH',
      'IT',
    ],
  },
  {
    key: 'assignee',
    title: 'Assigné à',
    selectedFilters: ['Jean Dupont', 'Marie Martin', 'Pierre Durand'],
  },
];

const projectFilters: FilterCategory<ProjectFilterKeys>[] = [
  {
    key: 'phase',
    title: 'Phase',
    selectedFilters: ['Planification', 'Développement'],
  },
  {
    key: 'team',
    title: 'Équipe',
    selectedFilters: ['Frontend', 'Backend'],
  },
  {
    key: 'budget',
    title: 'Budget',
    selectedFilters: ['< 10k€', '10k€ - 50k€'],
  },
];

// Interactive story with state management
const InteractiveFilterBadges = () => {
  const [filterCategories, setFilterCategories] = useState<
    FilterCategory<TaskFilterKeys>[]
  >(sampleFilterCategories);

  const handleDeleteFilterValue = (
    categoryKey: TaskFilterKeys,
    valueToDelete: string
  ) => {
    setFilterCategories((prev) =>
      prev.map((category) =>
        category.key === categoryKey
          ? {
              ...category,
              selectedFilters: category.selectedFilters.filter(
                (f) => f !== valueToDelete
              ),
            }
          : category
      )
    );
    action('onDeleteFilterValue')(categoryKey, valueToDelete);
  };

  const handleDeleteFilterCategory = (
    categoryKey: TaskFilterKeys | TaskFilterKeys[]
  ) => {
    setFilterCategories((prev) =>
      prev.filter((category) => {
        if (Array.isArray(categoryKey)) {
          return !categoryKey.includes(category.key as TaskFilterKeys);
        }
        return category.key !== categoryKey;
      })
    );
    action('onDeleteFilterCategory')(categoryKey);
  };

  const handleClearAllFilters = () => {
    setFilterCategories([]);
    action('onClearAllFilters')();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Interactive FilterBadges (Typed)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Try clicking on individual filter values or category close buttons to
          see the component in action. This example uses typed category keys for
          better type safety.
        </p>
      </div>
      <FilterBadges<TaskFilterKeys>
        filterCategories={filterCategories}
        onDeleteFilterValue={({ categoryKey, valueToDelete }) =>
          handleDeleteFilterValue(categoryKey as TaskFilterKeys, valueToDelete)
        }
        onDeleteFilterCategory={handleDeleteFilterCategory}
        onClearAllFilters={handleClearAllFilters}
      />
      {filterCategories.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          All filters have been cleared. Refresh the page to see the filters
          again.
        </p>
      )}
    </div>
  );
};

export const SingleCategory: Story = {
  args: {
    filterCategories: singleCategoryFilters,
    onDeleteFilterValue: action('onDeleteFilterValue'),
    onDeleteFilterCategory: action('onDeleteFilterCategory'),
    onClearAllFilters: action('onClearAllFilters'),
  },
};

export const ManyFilters: Story = {
  args: {
    filterCategories: manyFilters,
    onDeleteFilterValue: action('onDeleteFilterValue'),
    onDeleteFilterCategory: action('onDeleteFilterCategory'),
    onClearAllFilters: action('onClearAllFilters'),
  },
};

export const ProjectFilters: Story = {
  args: {
    filterCategories: projectFilters,
    onDeleteFilterValue: action('onDeleteFilterValue'),
    onDeleteFilterCategory: action('onDeleteFilterCategory'),
    onClearAllFilters: action('onClearAllFilters'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example with different typed category keys (ProjectFilterKeys) showing how the component adapts to different use cases.',
      },
    },
  },
};

export const Interactive: Story = {
  render: () => <InteractiveFilterBadges />,
  parameters: {
    docs: {
      description: {
        story:
          'This is an interactive example where you can actually remove filters and see the component update in real-time. It uses typed category keys for better type safety.',
      },
    },
  },
};

export const WithoutCategoryDelete: Story = {
  args: {
    filterCategories: sampleFilterCategories,
    onDeleteFilterValue: action('onDeleteFilterValue'),
    onClearAllFilters: action('onClearAllFilters'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example showing the component when onDeleteFilterCategory is not provided. Category delete buttons will not be shown, but individual filter values can still be removed.',
      },
    },
  },
};

export const WithoutClearAll: Story = {
  args: {
    filterCategories: sampleFilterCategories,
    onDeleteFilterValue: action('onDeleteFilterValue'),
    onDeleteFilterCategory: action('onDeleteFilterCategory'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example showing the component when onClearAllFilters is not provided. The "Clear all filters" button will not be shown.',
      },
    },
  },
};

export const MinimalProps: Story = {
  args: {
    filterCategories: singleCategoryFilters,
    onDeleteFilterValue: action('onDeleteFilterValue'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example with only the required props (filterCategories and onDeleteFilterValue). No category delete buttons or clear all button will be shown.',
      },
    },
  },
};

export const MixedCategoryDisplay: Story = {
  args: {
    filterCategories: [
      {
        key: 'status',
        title: 'Statut',
        selectedFilters: ['En cours', 'Terminé', 'En attente'],
        onlyShowCategory: false, // Shows individual filter values
      },
      {
        key: 'noPilote',
        title: 'Sans pilote',
        selectedFilters: [], // Boolean filter - no individual values to show
        onlyShowCategory: true, // Only shows the category title
      },
      {
        key: 'priority',
        title: 'Priorité',
        selectedFilters: ['Haute', 'Moyenne'],
        // onlyShowCategory not set - defaults to false, shows individual values
      },
    ],
    onDeleteFilterValue: action('onDeleteFilterValue'),
    onDeleteFilterCategory: action('onDeleteFilterCategory'),
    onClearAllFilters: action('onClearAllFilters'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example showing mixed category display behavior. The "Statut" and "Priorité" filters show individual selected values as removable chips, while the "Sans pilote" filter only shows the category title (useful for boolean filters).',
      },
    },
  },
};
