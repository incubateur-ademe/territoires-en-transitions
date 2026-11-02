'use client';
import { profilPath } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Badge, Breadcrumbs, Button, PageHeader } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@tet/ui/design-system/TabsNext/index';
import { ReactNode } from 'react';
import {
  AssistantConnectionSteps,
  SuperAdminModeState,
} from './assistant-connection.steps';
import { AssistantExamplesTable } from './assistant-examples.table';
import { ClaudeLogo, CrispLogo } from './assistant-logos';
import { useListMcpGrants } from './data/use-list-mcp-grants';
import {
  AssistantTab,
  useAssistantTabQueryState,
} from './use-assistant-tab-query-state';

const EXEMPLES_ANCHOR = 'exemples';
const LOGO_CLASSNAME = 'h-5 w-auto shrink-0';

/**
 * Logo Claude et diode d'état du connecteur : verte s'il est branché, grise
 * sinon, absente tant que l'état est inconnu (chargement, serveur OAuth
 * indisponible en local).
 */
const ClaudeTabIcon = ({
  className,
  isConnected,
}: {
  className: string;
  isConnected: boolean | null;
}) => (
  <span className="inline-flex items-center gap-1.5">
    <ClaudeLogo className={className} />
    {isConnected !== null && (
      <span
        role="img"
        aria-label={
          isConnected
            ? appLabels.assistantEtatConnecte
            : appLabels.assistantEtatNonConnecte
        }
        data-test="profil.assistant.etat-claude"
        className={cn(
          'h-2 w-2 shrink-0 rounded-full',
          isConnected ? 'bg-success-1' : 'bg-grey-5'
        )}
      />
    )}
  </span>
);

