import classNames from 'classnames';

import FilterBadges from '@/app/ui/lists/filter-badges';
import { Button } from '@/ui';
import { ModuleProps } from './module';
import ModuleContainer from './module.container';

type Props = Pick<
  ModuleProps,
  'className' | 'title' | 'symbole' | 'emptyButtons'
> & {
  filterBadges?: string[];
};

/** Affichage de l'état vide d'un module */
const ModuleEmpty = ({
  className,
  symbole,
  title,
  emptyButtons,
  filterBadges,
}: Props) => (
  <ModuleContainer
    className={classNames(
      '!gap-0 items-center text-center justify-center !bg-primary-0',
      className
    )}
  >
    <div className="mb-4">{symbole}</div>
    <h6 className="mb-2 text-primary-8">{title}</h6>
    <div className="w-full flex flex-col items-center gap-6">
      <p className="mb-0 text-primary-9">Aucun résultat pour ce filtre !</p>
      <FilterBadges
        maxDisplayedFilterCount={1}
        className="justify-center"
        badges={filterBadges}
      />
      {emptyButtons?.length && (
        <div className="flex justify-center flex-wrap gap-2">
          {emptyButtons.map((action, index) => (
            <Button key={index} {...action} />
          ))}
        </div>
      )}
    </div>
  </ModuleContainer>
);

export default ModuleEmpty;
