import {forwardRef, Ref, useMemo} from 'react';
import {Link} from 'react-router-dom';
import classNames from 'classnames';

import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {MesCollectivitesRead, NiveauAcces} from 'generated/dataLayer';
import {makeCollectiviteTableauBordUrl} from 'app/paths';
import CollectiviteAccesChip from './CollectiviteAccesChip';

type Props = {
  currentCollectivite: CurrentCollectivite;
  mesCollectivites: MesCollectivitesRead[];
};

const CollectiviteSwitchDropdown = ({
  currentCollectivite,
  mesCollectivites,
}: Props) => {
  const collectiviteList = useMemo(() => {
    const collectivitesWithoutCurrentCollectivite = mesCollectivites?.filter(
      e => currentCollectivite && e.nom !== currentCollectivite.nom
    );

    const list = collectivitesWithoutCurrentCollectivite.map(collectivite => {
      return {
        label: collectivite.nom,
        path: makeCollectiviteTableauBordUrl({
          collectiviteId: collectivite.collectivite_id,
        }),
        niveauAcces: collectivite.niveau_acces,
      };
    });

    return list;
  }, [currentCollectivite, mesCollectivites]);

  return (
    <>
      {collectiviteList.length === 0 ? (
        <div className="flex items-center max-w-sm ml-auto p-4 text-sm font-bold">
          <span className="line-clamp-1">{currentCollectivite.nom}</span>
          <CollectiviteAccesChip
            acces={currentCollectivite.niveau_acces}
            className="ml-4"
          />
        </div>
      ) : (
        <DropdownFloater
          placement="bottom-end"
          render={({close}) => (
            <nav className="border border-gray-300">
              <p className="mb-0 px-3 py-2 italic text-sm text-gray-600">
                {collectiviteList.length > 1
                  ? 'Mes collectivités'
                  : 'Ma collectivité'}
              </p>
              <ul className="m-0 p-0">
                {collectiviteList.map(collectivite => (
                  <li className="fr-nav__item p-0" key={collectivite.label}>
                    <Link
                      className="fr-nav__link !flex items-center !py-2 !px-3 !shadow-none"
                      to={collectivite.path}
                      onClick={close}
                    >
                      <span className="block max-w-xs mr-auto">
                        {collectivite.label}
                      </span>
                      <CollectiviteAccesChip
                        acces={collectivite.niveauAcces}
                        className="ml-4"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        >
          <CollectiviteSwitchDropdownDisplay
            menuLabel={currentCollectivite.nom}
            acces={currentCollectivite.niveau_acces}
          />
        </DropdownFloater>
      )}
    </>
  );
};

export default CollectiviteSwitchDropdown;

const CollectiviteSwitchDropdownDisplay = forwardRef(
  (
    {
      acces,
      menuLabel,
      isOpen,
      ...props
    }: {
      acces: NiveauAcces | null;
      menuLabel: string;
      isOpen?: boolean;
    },
    ref?: Ref<HTMLDivElement>
  ) => (
    <div ref={ref} className="flex ml-auto pl-2 w-full max-w-sm" {...props}>
      <div className="w-full mt-auto mb-2 border border-gray-300">
        <button className="flex items-center w-full py-2 pl-4 pr-3 font-bold">
          <span className="mr-auto line-clamp-1">{menuLabel}</span>
          <CollectiviteAccesChip acces={acces} className="ml-4" />
          <div
            className={classNames('ml-2 fr-fi-arrow-down-s-line scale-75', {
              ['rotate-180']: isOpen,
            })}
          />
        </button>
      </div>
    </div>
  )
);
