import React, { HTMLAttributes } from 'react';
import classNames from 'classnames';

type Props = HTMLAttributes<HTMLDivElement> & {
  dataTest?: string;
};

/**
 * Élément de layout pour les pages ainsi que tout contenu
 * nécéssitant une largeur maximale égale à celle de la page.
 * Exemple: contenu interne au header, footer, etc.
 */
const PageContainer = ({ dataTest, className, ...props }: Props) => {
  return (
    <div
      data-test={dataTest}
      className={classNames(
        'w-full max-w-[90rem] mx-auto px-4 lg:px-6',
        className
      )}
      {...props}
    />
  );
};

export default PageContainer;
