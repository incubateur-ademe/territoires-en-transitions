import {forwardRef, Ref} from 'react';
import IconThreeDotHorizontal from 'ui/icons/IconThreeDotHorizontal';
import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';
import {TOption} from './commons';
import classNames from 'classnames';

type TOptionWithIcon = TOption & {icon?: string};

/** Affiche un bouton avec une petite icone permettant d'ouvrir un menu déroulant */
const SmallIconContextMenu = ({
  /** id du menu déroulant pour les tests */
  dataTest,
  /** id du bouton d'ouverture du menu déroulant pour les tests */
  dataTestButton,
  /** options du menu */
  options,
  /** styles complémentaires pour le bouton */
  buttonClassname,
  /** titre du bouton */
  title,
  /** pour désactiver le bouton */
  disabled,
  /** désactive l'icone par défaut `...` (passer à la place une classe css fr-icon-) */
  hideDefaultIcon,
  /** appelée lorsqu'une option est sélectionnée */
  onSelect,
}: {
  dataTest?: string;
  dataTestButton?: string;
  options: TOptionWithIcon[];
  buttonClassname?: string;
  hideDefaultIcon?: boolean;
  title?: string;
  disabled?: boolean;
  onSelect: (value: string) => void;
}) => {
  return (
    <DropdownFloater
      placement="bottom-end"
      render={({close}) => (
        <nav data-test={dataTest}>
          <ul className="m-0 p-0">
            {options.map(({value, label, icon}) => (
              <li
                key={value}
                className="fr-nav__item pb-0 border-b border-gray-200"
              >
                <button
                  className="fr-nav__link !flex !items-center !text-bf500 !py-2 !px-3 before:!hidden !shadow-none"
                  onClick={() => {
                    onSelect(value);
                    close();
                  }}
                >
                  {icon && (
                    <span className={classNames('scale-75 mr-1', icon)} />
                  )}
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    >
      <SmallIconButton
        dataTest={dataTestButton}
        className={buttonClassname}
        title={title}
        hideDefaultIcon={hideDefaultIcon}
        disabled={disabled}
      />
    </DropdownFloater>
  );
};

export default SmallIconContextMenu;

const SmallIconButton = forwardRef(
  (
    {
      isOpen,
      dataTest,
      className,
      hideDefaultIcon,
      ...props
    }: {
      isOpen?: boolean;
      dataTest?: string;
      className?: string;
      title?: string;
      disabled?: boolean;
      hideDefaultIcon?: boolean;
    },
    ref?: Ref<HTMLButtonElement>
  ) => (
    <button
      ref={ref}
      data-test={dataTest}
      className={classNames(
        'border border-solid border-gray-200 p-1 text-bf500 h-8 w-8',
        className
      )}
      {...props}
    >
      {!hideDefaultIcon && (
        <IconThreeDotHorizontal className="w-5 h-5 fill-bf500" />
      )}
    </button>
  )
);
