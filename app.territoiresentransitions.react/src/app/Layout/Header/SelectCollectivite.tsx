import classNames from 'classnames';
import { makeCollectiviteAccueilUrl } from 'app/paths';
import { BadgeNiveauAcces } from './BadgeNiveauAcces';
import { HeaderPropsWithModalState } from './types';
import { Tooltip } from '@tet/ui';
import Link from 'next/link';

const ID = 'SelectCollectivite';

/**
 * Affiche le sélecteur de collectivité
 */
export const SelectCollectivite = (props: HeaderPropsWithModalState) => {
  const {
    currentCollectivite,
    ownedCollectivites,
    openedId,
    modalOpened,
    setOpenedId,
    setModalOpened,
  } = props;
  if (!currentCollectivite || !ownedCollectivites) {
    return null;
  }

  const opened = openedId === ID; // vérifie si le menu est ouvert

  // liste des collectivités à afficher
  const listCollectivites = ownedCollectivites?.filter(
    ({ nom }) => nom !== currentCollectivite.nom
  );

  return (
    <ul className="fr-nav__list" data-test={ID}>
      <li className="fr-nav__item !relative">
        <Tooltip label={currentCollectivite.nom} withArrow={false}>
          <button
            className={classNames(
              {
                'fr-nav__btn': listCollectivites.length,
                'fr-nav__link': !listCollectivites.length,
              },
              'min-w-[15rem] flex items-center'
            )}
            aria-controls={ID}
            aria-expanded={opened}
            onClick={() =>
              listCollectivites.length && setOpenedId(opened ? null : ID)
            }
          >
            <b
              className={classNames(
                'mr-auto pointer-events-none whitespace-nowrap text-ellipsis overflow-hidden',
                { 'md:max-w-[25vw] lg:max-w-[28vw]': !modalOpened }
              )}
            >
              {currentCollectivite.nom}
            </b>
            <BadgeNiveauAcces
              acces={currentCollectivite.niveau_acces}
              isAuditeur={currentCollectivite.est_auditeur}
              className="ml-4"
            />
          </button>
        </Tooltip>
        <div
          className={classNames('fr-menu right-0', {
            'fr-collapse': !opened,
          })}
          id={ID}
        >
          <ul
            className="fr-menu__list"
            onClickCapture={() => setOpenedId(null)}
          >
            {listCollectivites.map(
              ({ collectivite_id, nom, niveau_acces, est_auditeur }) => (
                <li className="fr-nav__item" key={collectivite_id}>
                  <Link
                    href={makeCollectiviteAccueilUrl({
                      collectiviteId: collectivite_id!,
                    })}
                    target="_self"
                    className="fr-nav__link"
                    aria-controls="modal-header__menu"
                    onClick={() => setModalOpened(false)}
                  >
                    {nom}
                    <BadgeNiveauAcces
                      acces={niveau_acces}
                      isAuditeur={est_auditeur || false}
                      className="float-right"
                    />
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>
      </li>
    </ul>
  );
};
