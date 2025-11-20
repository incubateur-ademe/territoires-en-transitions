import { Breadcrumbs } from '@tet/ui';

export type ModuleParentPage = {
  label: string;
  link: string;
};

type Props = {
  title: string;
  /** Titre et lien de la page parente à afficher dans le fil d'ariane */
  parentPage: ModuleParentPage;
  children: React.ReactNode;
  dataTest?: string;
};

/**
 * Composant générique pour la page d'un module tableau de bord.
 * Principalement utilisé pour avoir un header unifié.
 */
export const ModulePage = ({
  title,
  parentPage,
  children,
  dataTest,
}: Props) => {
  return (
    <div data-test={dataTest} className="min-h-[44rem] flex flex-col gap-8">
      {/** Header */}
      <div>
        <h2 className="mb-4">{title}</h2>
        <Breadcrumbs
          items={[
            {
              label: parentPage.label,
              href: parentPage.link,
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
