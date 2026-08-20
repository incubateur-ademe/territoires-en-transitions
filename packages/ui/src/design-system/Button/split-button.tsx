import { Placement } from '@floating-ui/react';

import { uiLabels } from '../../labels/catalog';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { ButtonMenu, MenuAction } from './button-menu';
import { ButtonProps, ButtonVariant } from './types';

/**
 * Séparation entre les deux moitiés, sur les variantes dont la bordure se
 * confond avec le fond. Les variantes détourées (`outlined`, `grey`) ont déjà
 * un trait visible : leurs bordures se superposent, rien à ajouter.
 */
const dividerClassnames: Partial<Record<ButtonVariant, string>> = {
  primary: 'border-l-primary-7 hover:!border-l-primary-6',
  secondary: 'border-l-secondary-2 hover:!border-l-secondary-1',
  white: 'border-l-grey-3 hover:!border-l-grey-3',
};

type Props = {
  /** Actions secondaires, rangées derrière la flèche. */
  menuActions: MenuAction[];
  /** Placement du menu par rapport au bouton, `bottom-end` par défaut. */
  menuPlacement?: Placement;
  /** `data-test` de la flèche — l'action principale reçoit `dataTest`. */
  menuDataTest?: string;
} & ButtonProps;

/**
 * Bouton scindé : l'action principale reste à un clic, les actions secondaires
 * se rangent derrière la flèche. À préférer au `ButtonMenu` quand une action
 * domine nettement les autres, sinon la principale coûterait deux gestes.
 */
export const SplitButton = ({
  menuActions,
  menuPlacement,
  menuDataTest,
  className,
  ...props
}: Props) => {
  const { variant = 'primary', size = 'md', disabled } = props;

  return (
    // `items-stretch` : le bouton-icône a son propre padding (`p-2.5` en `sm`
    // là où la moitié texte fait `py-2.5`), il serait plus court de quelques
    // pixels s'il ne s'alignait pas sur la hauteur de l'action principale.
    <div className={cn('flex w-fit items-stretch', className)}>
      <Button {...props} className="rounded-r-none" />
      <ButtonMenu
        variant={variant}
        size={size}
        disabled={disabled}
        icon="arrow-down-s-line"
        aria-label={uiLabels.autresActions}
        dataTest={menuDataTest}
        // `-ml-px` : les deux bordures adjacentes se superposent au lieu de
        // dessiner un trait de 2px.
        className={cn('-ml-px rounded-l-none', dividerClassnames[variant])}
        menu={{ actions: menuActions, placement: menuPlacement }}
      />
    </div>
  );
};
