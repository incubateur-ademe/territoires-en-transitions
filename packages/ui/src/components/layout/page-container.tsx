import classNames from 'classnames';
import React from 'react';

const bgColorsToClassName = {
  grey: 'bg-grey-2',
  white: 'bg-white',
  primary: 'bg-primary-1',
};

type Props = {
  children?: React.ReactNode;
  containerClassName?: string;
  innerContainerClassName?: string;
  bgColor?: 'grey' | 'white' | 'primary';
  dataTest?: string;
};

/**
 * Élément de layout pour les pages ainsi que tout contenu
 * nécéssitant une largeur maximale égale à celle de la page.
 * Exemple: contenu interne au header, footer, etc.
 * Le container fait toute la largeur de l'écran et le `innercontainer` permet d'avoir la largeur maximale.
 */
const PageContainer = ({
  dataTest,
  containerClassName,
  innerContainerClassName,
  bgColor = 'grey',
  children,
}: Props) => {
  return (
    <div
      data-test={dataTest}
      className={classNames(
        'w-full',
        bgColorsToClassName[bgColor],
        containerClassName
      )}
    >
      <div
        className={classNames(
          'w-full max-w-[90rem] mx-auto px-2 md:px-4 lg:px-6 py-12',
          innerContainerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
