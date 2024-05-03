import {useHistory} from 'react-router-dom';

import {Button, ButtonGroup} from '@tet/ui';
import {TDBViewParam, makeTableauBordUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';

type Props = {
  view: TDBViewParam;
  title: string;
  description: string;
  settingButton: React.ReactNode;
  children: React.ReactNode;
};

/** Vue générique parent pour les pages tableau de bord de la collectivité et personnel */
const View = ({view, title, description, settingButton, children}: Props) => {
  const collectiviteId = useCollectiviteId();
  const history = useHistory();

  return (
    <div data-test={`tdb-${view}`}>
      {/** Header */}
      <div className="flex items-start gap-20 border-b pb-6 mb-12">
        <div className="flex-grow">
          <h2 className="mb-4">{title}</h2>
          <div className="text-lg text-grey-8">{description}</div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-4 mt-1">
          <ButtonGroup
            activeButtonId={view}
            size="xs"
            buttons={[
              {
                id: 'collectivite',
                onClick: () =>
                  history.push(
                    makeTableauBordUrl({
                      collectiviteId: collectiviteId!,
                      view: 'collectivite',
                    })
                  ),
                children: 'La collectivité',
              },
              {
                id: 'personnel',
                onClick: () =>
                  history.push(
                    makeTableauBordUrl({
                      collectiviteId: collectiviteId!,
                      view: 'personnel',
                    })
                  ),
                children: 'Mon tableau de bord',
              },
            ]}
          />
          <Button variant="outlined" icon="settings-2-line" size="xs" />
          {settingButton}
        </div>
      </div>
      {/** Contenu principal */}
      {children}
    </div>
  );
};

export default View;
