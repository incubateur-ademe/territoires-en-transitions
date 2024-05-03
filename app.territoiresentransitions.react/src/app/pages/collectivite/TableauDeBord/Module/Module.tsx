import {useHistory} from 'react-router-dom';

import {Button} from '@tet/ui';
import {TDBViewParam, makeTableauBordModuleUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TDBModuleTypes} from './data';

type Props = TDBModuleTypes & {
  view: TDBViewParam;
};

/** Composant générique d'un module du tableau de bord plans d'action */
const Module = ({title, slug, view}: Props) => {
  const collectiviteId = useCollectiviteId();
  const history = useHistory();

  return (
    <div className="p-8 bg-primary-0 border border-primary-4 rounded-xl">
      <h6>{title}</h6>
      <Button
        variant="outlined"
        className="mt-4"
        size="sm"
        onClick={() =>
          history.push(
            makeTableauBordModuleUrl({
              collectiviteId: collectiviteId!,
              view,
              module: slug,
            })
          )
        }
      >
        Ouvrir la page du module
      </Button>
    </div>
  );
};

export default Module;
