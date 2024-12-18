import IconThreeDotHorizontal from '@/app/ui/icons/IconThreeDotHorizontal';
import DropdownFloater from '@/app/ui/shared/floating-ui/DropdownFloater';
import classNames from 'classnames';
import { forwardRef, Ref } from 'react';
import { TOption } from './commons';

export type TOptionWithIcon = TOption & { icon?: string };

/** Affiche un bouton "..." permettant d'ouvrir un menu déroulant */
const ThreeDotMenu = ({
  /** id du menu déroulant pour les tests */
  dataTest,
  /** options du menu */
  options,
  /** styles complémentaires pour le bouton */
  buttonClassname,
  /** appelée lorsqu'une option est sélectionnée, return true si on veut éviter de fermer le menu pour le fermer plus tard */
  onSelect,
}: {
  dataTest?: string;
  options: TOptionWithIcon[];
  buttonClassname?: string;
  onSelect: (value: string, close: () => void) => boolean | void;
}) => {
  return (
    <DropdownFloater
      placement="bottom-end"
      render={({ close }) => (
        <nav data-test={dataTest}>
          <ul className="m-0 p-0">
            {options.map(({ value, label, icon }) => (
              <li
                key={value}
                className="fr-nav__item pb-0 border-b border-gray-200"
              >
                <button
                  className="fr-nav__link !flex !items-center !text-bf500 !py-2 !px-3 before:!hidden !shadow-none"
                  onClick={() => {
                    const doNotClose = onSelect(value, close);
                    if (!doNotClose) {
                      close();
                    }
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
      <ThreeDotButton
        dataTest={`${dataTest}Button`}
        className={buttonClassname}
      />
    </DropdownFloater>
  );
};

export default ThreeDotMenu;

const ThreeDotButton = forwardRef(
  (
    {
      isOpen,
      dataTest,
      className,
      ...props
    }: {
      isOpen?: boolean;
      dataTest?: string;
      className?: string;
    },
    ref?: Ref<HTMLButtonElement>
  ) => (
    <button
      aria-label="sous-menu"
      ref={ref}
      data-test={dataTest}
      className={classNames(
        'border border-solid border-gray-200 p-1 text-bf500 h-8 w-8',
        className
      )}
      {...props}
    >
      <IconThreeDotHorizontal className="w-5 h-5 fill-bf500" />
    </button>
  )
);
