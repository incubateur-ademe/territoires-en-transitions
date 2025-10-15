import classNames from 'classnames';

import { PictoWarning } from '@/ui/design-system/Picto/PictoWarning';

import { Button, ButtonProps } from '@/ui';
import React from 'react';
import { ModuleProps } from './module';
import { ModuleContainer } from './module.container';

type Props = Pick<ModuleProps, 'className' | 'title' | 'errorButtons'>;

/** Affichage d'une erreur dans un module */
export const ModuleError = ({ className, title, errorButtons }: Props) => {
  return (
    <ModuleContainer
      className={classNames(
        '!gap-0 items-center justify-center text-center !bg-primary-0',
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
      {errorButtons && (
        <div className="mt-4 flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
          {errorButtons.map((action, index) => (
            <React.Fragment key={index}>
              <Button size={'md'} {...(action as ButtonProps)} />
              {index % 2 !== 0 && index !== errorButtons.length - 1 && (
                <div className="basis-full h-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </ModuleContainer>
  );
};
