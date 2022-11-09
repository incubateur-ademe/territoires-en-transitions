import {forwardRef, Ref} from 'react';
import classNames from 'classnames';

import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';

import {TActionDiscussionStatut} from './data/types';

/** Menu et options pour changer la vue du feed de discussion dans une action */
const ChangeVueDropdown = ({
  vue,
  changeVue,
}: {
  vue: TActionDiscussionStatut;
  changeVue: (vue: TActionDiscussionStatut) => void;
}) => {
  return (
    <>
      <DropdownFloater
        placement="bottom-start"
        render={({close}) => (
          <nav data-test="ActionDiscussionsChangeVueMenu">
            <ul className="m-0 p-0">
              {vue === 'ferme' && (
                <li className="fr-nav__item pb-0 border-b border-gray-200">
                  <button
                    className="fr-nav__link !py-2 before:!hidden !shadow-none"
                    onClick={() => {
                      changeVue('ouvert');
                      close();
                    }}
                  >
                    <span className="px-3">Ouverts</span>
                  </button>
                </li>
              )}
              {vue === 'ouvert' && (
                <li className="fr-nav__item pb-0 border-b border-gray-200">
                  <button
                    className="fr-nav__link !py-2 before:!hidden !shadow-none"
                    onClick={() => {
                      changeVue('ferme');
                      close();
                    }}
                  >
                    <span className="px-3">Fermés</span>
                  </button>
                </li>
              )}
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
      vue: TActionDiscussionStatut;
      isOpen?: boolean;
    },
    ref?: Ref<HTMLDivElement>
  ) => (
    <div ref={ref} className="ml-auto border border-gray-200" {...props}>
      <button
        data-test="ActionDiscussionsChangeVue"
        className="w-24 flex items-center justify-between py-0.5 pl-2 pr-1 text-sm capitalize hover:bg-gray-100"
      >
        {vue === 'ouvert' && 'Ouverts'}
        {vue === 'ferme' && 'Fermés'}{' '}
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
