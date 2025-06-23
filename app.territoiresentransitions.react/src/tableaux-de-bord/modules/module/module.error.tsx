import classNames from 'classnames';

import { PictoWarning } from '@/ui/design-system/Picto/PictoWarning';

import { ModuleProps } from './module';
import { ModuleContainer } from './module.container';

type Props = Pick<ModuleProps, 'className' | 'title'>;

/** Affichage d'une erreur dans un module */
export const ModuleError = ({ className, title }: Props) => {
  return (
    <ModuleContainer
      className={classNames(
        '!gap-0 items-center text-center !bg-primary-0',
        className
      )}
    >
      <div className="mb-4">
        <PictoWarning />
      </div>
      <h6 className="mb-2 text-primary-8">
        Erreur lors du changement des données !
      </h6>
      <p className={classNames('mb-0', 'text-primary-9')}>{title}</p>
    </ModuleContainer>
  );
};
