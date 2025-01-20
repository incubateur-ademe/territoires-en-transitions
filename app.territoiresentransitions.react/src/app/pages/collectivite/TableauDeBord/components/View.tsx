import { TDBViewParam } from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { TrackPageView } from '@/ui';
import { pick } from 'es-toolkit';

type Props = {
  view: TDBViewParam;
  title: string;
  description: string;
  children: React.ReactNode;
};

/** Vue générique parent pour les pages tableau de bord de la collectivité et personnel */
const View = ({ view, title, description, children }: Props) => {
  const collectivite = useCurrentCollectivite()!;

  return (
    <div data-test={`tdb-${view}`}>
      <TrackPageView
        pageName={`app/tdb/${view}`}
        properties={pick(collectivite, [
          'collectiviteId',
          'niveauAcces',
          'role',
        ])}
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
