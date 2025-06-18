import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { Tooltip } from '@/ui';
import classNames from 'classnames';
import Link from 'next/link';
import { BadgeNiveauAcces } from './BadgeNiveauAcces';
import { HeaderPropsWithModalState } from './types';

const ID = 'SelectCollectivite';

/**
 * Affiche le sélecteur de collectivité
 */
export const SelectCollectivite = (props: HeaderPropsWithModalState) => {
  const {
    currentCollectivite,
    user,
    openedId,
    modalOpened,
    setOpenedId,
    setModalOpened,
  } = props;
  if (!currentCollectivite || !user?.collectivites) {
    return null;
  }

  const opened = openedId === ID; // vérifie si le menu est ouvert

  // liste des collectivités à afficher
  const listCollectivites = user.collectivites?.filter(
    ({ nom }) => nom !== currentCollectivite.nom
  );

  return (
    <li className="fr-nav__item !relative" data-test={ID}>
      <Tooltip label={currentCollectivite.nom} withArrow={false}>
        <button
          data-test="nav-select-collectivite"
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
            acces={currentCollectivite.niveauAcces}
            isAuditeur={currentCollectivite.role === 'auditeur'}
            className="ml-4"
          />
        </button>
      </Tooltip>
      <div
        className={classNames('fr-menu px-0 right-4', {
          'fr-collapse': !opened,
        })}
        id={ID}
      >
        <ul className="fr-menu__list" onClickCapture={() => setOpenedId(null)}>
          {listCollectivites.map(
            ({ collectivite_id, nom, niveau_acces, est_auditeur }) => (
              <li className="fr-nav__item" key={collectivite_id}>
                <Link
                  href={makeTdbCollectiviteUrl({
                    collectiviteId: collectivite_id,
                    view: 'synthetique',
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
  );
};
