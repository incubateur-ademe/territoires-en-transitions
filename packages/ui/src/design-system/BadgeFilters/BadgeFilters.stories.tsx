import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { action } from 'storybook/actions';
import { StoryWrapper } from '../../storybook/story.wrapper';
import { BadgeFilters, FilterCategory } from './index';

// Define typed category keys for better type safety
type TaskFilterKeys = 'status' | 'priority' | 'category' | 'assignee';

const meta: Meta<typeof BadgeFilters> = {
  component: BadgeFilters,
  title: 'Design System/BadgesFilters',
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

type Story = StoryObj<typeof BadgeFilters>;

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
  {
    key: 'assignee',
    title: 'Sans pilote',
    selectedFilters: [],
    onlyShowCategory: true,
    readonly: true,
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
      prev
        .map((category) =>
          category.key === categoryKey
            ? {
                ...category,
                selectedFilters: category.selectedFilters.filter(
                  (f) => f !== valueToDelete
                ),
              }
            : category
        )
        .filter(
          (category) =>
            category.onlyShowCategory || category.selectedFilters.length > 0
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
    const filteredCategories = filterCategories.filter(
      (category) => category.readonly
    );
    setFilterCategories(filteredCategories);
    action('onClearAllFilters')();
  };

  return (
    <StoryWrapper
      title="Interactive FilterBadges (Typed)"
      description="Try clicking on individual filter values or category close buttons to see the component in action. This example uses typed category keys for better type safety."
    >
      <>
        <BadgeFilters<TaskFilterKeys>
          filterCategories={filterCategories}
          onDeleteFilterValue={({ categoryKey, valueToDelete }) =>
            handleDeleteFilterValue(
              categoryKey as TaskFilterKeys,
              valueToDelete
            )
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
      </>
    </StoryWrapper>
  );
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

export const NonInteractiveExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <StoryWrapper
        title="One Category"
        description="A single category with one filter value. Only the filter close button is shown."
      >
        <BadgeFilters<TaskFilterKeys>
          filterCategories={[
            {
              key: 'priority',
              title: 'Priority',
              selectedFilters: ['High'],
            },
          ]}
          onDeleteFilterValue={action('onDeleteFilterValue')}
          onDeleteFilterCategory={action('onDeleteFilterCategory')}
          onClearAllFilters={action('onClearAllFilters')}
        />
      </StoryWrapper>

      <StoryWrapper
        title="Multiple Categories"
        description="Multiple categories with filter values."
      >
        <BadgeFilters<TaskFilterKeys>
          filterCategories={[
            {
              key: 'priority',
              title: 'Priority',
              selectedFilters: ['High', 'Low'],
            },
            {
              key: 'status',
              title: 'Status',
              selectedFilters: ['En cours', 'En attente'],
            },
          ]}
          onDeleteFilterValue={action('onDeleteFilterValue')}
          onDeleteFilterCategory={action('onDeleteFilterCategory')}
          onClearAllFilters={action('onClearAllFilters')}
        />
      </StoryWrapper>

      <StoryWrapper
        title="Only Categories Without Value"
        description="Categories are shown as single category filter, but none have any filter values."
      >
        <BadgeFilters
          filterCategories={[
            {
              key: 'noStatus',
              title: 'Sans statut',
              selectedFilters: [],
              onlyShowCategory: true,
            },
            {
              key: 'noPriority',
              title: 'Sans priorité',
              selectedFilters: [],
              onlyShowCategory: true,
            },
          ]}
          onDeleteFilterValue={action('onDeleteFilterValue')}
          onDeleteFilterCategory={action('onDeleteFilterCategory')}
          onClearAllFilters={action('onClearAllFilters')}
        />
      </StoryWrapper>

      <StoryWrapper
        title="Without category delete"
        description="No close button on categories"
      >
        <BadgeFilters<TaskFilterKeys>
          filterCategories={[
            {
              key: 'priority',
              title: 'Priority',
              selectedFilters: ['High', 'Low'],
            },
            {
              key: 'status',
              title: 'Status',
              selectedFilters: ['En cours', 'En attente'],
            },
          ]}
          onDeleteFilterValue={action('onDeleteFilterValue')}
          onClearAllFilters={action('onClearAllFilters')}
        />
      </StoryWrapper>

      <StoryWrapper
        title="Without Clear All"
        description="The 'Clear all filters' button will not be shown because onClearAllFilters is not provided."
      >
        <BadgeFilters<TaskFilterKeys>
          filterCategories={[
            {
              key: 'priority',
              title: 'Priority',
              selectedFilters: ['High'],
            },
            {
              key: 'status',
              title: 'Status',
              selectedFilters: ['En cours', 'En attente'],
            },
          ]}
          onDeleteFilterValue={action('onDeleteFilterValue')}
          onDeleteFilterCategory={action('onDeleteFilterCategory')}
        />
      </StoryWrapper>

      <StoryWrapper
        title="Some only categories, some with values"
        description="Some categories are readonly (badges/close cannot be deleted), some are editable."
      >
        <BadgeFilters<TaskFilterKeys>
          filterCategories={[
            {
              key: 'priority',
              title: 'Sans priorité',
              selectedFilters: [],
              onlyShowCategory: true,
            },
            {
              key: 'status',
              title: 'Statut',
              selectedFilters: ['En cours'],
            },
          ]}
          onDeleteFilterValue={action('onDeleteFilterValue')}
          onDeleteFilterCategory={action('onDeleteFilterCategory')}
          onClearAllFilters={action('onClearAllFilters')}
        />
      </StoryWrapper>

      <StoryWrapper
        title="Some Readonly, Some Not"
        description="Some categories are readonly (badges/close cannot be deleted), some are editable."
      >
        <BadgeFilters<TaskFilterKeys>
          filterCategories={[
            {
              key: 'priority',
              title: 'Priority',
              selectedFilters: ['High', 'Low'],
              readonly: true,
            },
            {
              key: 'status',
              title: 'Status',
              selectedFilters: ['En cours'],
            },
          ]}
          onDeleteFilterValue={action('onDeleteFilterValue')}
          onDeleteFilterCategory={action('onDeleteFilterCategory')}
          onClearAllFilters={action('onClearAllFilters')}
        />
      </StoryWrapper>

      <StoryWrapper
        title="Readonly"
        description="All categories and badges are set to readonly. Nothing can be removed."
      >
        <BadgeFilters<TaskFilterKeys>
          filterCategories={[
            {
              key: 'priority',
              title: 'Priority',
              selectedFilters: ['High', 'Low'],
              readonly: true,
            },
            {
              key: 'status',
              title: 'Status',
              selectedFilters: ['En cours', 'En attente'],
              readonly: true,
            },
            {
              key: 'assignee',
              title: 'Sans pilote',
              selectedFilters: [],
              onlyShowCategory: true,
              readonly: true,
            },
          ]}
          onDeleteFilterValue={action('onDeleteFilterValue')}
        />
      </StoryWrapper>
    </div>
  ),
};
