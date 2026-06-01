import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { categorieToLabel } from '@/app/referentiels/utils';
import { Divider } from '@tet/ui';
import { Subaction } from './subaction';

type Props = {
  subActionsByCategories: {
    [categorie: string]: ActionListItem[];
  };
};

export const SubactionsListContainer = ({ subActionsByCategories }: Props) => {
  const isCategoryNameDisplayed =
    Object.values(subActionsByCategories).reduce(
      (acc, category) => acc + category.length,
      0
    ) > 1;

  return (
    <div className="flex flex-col gap-8">
      {Object.keys(subActionsByCategories).map(
        (categorie) =>
          subActionsByCategories[categorie] && (
            <div key={categorie} className="flex flex-col">
              {isCategoryNameDisplayed && (
                <>
                  <h6 className="mb-0 text-sm">
                    {categorieToLabel[categorie].toUpperCase()}
                  </h6>
                  <Divider className="mt-2 mb-6" color="primary" />
                </>
              )}

              <div>
                <div className="flex flex-col gap-7">
                  {subActionsByCategories[categorie].map((subAction) => (
                    <Subaction key={subAction.actionId} subAction={subAction} />
                  ))}
                </div>
              </div>
            </div>
          )
      )}
    </div>
  );
};
