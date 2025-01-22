import { referentielToName } from '@/app/app/labels';
import {
  makeCollectiviteReferentielUrl,
  ReferentielParamOption,
  ReferentielVueParamOption,
} from '@/app/app/paths';
import {
  useCollectiviteId,
  useReferentielId,
  useReferentielVue,
} from '@/app/core-logic/hooks/params';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import {
  Referentiel,
  ReferentielOfIndicateur,
} from '@/app/referentiels/litterals';
import { Tab, Tabs } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { useRouter } from 'next/navigation';
import AidePriorisation from '../app/pages/collectivite/AidePriorisation';
import DetailTacheTable from '../app/pages/collectivite/DetailTaches';
import ActionProgressBar from './actions/action.progress-bar';
import { useReferentielDownToAction } from './referentiel-hooks';
import { AxesOverviewTree } from './referentiel-overview.tree';
import { ScoreRatioBadge } from './scores/score.ratio-badge';

const TABS_INDEX: Record<ReferentielVueParamOption, number> = {
  progression: 0,
  priorisation: 1,
  detail: 2,
};

const ReferentielHeader = ({
  referentielId,
  className,
}: {
  referentielId: ReferentielParamOption;
  className?: string;
}) => {
  const current = referentielId ?? 'eci';
  const actions = useReferentielDownToAction(current as Referentiel);
  const referentiel = actions.find((a) => a.type === 'referentiel')!;
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectiviteId;
  const haveEditionAccess =
    collectivite?.niveauAcces == 'edition' ||
    collectivite?.niveauAcces == 'admin';

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="mb-4">
          Référentiel{' '}
          {referentielToName[referentielId as ReferentielOfIndicateur]}
        </h2>
        <div className="flex gap-x-4">
          {/**********************************************/}
          {/*                                            */}
          {/*       For future use: start                */}
          {/*   (Récupérer une version du référentiel)   */}
          {/*                                            */}
          {/**********************************************/}
          {/*<Select
                  options={[]}
                  onChange={() => {}}
                  values={[]}
                  customItem={(v) => <span className="text-grey-8">{v.label}</span>}
                  small
                />*/}
          {/**********************************************/}
          {/*                                            */}
          {/*     For future use: end                    */}
          {/*                                            */}
          {/**********************************************/}
          {collectiviteId && haveEditionAccess && (
            <SaveScoreButton
              referentielId={current}
              collectiviteId={collectiviteId}
            />
          )}
        </div>
      </div>

      {referentiel && (
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-primary-3">
          <div className="grow">
            <ActionProgressBar
              actionDefinition={referentiel}
              progressBarStyleOptions={{ fullWidth: true }}
            />
          </div>
          <ScoreRatioBadge actionId={referentiel.id} className="ml-auto" />
        </div>
      )}
    </div>
  );
};

const ReferentielTabs = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId() as ReferentielParamOption;
  const referentielVue = useReferentielVue();
  const router = useRouter();

  if (!referentielId || !referentielVue) {
    return null;
  }

  const activeTab = TABS_INDEX[referentielVue];

  // synchronise l'url lors du passage d'un onglet à l'autre
  const handleChange = (activeTab: number) => {
    if (collectiviteId && referentielId) {
      // recherche le nom de la vue correspondant à l'onglet courant
      const view = Object.entries(TABS_INDEX).find(
        ([, index]) => index === activeTab
      );
      const name = view?.[0] as ReferentielVueParamOption;

      // met à jour l'url
      if (name && name !== referentielVue) {
        router.replace(
          makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId,
            referentielVue: name,
          })
        );
      }
    }
  };

  return (
    <PageContainer>
      <ReferentielHeader referentielId={referentielId} />
      <Tabs
        defaultActiveTab={activeTab}
        onChange={handleChange}
        tabsListClassName="!justify-start pl-0 flex-nowrap bg-transparent"
      >
        <Tab label="Actions">
          <div className="p-8 border border-primary-2 bg-white rounded-lg">
            <AxesOverviewTree />
          </div>
        </Tab>
        <Tab label="Aide à la priorisation" className="!text-primary-500">
          {activeTab === TABS_INDEX['priorisation'] ? (
            <div className="p-7 border border-primary-2 bg-white rounded-lg">
              <AidePriorisation />
            </div>
          ) : (
            '...'
          )}
        </Tab>
        <Tab label="Détail des statuts">
          {activeTab === TABS_INDEX['detail'] ? (
            <div className="p-7 border border-primary-2 bg-white rounded-lg">
              <DetailTacheTable />
            </div>
          ) : (
            '...'
          )}
        </Tab>
      </Tabs>
    </PageContainer>
  );
};

export default ReferentielTabs;
