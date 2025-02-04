import { TDBViewParam, makeTableauBordUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { Breadcrumbs } from '@/ui';
import { useRouter } from 'next/navigation';
import { useParams } from 'react-router-dom';

type Props = {
  title: string;
  view: TDBViewParam;
  /** Le contenu (cartes, boutons, ... ) à afficher dans le module.
   * Les contenus sont trop différents pour tous les traiter ici.
   * (voir ModuleFichesActionsPage pour un exemple) */
  children: React.ReactNode;
};

/** Composant générique de la page d'un module du tableau de bord plans d'action */
const ModulePage = ({ view, title, children }: Props) => {
  const collectiviteId = useCollectiviteId();
  const router = useRouter();

  const { tdbModule: defaultModuleKey } = useParams<{ tdbModule: string }>();

  return (
    <div
      data-test={`tdb-${defaultModuleKey}`}
      className="min-h-[44rem] flex flex-col gap-8"
    >
      {/** Header */}
      <div>
        <h2 className="mb-4">{title}</h2>
        <Breadcrumbs
          items={[
            {
              label: `Tableau de bord ${
                view === 'collectivite' ? 'Collectivité' : ''
              }`,
              onClick: () =>
                router.push(
                  makeTableauBordUrl({
                    collectiviteId: collectiviteId!,
                    view,
                  })
                ),
            },
            { label: title },
          ]}
        />
      </div>
      {/** Contenu principal */}
      {children}
    </div>
  );
};

export default ModulePage;
