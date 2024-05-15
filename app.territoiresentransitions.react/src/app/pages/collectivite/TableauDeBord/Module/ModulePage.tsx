import {useHistory, useParams} from 'react-router-dom';

import {Button} from '@tet/ui';

import {TDBViewParam, makeTableauBordUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';

type Props = {
  title: string;
  view: TDBViewParam;
  /** Le contenu (cartes, boutons, ... ) à afficher dans le module.
   * Les contenus sont trop différents pour tous les traiter ici.
   * (voir ModuleFichesActionsPage pour un exemple) */
  children: React.ReactNode;
};

/** Composant générique de la page d'un module du tableau de bord plans d'action */
const ModulePage = ({view, title, children}: Props) => {
  const collectiviteId = useCollectiviteId();
  const history = useHistory();

  const {tdbModule: slug}: {tdbModule: string} = useParams();

  /**
   * TODO:
   * - [ ] Implémenter les éléments communs aux différentes pages des modules
   */

  return (
    <div data-test={`tdb-${slug}`}>
      {/** Header */}
      <div className="border-b border-primary-3 pb-8 mb-12">
        <h2 className="mb-4">{title}</h2>
        <Button
          variant="underlined"
          className="mt-4"
          size="sm"
          onClick={() =>
            history.push(
              makeTableauBordUrl({
                collectiviteId: collectiviteId!,
                view,
              })
            )
          }
        >
          Revenir au tableau de bord
        </Button>
      </div>
      {/** Contenu principal */}
      {children}
    </div>
  );
};

export default ModulePage;
