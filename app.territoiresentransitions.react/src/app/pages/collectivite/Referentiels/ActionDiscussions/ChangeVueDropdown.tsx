import {forwardRef, Ref} from 'react';
import classNames from 'classnames';

import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';

import {TVue} from './ActionDiscussions';

const ChangeVueDropdown = ({
  vue,
  changeVue,
}: {
  vue: TVue;
  changeVue: (vue: TVue) => void;
}) => {
  return (
    <>
      <DropdownFloater
        placement="bottom-start"
        render={({close}) => (
          <nav>
            <ul className="m-0 p-0">
              <li className="fr-nav__item pb-0 border-b border-gray-200">
                <button
                  className="fr-nav__link !py-2 before:!hidden !shadow-none"
                  onClick={() => {
                    changeVue('ouverts');
                    close();
                  }}
                >
                  <span className="px-3">Ouverts</span>
                </button>
              </li>
              <li className="fr-nav__item pb-0 border-b border-gray-200">
                <button
                  className="fr-nav__link !py-2 before:!hidden !shadow-none"
                  onClick={() => {
                    changeVue('fermer');
                    close();
                  }}
                >
                  <span className="px-3">Fermer</span>
                </button>
              </li>
            </ul>
          </nav>
        )}
      >
        <ChangeVueDropdownButtonDisplayed vue={vue} />
      </DropdownFloater>
    </>
  );
};

export default ChangeVueDropdown;

const ChangeVueDropdownButtonDisplayed = forwardRef(
  (
    {
      vue,
      isOpen,
      ...props
    }: {
      vue: TVue;
      isOpen?: boolean;
    },
    ref?: Ref<HTMLDivElement>
  ) => (
    <div ref={ref} className="ml-auto border border-gray-200" {...props}>
      <button className="flex items-center py-0.5 pl-2 pr-1 text-sm capitalize hover:bg-gray-100">
        {vue}{' '}
        <div
          className={classNames(
            'fr-fi-arrow-down-s-line mt-0.5 ml-1 scale-90',
            {
              'rotate-180': isOpen,
            }
          )}
        />
      </button>
    </div>
  )
);
