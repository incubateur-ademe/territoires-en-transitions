import {ReactNode} from 'react';

export type TPageHeaderProps = {
  /** Styles complémentaires */
  className?: string;
  /** Contenu du bandeau */
  children: ReactNode;
};

/**
 * Affiche un bandeau d'en-tête pleine page qui reste fixe lors du défilement
 */
export const PageHeader = (props: TPageHeaderProps) => {
  const {className, children} = props;
  return (
    <div
      className={`sticky top-0 z-40 bg-bf925 w-full min-h-[112px] flex items-center justify-center fr-mt-4w ${
        className || ''
      }`}
    >
      {children}
    </div>
  );
};

/**
 * Affiche une variante du bandeau d'en-tête avec contenus ancrés à gauche
 */
export const PageHeaderLeft = (props: TPageHeaderProps) => {
  const {className, children} = props;
  return (
    <PageHeader className={className}>
      <div className="w-full max-w-3xl flex flex-col m-4">{children}</div>
    </PageHeader>
  );
};
