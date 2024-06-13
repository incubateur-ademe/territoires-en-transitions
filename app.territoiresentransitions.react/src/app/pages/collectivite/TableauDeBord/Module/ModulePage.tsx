import {useHistory, useParams} from 'react-router-dom';

import {Button, Icon} from '@tet/ui';

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
    <div
      data-test={`tdb-${slug}`}
      className="min-h-[44rem] flex flex-col gap-8"
    >
      {/** Header */}
      <div>
        <h2 className="mb-4">{title}</h2>
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="underlined"
            onClick={() =>
              history.push(
                makeTableauBordUrl({
                  collectiviteId: collectiviteId!,
                  view,
                })
              )
            }
          >
            Tableau de bord
          </Button>
          <Icon icon="arrow-right-s-line" className="mt-0.5 text-grey-7" />
          <span className="mt-0.5 text-grey-7">{title}</span>
        </div>
      </div>
      {/** Contenu principal */}
      {children}
    </div>
  );
};

export default ModulePage;
