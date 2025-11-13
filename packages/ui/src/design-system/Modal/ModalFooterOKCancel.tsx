import { Button } from '../Button';
import { ButtonProps } from '../Button/types';
import { ModalFooter, ModalFooterProps } from './ModalFooter';

export type ModalFooterOKCancelProps = Omit<
  ModalFooterProps,
  'children' | 'variant'
> & {
  /** Les props du bouton "Valider" */
  btnOKProps: ButtonProps;
  /** Les props du bouton "Annuler" (si non spécifié, le bouton est masqué) */
  btnCancelProps?: ButtonProps;
};

/**
 * Variante de `ModalFooter` pour le cas courant "Annuler/Valider"
 */
export const ModalFooterOKCancel = (props: ModalFooterOKCancelProps) => {
  const { btnOKProps, btnCancelProps, ...remainingProps } = props;
  const { children: ok, ...btnOKRemainingProps } = btnOKProps;
  const { children: cancel, ...btnCancelRemainingProps } = btnCancelProps || {};

  return (
    <ModalFooter variant="right" {...remainingProps}>
      {btnCancelProps && (
        <Button type="button" variant="outlined" {...btnCancelRemainingProps}>
          {cancel || 'Annuler'}
        </Button>
      )}
      <Button type="submit" {...btnOKRemainingProps}>
        {ok || 'Valider'}
      </Button>
    </ModalFooter>
  );
};
