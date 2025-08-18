import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { UserDetails } from '@/api/users/user-details.fetch.server';
import { ComponentType } from 'react';

export type TNavItem = {
  label?: string;
  to: string;
  dataTest?: string;
  icon?: string;
  urlPrefix?: string[];
  /** Permet d'ouvrir le lien dans un nouvel onglet */
  openInNewTab?: boolean;
  /** indique que l'item n'est pas affiché quand la collectivité est confidentielle */
  confidentiel?: boolean;
  /** indique que l'item n'est pas affiché quand l'utilisateur est un visiteur */
  hideFromVisitor?: boolean;
};

export type TNavDropdown = {
  title: string;
  dataTest?: string;
  items: TNavItem[];
  // optionnel : pour gérer l'état "actif' quand le sous-menu contient une vue avec des onglets
  urlPrefix?: string[];
  // indique que l'item n'est pas affiché quand la collectivité est confidentielle
  confidentiel?: boolean;
  // indique que l'item n'est pas affiché quand l'utilisateur est un visiteur
  hideFromVisitor?: boolean;
};

export type TNavItemsList = (TNavItem | TNavDropdown)[];

export type HeaderProps = {
  /** Titre du header */
  title: string;
  /** Sous-titre */
  subtitle?: string;
  /** Liste de logos à afficher à gauche du header. */
  logos?: React.ReactNode[];
  /** Url custom lors du clic sur le titre */
  customRootUrl?: string;
  // TODO: reorganize
  user?: UserDetails;
  currentCollectivite?: CurrentCollectivite;
  panierId?: string;
  AccesRapide?: ComponentType<HeaderPropsWithModalState>;
  MenuPrincipal?: ComponentType<HeaderPropsWithModalState>;
};

export type HeaderPropsWithModalState = HeaderProps & {
  modalOpened: boolean;
  setModalOpened: (opened: boolean) => void;
  openedId: string | null;
  setOpenedId: (id: string | null) => void;
};
