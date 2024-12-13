import { TDBViewParam } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { TrackPageView } from '@/ui';

type Props = {
  view: TDBViewParam;
  title: string;
  description: string;
  children: React.ReactNode;
};

/** Vue générique parent pour les pages tableau de bord de la collectivité et personnel */
const View = ({ view, title, description, children }: Props) => {
  const collectivite_id = useCollectiviteId()!;

  return (
    <div data-test={`tdb-${view}`}>
      <TrackPageView
        pageName={`app/tdb/${view}`}
        properties={{ collectivite_id }}
      />
      {/** Header */}
      <h2 className="mb-4">{title}</h2>
      <p className="mb-12 text-lg text-grey-8">{description}</p>
      {/** Contenu principal */}
      <div className="grid grid-cols-12 gap-10">{children}</div>
    </div>
  );
};

export default View;
