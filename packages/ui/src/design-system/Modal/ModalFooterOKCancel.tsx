import {Button} from '@design-system/Button';
import {ButtonProps} from '../Button/types';
import {ModalFooter} from './ModalFooter';

/**
 * Variante de `ModalFooter` pour le cas courant "Annuler/Valider"
 */
export const ModalFooterOKCancel = (props: {
  /** Les props du bouton "Valider" */
  btnOKProps: ButtonProps;
  /** Les props du bouton "Annuler" (si non spécifié, le bouton est masqué) */
  btnCancelProps?: ButtonProps;
}) => {
  const {btnOKProps, btnCancelProps} = props;
  const {children: ok, ...btnOKRemainingProps} = btnOKProps;
  const {children: cancel, ...btnCancelRemainingProps} = btnCancelProps || {};

  return (
    <ModalFooter variant="right">
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
