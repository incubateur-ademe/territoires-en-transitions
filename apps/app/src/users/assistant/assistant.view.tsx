'use client';
import { profilPath } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { OpenCrispChatLink } from '@/app/lib/open-crisp-chat.link';
import { Badge, Breadcrumbs, InlineLink, PageHeader } from '@tet/ui';
import { ReactNode } from 'react';
import { AssistantConnectionStatusPanel } from './assistant-connection-status.panel';
import {
  AssistantConnectionSteps,
  SuperAdminModeState,
} from './assistant-connection.steps';
import { AssistantExamplesTable } from './assistant-examples.table';

const CLAUDE_ANCHOR = 'claude';
const EXEMPLES_ANCHOR = 'exemples';
const CRISP_ANCHOR = 'crisp';

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
  title,
  badge,
  description,
  anchor,
  linkLabel,
}: {
  title: string;
  badge: string;
  description: string;
  anchor: string;
  linkLabel: string;
}) => (
  <div className="flex flex-col gap-3 rounded-xl border border-grey-3 bg-white p-6">
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="m-0 text-base font-bold text-primary-9">{title}</h2>
      <Badge size="xs" variant="grey" type="outlined" title={badge} />
    </div>
    <p className="m-0 flex-1 text-sm text-grey-8">{description}</p>
    <InlineLink href={`#${anchor}`} className="text-sm">
      {linkLabel}
    </InlineLink>
  </div>
);

const SideCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) => (
  <div className="flex flex-col gap-3 rounded-xl border border-grey-3 bg-white p-6">
    <div>
      <h2 className="mb-1 text-base font-bold text-primary-9">{title}</h2>
      <p className="m-0 text-sm text-grey-8">{description}</p>
    </div>
    {children}
  </div>
);

/** Page « Assistant TeT » : brancher Claude, se servir de /tet dans Crisp. */
export const AssistantView = () => (
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

    <p className="m-0 max-w-3xl text-grey-8">{appLabels.assistantIntro}</p>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UsageCard
            title={appLabels.assistantUsageClaudeTitre}
            badge={appLabels.assistantUsageClaudeBadge}
            description={appLabels.assistantUsageClaudeDescription}
            anchor={CLAUDE_ANCHOR}
            linkLabel={appLabels.assistantUsageClaudeLien}
          />
          <UsageCard
            title={appLabels.assistantUsageCrispTitre}
            badge={appLabels.assistantUsageCrispBadge}
            description={appLabels.assistantUsageCrispDescription}
            anchor={CRISP_ANCHOR}
            linkLabel={appLabels.assistantUsageCrispLien}
          />
        </div>

        <Section
          id={CLAUDE_ANCHOR}
          title={appLabels.assistantConnexionTitre}
          description={appLabels.assistantConnexionDescription}
        >
          <AssistantConnectionSteps />
        </Section>

        <Section
          id={EXEMPLES_ANCHOR}
          title={appLabels.assistantExemplesTitre}
          description={appLabels.assistantExemplesDescription}
        >
          <AssistantExamplesTable />
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
                <span className="text-sm text-grey-8">
                  {modele.description}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id={CRISP_ANCHOR}
          title={appLabels.assistantCrispTitre}
          description={appLabels.assistantCrispDescription}
        >
          <div className="flex flex-col gap-3">
            <p className="m-0 text-sm font-medium">
              {appLabels.assistantCrispNotePrivee}
            </p>
            <dl className="m-0 flex flex-col gap-2">
              {appLabels.assistantCrispCommandes.map(
                ({ commande, description }) => (
                  <div key={commande} className="flex flex-wrap gap-3">
                    <dt>
                      <code className="rounded bg-grey-2 px-2 py-0.5 text-sm text-primary-9">
                        {commande}
                      </code>
                    </dt>
                    <dd className="m-0 text-sm text-grey-8">{description}</dd>
                  </div>
                )
              )}
            </dl>
            <p className="m-0 text-sm text-grey-8">
              {appLabels.assistantCrispReponse}
            </p>
          </div>
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
      </div>

      <aside className="flex flex-col gap-6">
        <SideCard
          title={appLabels.assistantConnexionEtatTitre}
          description={appLabels.assistantConnexionEtatDescription}
        >
          <AssistantConnectionStatusPanel />
        </SideCard>
        <SideCard
          title={appLabels.assistantDroitsTitre}
          description={appLabels.assistantDroitsDescription}
        >
          <SuperAdminModeState />
        </SideCard>
        <SideCard
          title={appLabels.assistantSouciTitre}
          description={appLabels.assistantSouciDescription}
        >
          <OpenCrispChatLink dataTest="profil.assistant.signaler">
            {appLabels.assistantSouciLien}
          </OpenCrispChatLink>
        </SideCard>
      </aside>
    </div>
  </div>
);