const Section = ({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <section
    id={id}
    className="flex scroll-mt-24 flex-col gap-6 rounded-xl border border-grey-3 bg-white p-8"
  >
    <div>
      <h2 className="mb-1 text-lg font-bold text-primary-9">{title}</h2>
      {description && <p className="m-0 text-sm text-grey-8">{description}</p>}
    </div>
    {children}
  </section>
);

const UsageCard = ({
  logo,
  title,
  badge,
  description,
  linkLabel,
  onSelect,
  dataTest,
}: {
  logo: ReactNode;
  title: string;
  badge: string;
  description: string;
  linkLabel: string;
  onSelect: () => void;
  dataTest: string;
}) => (
  <div className="flex flex-col gap-3 rounded-xl border border-grey-3 bg-white p-6">
    <div className="flex flex-wrap items-center gap-2">
      {logo}
      <h2 className="m-0 text-base font-bold text-primary-9">{title}</h2>
      <Badge size="xs" variant="grey" type="outlined" title={badge} />
    </div>
    <p className="m-0 flex-1 text-sm text-grey-8">{description}</p>
    <Button
      variant="underlined"
      size="sm"
      className="self-start"
      onClick={onSelect}
      dataTest={dataTest}
    >
      {linkLabel}
    </Button>
  </div>
);

const PresentationTab = ({
  onSelectTab,
}: {
  onSelectTab: (tab: AssistantTab) => void;
}) => (
  <div className="flex flex-col gap-6">
    <p className="m-0 max-w-3xl text-grey-8">{appLabels.assistantIntro}</p>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <UsageCard
        logo={<ClaudeLogo className={LOGO_CLASSNAME} />}
        title={appLabels.assistantUsageClaudeTitre}
        badge={appLabels.assistantUsageClaudeBadge}
        description={appLabels.assistantUsageClaudeDescription}
        linkLabel={appLabels.assistantUsageClaudeLien}
        onSelect={() => onSelectTab('claude')}
        dataTest="profil.assistant.vers-claude"
      />
      <UsageCard
        logo={<CrispLogo className={LOGO_CLASSNAME} />}
        title={appLabels.assistantUsageCrispTitre}
        badge={appLabels.assistantUsageCrispBadge}
        description={appLabels.assistantUsageCrispDescription}
        linkLabel={appLabels.assistantUsageCrispLien}
        onSelect={() => onSelectTab('crisp')}
        dataTest="profil.assistant.vers-crisp"
      />
    </div>

    <Section
      id={EXEMPLES_ANCHOR}
      title={appLabels.assistantExemplesTitre}
      description={appLabels.assistantExemplesDescription}
    >
      <AssistantExamplesTable />
    </Section>

    <Section title={appLabels.assistantASavoirTitre}>
      <dl className="m-0 grid grid-cols-1 gap-4 md:grid-cols-2">
        {appLabels.assistantASavoir.map(({ titre, description }) => (
          <div key={titre}>
            <dt className="text-sm font-bold text-primary-9">{titre}</dt>
            <dd className="m-0 text-sm text-grey-8">{description}</dd>
          </div>
        ))}
      </dl>
    </Section>

    <Section
      title={appLabels.assistantDroitsTitre}
      description={appLabels.assistantDroitsDescription}
    >
      <SuperAdminModeState />
    </Section>
  </div>
);

const ClaudeTab = () => (
  <div className="flex flex-col gap-6">
    <Section
      title={appLabels.assistantConnexionTitre}
      description={appLabels.assistantConnexionDescription}
    >
      <AssistantConnectionSteps />
    </Section>

    <Section
      title={appLabels.assistantModelesTitre}
      description={appLabels.assistantModelesDescription}
    >
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
        {appLabels.assistantModeles.map((modele) => (
          <li
            key={modele.titre}
            className="flex flex-col gap-1 rounded-lg border border-grey-3 px-4 py-3"
          >
            <span className="text-sm font-bold text-primary-9">
              {modele.titre}
            </span>
            <span className="text-sm text-grey-8">{modele.description}</span>
          </li>
        ))}
      </ul>
    </Section>
  </div>
);

const CrispTab = () => (
  <Section
    title={appLabels.assistantCrispTitre}
    description={appLabels.assistantCrispDescription}
  >
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm font-medium">
        {appLabels.assistantCrispNotePrivee}
      </p>
      <dl className="m-0 flex flex-col gap-2">
        {appLabels.assistantCrispCommandes.map(({ commande, description }) => (
          <div key={commande} className="flex flex-wrap gap-3">
            <dt>
              <code className="rounded bg-grey-2 px-2 py-0.5 text-sm text-primary-9">
                {commande}
              </code>
            </dt>
            <dd className="m-0 text-sm text-grey-8">{description}</dd>
          </div>
        ))}
      </dl>
      <p className="m-0 text-sm text-grey-8">
        {appLabels.assistantCrispReponse}
      </p>
    </div>
  </Section>
);

/** Page « Assistant TeT » : présentation, brancher Claude, /tet dans Crisp. */
export const AssistantView = () => {
  const [activeTab, setActiveTab] = useAssistantTabQueryState();
  const { data: grants } = useListMcpGrants();
  const isClaudeConnected = grants ? grants.length > 0 : null;

  return (
    <div className="flex flex-col gap-6" data-test="profil.assistant.page">
      <PageHeader>
        <PageHeader.Title>{appLabels.assistantTitre}</PageHeader.Title>
        <PageHeader.Subtitle>
          <Breadcrumbs
            size="sm"
            items={[
              { label: appLabels.preferences, href: profilPath },
              { label: appLabels.assistantTitre },
            ]}
          />
        </PageHeader.Subtitle>
        <PageHeader.Metadata>
          <PageHeader.MetadataRow>
            <Badge
              size="xs"
              variant="info"
              title={appLabels.assistantBadgeReserveSupport}
            />
            <Badge
              size="xs"
              variant="grey"
              type="outlined"
              title={appLabels.assistantBadgeLectureSeule}
            />
          </PageHeader.MetadataRow>
        </PageHeader.Metadata>
      </PageHeader>

      <Tabs dataTest="profil.assistant.onglets">
        <TabsList>
          <TabsTab
            id="assistant-tab-presentation"
            label={appLabels.assistantOngletPresentation}
            icon="information-line"
            isActive={activeTab === 'presentation'}
            onClick={() => setActiveTab('presentation')}
            dataTest="profil.assistant.onglet-presentation"
          />
          <TabsTab
            id="assistant-tab-claude"
            label={appLabels.assistantOngletClaude}
            icon={(className) => (
              <ClaudeTabIcon
                className={className}
                isConnected={isClaudeConnected}
              />
            )}
            isActive={activeTab === 'claude'}
            onClick={() => setActiveTab('claude')}
            dataTest="profil.assistant.onglet-claude"
          />
          <TabsTab
            id="assistant-tab-crisp"
            label={appLabels.assistantOngletCrisp}
            icon={(className) => <CrispLogo className={className} />}
            isActive={activeTab === 'crisp'}
            onClick={() => setActiveTab('crisp')}
            dataTest="profil.assistant.onglet-crisp"
          />
        </TabsList>

        <TabsPanel className="mt-6">
          {activeTab === 'claude' ? (
            <ClaudeTab />
          ) : activeTab === 'crisp' ? (
            <CrispTab />
          ) : (
            <PresentationTab onSelectTab={setActiveTab} />
          )}
        </TabsPanel>
      </Tabs>
    </div>
  );
};
