import {Button} from '@design-system/Button';
import {ButtonProps} from '@design-system/Button/types';
import {Dispatch, ReactElement, SetStateAction} from 'react';

type HeaderBodyProps = {
  /** Titre du header */
  title: string;
  /** Sous-titre */
  subtitle?: string;
  /** Liste de logos à afficher à gauche du header. */
  logos?: React.ReactNode[];
  /** Url custom lors du clic sur le titre */
  customRootUrl?: string;
  /** Menu accès rapide */
  quickAccessButtons?: (props: ButtonProps) => ReactElement<typeof Button>[];
  /** Ouverture du menu en version mobile */
  setOpenedMenu: Dispatch<SetStateAction<boolean>>;
};

const HeaderBody = ({
  title,
  subtitle,
  logos,
  customRootUrl,
  quickAccessButtons,
  setOpenedMenu,
}: HeaderBodyProps) => {
  return (
    <div className="w-full xl:max-w-7xl 2xl:max-w-8xl mx-auto lg:py-3 lg:px-6 xl:px-2 flex items-center justify-between">
      {/* Contenu principal */}
      <a
        href={customRootUrl ?? '/'}
        className="block max-lg:w-full hover:!bg-primary-1 lg:rounded-lg bg-none"
        onClick={evt => evt.stopPropagation()}
      >
        <div className="max-lg:w-full max-lg:py-4 max-lg:flex-wrap flex gap-x-4">
          <div className="max-lg:py-2 max-lg:px-4 max-lg:w-full max-lg:border-b border-b-primary-4 flex justify-between">
            {/* Logos */}
            {!!logos && (
              <div className="flex h-24 gap-1">
                {logos.map((logo, idx) => (
                  <div key={idx} className="h-full">
                    {logo}
                  </div>
                ))}
              </div>
            )}

            {/* Bouton d'ouverture du menu en version mobile */}
            <Button
              icon="menu-fill"
              size="sm"
              variant="outlined"
              className="lg:hidden h-fit"
              onClick={evt => {
                evt.preventDefault();
                setOpenedMenu(true);
              }}
            />
          </div>

          {/* Titres */}
          <div className="max-lg:w-full max-lg:pt-3 max-lg:px-4 max-lg:mx-3 lg:p-4 flex flex-col justify-center">
            <p className="text-primary-8 font-bold text-xl lg:text-2xl max-lg:text-center mb-0">
              {title}
            </p>
            {!!subtitle && (
              <p className="text-grey-8 font-medium text-sm max-lg:text-center mb-0">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </a>

      {/* Menu accès rapide */}
      <ul className="max-lg:hidden list-none flex gap-2 divide-x divide-x-grey-4 mb-0">
        {quickAccessButtons?.({
          variant: 'white',
          size: 'sm',
          className: '!px-4',
        }).map((button, idx) => (
          <li key={idx} className="pl-2 first-of-type:pl-0 pb-0">
            {button}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HeaderBody;
