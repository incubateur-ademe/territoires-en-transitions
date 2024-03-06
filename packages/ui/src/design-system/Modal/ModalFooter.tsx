import {Divider} from '@design-system/Divider';
import classNames from 'classnames';

type ModalFooterVariant = 'center' | 'right' | 'space';

const variantToClassnames: Record<ModalFooterVariant, string> = {
  center: 'justify-center',
  right: 'justify-end',
  space: 'justify-between',
};

export type ModalFooterProps = {
  /** Contenu principal du pied de page */
  children: React.ReactNode | React.ReactNode[];
  /** Contenu optionnel entre la ligne de séparation et le contenu principal */
  content?: React.ReactNode | React.ReactNode[];
  /** Variante visuelle */
  variant?: ModalFooterVariant;
};

/**
 * Composant de base pour le pied-de-page des modales.
 * Contient généralement un ou plusieurs boutons.
 */
export const ModalFooter = ({
  children,
  content,
  variant = 'right',
}: ModalFooterProps) => {
  return (
    <>
      <Divider className="mt-4" />
      {content}
      <div
        className={classNames(
          'flex gap-4 flex-wrap',
          variantToClassnames[variant]
        )}
      >
        {children}
      </div>
    </>
  );
};

/**
 * Conteneur lorsque le pied-de-page d'une modale doit être séparée en plusieurs
 * sections (variante `space`).
 */
export const ModalFooterSection = ({
  children,
}: {
  children: React.ReactNode | React.ReactNode[];
}) => {
  return <div className="flex gap-4 flex-wrap">{children}</div>;
};
