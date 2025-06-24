import { useState } from 'react';
import { FilterCategory, FilterChips } from './FilterChips';

// Define typed category keys for better type safety
type TaskFilterKeys = 'status' | 'priority' | 'category' | 'assignee';

/**
 * Example component demonstrating how to use FilterChips in a real application
 * with typed category keys for better type safety
 */
export const FilterChipsExample = () => {
  const [filterCategories, setFilterCategories] = useState<
    FilterCategory<TaskFilterKeys>[]
  >([
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
  ]);

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
    console.log(
      `Deleted filter value: ${valueToDelete} from category: ${categoryKey}`
    );
  };

  const handleDeleteFilterCategory = (categoryKey: TaskFilterKeys) => {
    setFilterCategories((prev) =>
      prev.filter((category) => category.key !== categoryKey)
    );
    console.log(`Deleted filter category: ${categoryKey}`);
  };

  const handleClearAllFilters = () => {
    setFilterCategories([]);
    console.log('Cleared all filters');
  };

  const addSampleFilter = () => {
    setFilterCategories((prev) => [
      ...prev,
      {
        key: 'assignee',
        title: 'Assigné à',
        selectedFilters: ['Jean Dupont', 'Marie Martin'],
      },
    ]);
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border">
      <div>
        <h2 className="text-xl font-semibold mb-2">
          FilterChips Example (Typed)
        </h2>
        <p className="text-gray-600 mb-4">
          This example shows how to integrate FilterChips into your application
          with state management and typed category keys for better type safety.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={addSampleFilter}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Sample Filter
          </button>
        </div>

        <FilterChips<TaskFilterKeys>
          filterCategories={filterCategories}
          onDeleteFilterValue={handleDeleteFilterValue}
          onDeleteFilterCategory={handleDeleteFilterCategory}
          onClearAllFilters={handleClearAllFilters}
        />

        {filterCategories.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No filters selected. Click "Add Sample Filter" to see the component
            in action.
          </p>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Current Filter State:</h3>
        <pre className="text-sm text-gray-700 overflow-auto">
          {JSON.stringify(filterCategories, null, 2)}
        </pre>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2 text-blue-800">
          Type Safety Benefits:
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • Category keys are typed: only 'status', 'priority', 'category',
            'assignee' are allowed
          </li>
          <li>
            • TypeScript will catch errors if you try to use an invalid category
            key
          </li>
          <li>• Better IDE support with autocomplete for category keys</li>
          <li>• Runtime type safety for filter operations</li>
        </ul>
      </div>
    </div>
  );
};
