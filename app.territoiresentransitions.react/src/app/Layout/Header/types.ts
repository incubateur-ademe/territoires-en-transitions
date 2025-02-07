import { HeaderProps } from './Header';

export type TNavItem = {
  label: string;
  to: string;
  dataTest?: string;
  urlPrefix?: string[];
  /** Permet d'ouvrir le lien dans un nouvel onglet */
  openInNewTab?: boolean;
  /** indique que l'item n'est pas affiché quand la collectivité est confidentielle */
  confidentiel?: boolean;
  /** indique que l'item n'est pas affiché quand l'utilisateur est un visiteur */
  hideToVisitor?: boolean;
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
  hideToVisitor?: boolean;
};

export type TNavItemsList = (TNavItem | TNavDropdown)[];

export type HeaderPropsWithModalState = HeaderProps & {
  modalOpened: boolean;
  setModalOpened: (opened: boolean) => void;
  openedId: string | null;
  setOpenedId: (id: string | null) => void;
};
