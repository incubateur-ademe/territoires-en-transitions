import { Header } from './Header';

export default {
  component: Header,
};

const connectedUser = {
  id: '1',
  nom: 'Dodo',
  prenom: 'Yolo',
};

const currentCollectivite = {
  collectiviteId: 1,
  nom: 'Collectivité test',
  niveauAcces: 'admin',
  isAdmin: true,
  readonly: false,
  accesRestreint: false,
  isRoleAuditeur: false,
  role: null,
  isReadOnly: false,
};

const ownedCollectivites = [
  {
    collectivite_id: 2,
    nom: 'Collectivité test 2',
    niveau_acces: 'edition',
    isAdmin: false,
    readonly: false,
  },
  {
    collectivite_id: 3,
    nom: 'Collectivité test 3',
    niveau_acces: 'lecture',
    isAdmin: false,
    readonly: true,
  },
];

export const NotConnected = () => (
  <Header user={null} currentCollectivite={null} panierId={undefined} />
);

export const Connected = () => (
  <Header
    user={connectedUser}
    currentCollectivite={currentCollectivite}
    panierId={undefined}
  />
);

export const ConnectedVisite = () => (
  <Header
    user={connectedUser}
    currentCollectivite={{ ...currentCollectivite, niveauAcces: null }}
    panierId={undefined}
  />
);

export const ConnectedVisiteSupport = () => (
  <Header
    user={{
      ...connectedUser,
      isSupport: true,
    }}
    currentCollectivite={{ ...currentCollectivite, niveauAcces: null }}
    panierId={undefined}
  />
);
