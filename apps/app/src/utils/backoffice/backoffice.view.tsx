'use client';

import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteContext } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { PageHeader, VisibleWhen } from '@tet/ui';
import { BackofficeTool, listAllowedBackofficeTools } from './backoffice-tools';
import { BackofficeToolsList } from './backoffice-tools.list';

export const BackofficeView = () => {
  const { collectivite } = useCollectiviteContext();
  const tools = listAllowedBackofficeTools(useUser(), collectivite);
  const outilsPlateforme = tools.filter((tool) => tool.scope === 'plateforme');
  const outilsCollectivite = tools.filter(
    (tool) => tool.scope === 'collectivite'
  );
  // Une seule section de plateforme : son titre n'apprendrait rien (cas du
  // programme TETE).
  const showPlateformeTitle =
    outilsPlateforme.length > 0 && outilsCollectivite.length > 0;

  return (
    <div data-test="backoffice.view" className="flex flex-col gap-8">
      <PageHeader>
        <PageHeader.Title>{appLabels.administration}</PageHeader.Title>
        <PageHeader.Subtitle>
          <p className="mb-0 text-sm leading-[22px] text-grey-8">
            {appLabels.administrationSousTitre}
          </p>
        </PageHeader.Subtitle>
      </PageHeader>
      <VisibleWhen condition={outilsPlateforme.length > 0}>
        <BackofficeToolsSection
          title={
            showPlateformeTitle
              ? appLabels.administrationOutilsPlateforme
              : null
          }
          tools={outilsPlateforme}
        />
      </VisibleWhen>
      <VisibleWhen condition={!!collectivite && outilsCollectivite.length > 0}>
        <BackofficeToolsSection
          // Toujours nommée : hors de /collectivite/[id], la collectivité vient
          // du contexte, qu'un rechargement remet sur celle par défaut.
          title={appLabels.administrationOutilsCollectivite(
            collectivite?.nom ?? ''
          )}
          tools={outilsCollectivite}
        />
      </VisibleWhen>
    </div>
  );
};

const BackofficeToolsSection = ({
  title,
  tools,
}: {
  title: string | null;
  tools: BackofficeTool[];
}) => (
  <section className="flex flex-col gap-3">
    {title && <h2 className="mb-0 text-lg">{title}</h2>}
    <BackofficeToolsList tools={tools} />
  </section>
);
