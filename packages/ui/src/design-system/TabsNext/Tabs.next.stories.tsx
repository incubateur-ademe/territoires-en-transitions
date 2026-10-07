import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { StoryWrapper } from '../../storybook/story.wrapper';
import { ButtonMenu } from '../Button/button-menu';
import { TabSize } from '../Tabs/Tabs';
import { Tabs, TabVariant } from './Tabs.next';

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
            <Tabs.Panel>MD</Tabs.Panel>
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
            <Tabs.Panel>SM</Tabs.Panel>
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
            <Tabs.Panel>XS</Tabs.Panel>
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
          <Tabs.Panel>Contenu (sécurisé)</Tabs.Panel>
        </Tabs>
      </StoryWrapper>

      <StoryWrapper
        title="Variante carte"
        description="Icône au-dessus du libellé, badge en dessous. La largeur des cartes suit la taille : md / sm / xs."
      >
        <div className="flex flex-col gap-8 w-full">
          {cardSizes.map((size) => (
            <div key={size} className="flex flex-col gap-2">
              <p className="mb-0 text-sm font-medium text-grey-8 uppercase">
                {size}
              </p>
              <CardTabsPreview size={size} />
            </div>
          ))}
        </div>
      </StoryWrapper>

      <StoryWrapper
        title="Variante carte pilotée par un bouton"
        description="Sans `href`, l'onglet est un bouton : utile quand le volet actif vient d'un paramètre de requête plutôt que du chemin."
      >
        <CardTabsWithState />
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

export const WithActions: Story = {
  name: 'Avec actions',
  args: { size: 'md', variant: 'pill' },
  argTypes: {
    size: { control: 'inline-radio', options: ['md', 'sm', 'xs'] },
    variant: { control: 'inline-radio', options: ['pill', 'card'] },
  },
  render: ({ size, variant }) => (
    <StoryWrapper
      title="Onglets avec actions"
      description="Comparez les onglets avec et sans actions. Le menu reste accessible sur les onglets actifs et inactifs, sans changer l'onglet sélectionné."
    >
      <TabsWithActions size={size} variant={variant} />
    </StoryWrapper>
  ),
};

const onRenameTab = fn();
const onDeleteTab = fn();

const TabsWithActions = ({
  size,
  variant,
}: {
  size?: TabSize;
  variant?: TabVariant;
}) => {
  const [activeTab, setActiveTab] = useState('Avec actions 1');

  return (
    <Tabs size={size} variant={variant}>
      <Tabs.List>
        {['Sans actions', 'Avec actions 1', 'Avec actions 2'].map((label) => (
          <Tabs.Tab
            key={label}
            label={label}
            isActive={activeTab === label}
            onClick={() => setActiveTab(label)}
            actions={
              label !== 'Sans actions' ? (
                <ButtonMenu
                  size="xs"
                  variant="white"
                  icon="more-2-fill"
                  title={`Actions de l'onglet ${label}`}
                  className="border-0 rounded !p-1 bg-transparent"
                  menu={{
                    placement: 'bottom-start',
                    actions: [
                      {
                        label: 'Renommer',
                        icon: 'edit-line',
                        onClick: () => onRenameTab(label),
                      },
                      {
                        label: 'Supprimer',
                        icon: 'delete-bin-line',
                        variant: 'destructive',
                        onClick: () => onDeleteTab(label),
                      },
                    ],
                  }}
                />
              ) : undefined
            }
          />
        ))}
      </Tabs.List>
      <Tabs.Panel className="p-4 mt-4 bg-white">
        Contenu ({activeTab})
      </Tabs.Panel>
    </Tabs>
  );
};

const cardSizes: TabSize[] = ['md', 'sm', 'xs'];

const CardTabsPreview = ({ size }: { size: TabSize }) => (
  <Tabs variant="card" size={size}>
    <Tabs.List>
      <Tabs.Tab
        label="Emissions GES"
        href={'/tabs-next/ges'}
        icon="fire-line"
        isActive
        badge={{
          title: 'A compléter',
          variant: 'warning',
          type: 'solid',
          uppercase: false,
        }}
      />
      <Tabs.Tab
        label="Polluants atmosphériques"
        href={'/tabs-next/polluants'}
        icon="windy-line"
        badge={{
          title: 'A compléter',
          variant: 'warning',
          type: 'solid',
          uppercase: false,
        }}
      />
      <Tabs.Tab
        label="Séquestration carbone"
        href={'/tabs-next/sequestration'}
        icon="seedling-line"
        badge={{
          title: 'Optionnel',
          variant: 'default',
          type: 'solid',
          uppercase: false,
        }}
      />
      <Tabs.Tab
        label="Vulnérabilité du territoire"
        href={'/tabs-next/vulnerabilite'}
        icon="map-2-line"
        badge={{
          title: 'Complète',
          variant: 'success',
          type: 'solid',
          uppercase: false,
        }}
      />
    </Tabs.List>
    <Tabs.Panel className="p-4 mt-4 bg-white">
      Contenu (émissions GES)
    </Tabs.Panel>
  </Tabs>
);

const topics = [
  { code: 'ges', label: 'Emissions GES', icon: 'fire-line' },
  { code: 'polluants', label: 'Polluants atmosphériques', icon: 'windy-line' },
  {
    code: 'sequestration',
    label: 'Séquestration carbone',
    icon: 'seedling-line',
  },
  { code: 'enr', label: 'Energies renouvelables', icon: 'sun-line' },
  {
    code: 'reseaux',
    label: 'Réseaux de distribution',
    icon: 'flashlight-line',
  },
  {
    code: 'vulnerabilite',
    label: 'Vulnérabilité du territoire',
    icon: 'map-2-line',
  },
];

const CardTabsWithState = () => {
  const [activeCode, setActiveCode] = useState('ges');

  return (
    <Tabs variant="card">
      <Tabs.List>
        {topics.map((topic) => (
          <Tabs.Tab
            key={topic.code}
            label={topic.label}
            icon={topic.icon}
            isActive={activeCode === topic.code}
            onClick={() => setActiveCode(topic.code)}
            badge={{ title: 'A compléter', variant: 'warning', type: 'solid' }}
          />
        ))}
      </Tabs.List>
      <Tabs.Panel className="p-4">Contenu ({activeCode})</Tabs.Panel>
    </Tabs>
  );
};
