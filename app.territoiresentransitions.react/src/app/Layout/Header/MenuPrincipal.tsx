import {
  finaliserMonInscriptionUrl,
  recherchesCollectivitesUrl,
} from '@/app/app/paths';
import { useId } from '@floating-ui/react';
import classNames from 'classnames';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { makeNavItems, makeSecondaryNavItems } from './makeNavItems';
import { SelectCollectivite } from './SelectCollectivite';
import {
  HeaderPropsWithModalState,
  TNavDropdown,
  TNavItem,
  TNavItemsList,
} from './types';

/**
 * Affiche la nvaigation principale et le sélecteur de collectivité
 */
export const MenuPrincipal = (props: HeaderPropsWithModalState) => {
  const {
    currentCollectivite,
    ownedCollectivites,
    panierId,
    modalOpened,
    setOpenedId,
    auth,
  } = props;

  // enregistre un écouteur d'événements pour fermer un éventuel sous-menu ouvert
  // quand on clique en dehors
  useEffect(() => {
    const onClickOutside = (evt: globalThis.MouseEvent) => {
      // referme le menu ouvert quand on a cliqué en dehors d'un item de navigation
      const className = (evt.target as HTMLElement)?.className;
      if (typeof className === 'string' && !className.startsWith('fr-nav_'))
        setOpenedId(null);
    };
    document.body.addEventListener('mousedown', onClickOutside, {
      capture: true,
    });
    return () => document.body.removeEventListener('mousedown', onClickOutside);
  }, []);

  let items = [] as TNavItemsList;
  let secondaryItems = [] as TNavItemsList;
  if (currentCollectivite) {
    // récupère la liste des items à afficher dans le menu
    items = makeNavItems(currentCollectivite, auth.user, panierId);
    secondaryItems = makeSecondaryNavItems(currentCollectivite);
  }

  return (
    <nav
      className={classNames('fr-nav flex !justify-between', {
        'flex-col': modalOpened,
      })}
      role="navigation"
      aria-label="Menu principal"
    >
      <ul className="fr-nav__list">
        {items.map((item, i) =>
          Object.prototype.hasOwnProperty.call(item, 'to') ? (
            <NavItem key={i} item={item as TNavItem} {...props} />
          ) : (
            <NavDropdown key={i} item={item as TNavDropdown} {...props} />
          )
        )}
        {auth.isConnected && (
          <>
            {!ownedCollectivites?.length && (
              <NavItem
                item={{
                  label: 'Finaliser mon inscription',
                  to: finaliserMonInscriptionUrl,
                }}
                {...props}
              />
            )}
            <NavItem
              key="collectivites"
              item={{
                label: 'Collectivités',
                dataTest: 'nav-collectivites',
                to: recherchesCollectivitesUrl,
                urlPrefix: ['/recherches/'],
              }}
              {...props}
            />
          </>
        )}
      </ul>
      <ul className="fr-nav__list">
        {secondaryItems.map((item, i) =>
          Object.prototype.hasOwnProperty.call(item, 'to') ? (
            <NavItem key={i} item={item as TNavItem} {...props} />
          ) : (
            <NavDropdown key={i} item={item as TNavDropdown} {...props} />
          )
        )}
        {ownedCollectivites ? (
          <li>
            <SelectCollectivite {...props} />
          </li>
        ) : null}
      </ul>
    </nav>
  );
};

/** Affiche un item de menu */
const NavItem = (props: HeaderPropsWithModalState & { item: TNavItem }) => {
  const { item, setModalOpened, setOpenedId } = props;
  const { to, label, urlPrefix } = item;

  // vérifie si l'item correspond au début du chemin courant
  const pathname = usePathname();
  const current =
    pathname === to || pathIncludes(pathname, urlPrefix) ? 'page' : undefined;

  return (
    <li className="fr-nav__item">
      <Link
        data-test={item.dataTest}
        href={to}
        target={item.openInNewTab ? '_blank' : '_self'}
        rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
        className="fr-nav__link"
        aria-controls="modal-header__menu"
        aria-current={current}
        onClick={() => {
          setModalOpened(false);
          setOpenedId(null);
        }}
      >
        {label}
      </Link>
    </li>
  );
};

/** Affiche un menu déroulant contenant plusieurs items */
const NavDropdown = (
  props: HeaderPropsWithModalState & {
    item: TNavDropdown;
  }
) => {
  const { item, openedId, setOpenedId } = props;
  const { title, items, urlPrefix } = item;

  const id = useId(); // utilise le générateur d'id de floater
  const opened = openedId === id; // vérifie si le menu est ouvert

  // vérifie si le menu contient un item correspondant au chemin courant
  const pathname = usePathname();
  const current =
    pathIncludes(pathname, urlPrefix) ||
    items.findIndex(({ to }) => pathname.startsWith(to)) !== -1
      ? 'true'
      : undefined;

  return (
    <li className="fr-nav__item">
      <button
        data-test={item.dataTest}
        className="fr-nav__btn"
        aria-controls={id}
        aria-expanded={opened}
        aria-current={current}
        onClick={() => setOpenedId(opened ? null : id)}
      >
        {title}
      </button>
      <div
        className={classNames('fr-menu', { 'fr-collapse': !opened })}
        id={id}
      >
        <ul className="fr-menu__list" onClickCapture={() => setOpenedId(null)}>
          {items.map((item) => (
            <NavItem key={item.to} {...props} item={item} />
          ))}
        </ul>
      </div>
    </li>
  );
};

// nettoie le prefixe attendu (si il existe) pour éviter les segments vides
const cleanUrlPrefix = (urlPrefix?: string) => {
  if (!urlPrefix) return undefined;

  const prefix = urlPrefix
    .split('/')
    .filter((s) => s && s !== '?')
    .join('/');

  if (!prefix) return undefined;
  return `/${prefix}`;
};

// renvoi `true` si le chemin contient un des segments donnés
const pathIncludes = (pathname: string, urlPrefix?: string[]) => {
  return urlPrefix
    ?.map((prefix) => cleanUrlPrefix(prefix))
    .find((prefix) => prefix && pathname.includes(prefix));
};
