import classNames from 'classnames';
import { alertClassnames } from '../Alert/utils';
import { Button, ButtonProps } from '../Button';

type BottomOkCancelProps = {
  title: string;

  /** Les props du bouton "Valider" */
  btnOKProps: ButtonProps;
  /** Les props du bouton "Annuler" (si non spécifié, le bouton est masqué) */
  btnCancelProps?: ButtonProps;
};

export const BottomOkCancel = (props: BottomOkCancelProps) => {
  const { btnOKProps, btnCancelProps, title } = props;
  const { children: ok, ...btnOKRemainingProps } = btnOKProps;
  const { children: cancel, ...btnCancelRemainingProps } = btnCancelProps || {};
  const styles = alertClassnames['info'];

  return (
    <div
      className={classNames(
        'w-full px-4 lg:px-6 fixed left-0 bottom-0 border-t border-t-info-1 pt-2 pb-4 transition-all duration-500 opacity-100 z-50',
        styles.background
      )}
    >
      <div
        className={classNames(
          'py-3 flex gap-4 w-full mx-auto xl:max-w-6xl 2xl:max-w-8xl',
          styles.background
        )}
      >
        {/* Titre et texte additionnel */}
        <div className="w-full flex gap-4 justify-between">
          <div
            className={classNames(
              'flex flex-col justify-center text-base font-bold',
              styles.text
            )}
          >
            {title}
          </div>
          <div className="flex gap-3 justify-center">
            {btnCancelProps && (
              <Button
                type="button"
                variant="outlined"
                {...btnCancelRemainingProps}
              >
                {cancel || 'Annuler'}
              </Button>
            )}
            <Button type="submit" {...btnOKRemainingProps}>
              {ok || 'Confirmer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
