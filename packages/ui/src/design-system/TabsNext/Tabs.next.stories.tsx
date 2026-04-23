import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StoryWrapper } from '../../storybook/story.wrapper';
import { Tabs } from './Tabs.next';

const meta: Meta<typeof Tabs> = {
  component: Tabs,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/tabs-next/tab-1',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const All: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-10">
      <StoryWrapper title="Default">
        <Tabs>
          <Tabs.List>
            <Tabs.Tab label="Onglet 1" href={'/tabs-next/tab-1'} isActive />
            <Tabs.Tab label="Onglet 2" href={'/tabs-next/tab-2'} />
            <Tabs.Tab label="Onglet 3" href={'/tabs-next/tab-3'} />
          </Tabs.List>
          <Tabs.Panel className="p-4 bg-white">Contenu (onglet 1)</Tabs.Panel>
        </Tabs>
      </StoryWrapper>

      <StoryWrapper title="Tailles" description="Aperçu en md / sm / xs.">
        <div className="flex flex-col gap-6 w-full">
          <Tabs size="md">
            <Tabs.List>
              <Tabs.Tab
                label="MD"
                href={'/tabs-next/md'}
                isActive
                icon="user-line"
              />
              <Tabs.Tab label="MD 2" href={'/tabs-next/md-2'} />
            </Tabs.List>
            <Tabs.Panel className="p-4 bg-white">MD</Tabs.Panel>
          </Tabs>

          <Tabs size="sm">
            <Tabs.List>
              <Tabs.Tab
                label="SM"
                href={'/tabs-next/sm'}
                isActive
                icon="user-line"
              />
              <Tabs.Tab label="SM 2" href={'/tabs-next/sm-2'} />
            </Tabs.List>
            <Tabs.Panel className="p-4 bg-white">SM</Tabs.Panel>
          </Tabs>

          <Tabs size="xs">
            <Tabs.List>
              <Tabs.Tab
                label="XS"
                href={'/tabs-next/xs'}
                isActive
                icon="user-line"
              />
              <Tabs.Tab label="XS 2" href={'/tabs-next/xs-2'} />
            </Tabs.List>
            <Tabs.Panel className="p-4 bg-white">XS</Tabs.Panel>
          </Tabs>
        </div>
      </StoryWrapper>

      <StoryWrapper
        title="Avec icônes, tooltip ou badge"
        description="Icône à gauche / à droite + tooltip et badge."
      >
        <Tabs>
          <Tabs.List>
            <Tabs.Tab
              label="Sécurisé"
              href={'/tabs-next/lock'}
              icon="lock-fill"
              isActive
            />
            <Tabs.Tab
              label="Profil"
              href={'/tabs-next/user'}
              icon="user-line"
              tooltip="Plus d'informations"
            />
            <Tabs.Tab
              label="Alertes"
              href={'/tabs-next/alert'}
              icon="alert-fill"
              iconClassName="text-warning-1"
              iconPosition="right"
              title="Titre (attribut HTML)"
            />
            <Tabs.Tab
              label="Badge"
              href={'/tabs-next/badge'}
              badge={{
                title: 'Nouveau',
                variant: 'info',
                type: 'solid',
              }}
            />
          </Tabs.List>
          <Tabs.Panel className="p-4 bg-white">Contenu (sécurisé)</Tabs.Panel>
        </Tabs>
      </StoryWrapper>

      <StoryWrapper
        title="Beaucoup d'onglets"
        description="Vérifie le wrapping et l’espacement."
      >
        <Tabs>
          <Tabs.List>
            <Tabs.Tab label="Onglet 1" href={'/tabs-next/1'} isActive />
            <Tabs.Tab label="Onglet 2" href={'/tabs-next/2'} />
            <Tabs.Tab label="Onglet 3" href={'/tabs-next/3'} />
            <Tabs.Tab label="Onglet 4" href={'/tabs-next/4'} />
            <Tabs.Tab label="Onglet 5" href={'/tabs-next/5'} />
            <Tabs.Tab label="Onglet 6" href={'/tabs-next/6'} />
            <Tabs.Tab
              label="Onglet 7"
              href={'/tabs-next/7'}
              tooltip="Tooltip"
            />
            <Tabs.Tab
              label="Onglet 8"
              href={'/tabs-next/8'}
              icon="chat-1-line"
            />
          </Tabs.List>
          <Tabs.Panel className="p-4 bg-white">Contenu (1)</Tabs.Panel>
        </Tabs>
      </StoryWrapper>
    </div>
  ),
};
