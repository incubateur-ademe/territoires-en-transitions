import classNames from 'classnames';

import { ErrorInfo } from '@/app/utils/error-info';
import { TRPCClientErrorLike } from '@trpc/client';
import { ModuleProps } from './module';
import { ModuleContainer } from './module.container';

type Props = Pick<ModuleProps, 'className' | 'title'> & {
  error: Error | TRPCClientErrorLike<any>;
};

/** Affichage d'une erreur dans un module */
export const ModuleError = ({ className, title, error }: Props) => {
  return (
    <ModuleContainer
      className={classNames(
        '!gap-0 items-center text-center justify-center !bg-primary-0',
        className
      )}
    >
      <ErrorInfo
        error={error}
        title={`${title}: erreur lors du changement des données !`}
      />
    </ModuleContainer>
  );
};
