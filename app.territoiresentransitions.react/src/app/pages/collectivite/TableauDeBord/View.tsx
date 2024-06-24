import {TDBViewParam} from 'app/paths';

type Props = {
  view: TDBViewParam;
  title: string;
  description: string;
  children: React.ReactNode;
};

/** Vue générique parent pour les pages tableau de bord de la collectivité et personnel */
const View = ({view, title, description, children}: Props) => {
  return (
    <div data-test={`tdb-${view}`}>
      {/** Header */}
      <div className="flex items-start gap-20 border-b pb-6 mb-12">
        <div className="flex-grow">
          <h2 className="mb-4">{title}</h2>
          <div className="text-lg text-grey-8">{description}</div>
        </div>
        {/* En attendant le dévelopement de la vue collectivité */}
        {/* <div className="flex-shrink-0 flex items-center gap-4 mt-1">
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
        </div> */}
      </div>
      {/** Contenu principal */}
      {children}
    </div>
  );
};

export default View;
