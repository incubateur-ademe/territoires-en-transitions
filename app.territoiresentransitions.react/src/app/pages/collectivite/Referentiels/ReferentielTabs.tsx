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
import { Referentiel, ReferentielOfIndicateur } from '@/app/types/litterals';
import { Tab, Tabs } from '@/ui';
import { useRouter } from 'next/navigation';
import { useReferentielDownToAction } from '../../../../core-logic/hooks/referentiel';
import ActionProgressBar from '../../../../ui/referentiels/ActionProgressBar';
import { Counter } from '../../../../ui/referentiels/Counter';
import AidePriorisation from '../AidePriorisation';
import DetailTacheTable from '../DetailTaches';
import ActionsReferentiels from './Referentiels';
import PageContainer from '@/ui/components/layout/page-container';

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

  return (
    <div className={className}>
      <h2 className="mb-4">
        Référentiel{' '}
        {referentielToName[referentielId as ReferentielOfIndicateur]}
      </h2>
      {/*****************************************/}
      {/*                                       */}
      {/*       For future use: start           */}
      {/*   (Figer une version du référentiel)  */}
      {/*                                       */}
      {/*****************************************/}

      {/* <div className="flex gap-x-4"> */}
      {/* <Select
                  options={[]}
                  onChange={() => {}}
                  values={[]}
                  customItem={(v) => <span className="text-grey-8">{v.label}</span>}
                  small
                />
                <Button
                  icon="save-3-line"
                  size="sm"
                  className="whitespace-nowrap min-w-fit"
                >
                  Figer le référentiel
                </Button> */}
      {/* </div> */}

      {/**********************************/}
      {/*                                */}
      {/*     For future use: end        */}
      {/*                                */}
      {/**********************************/}

      {referentiel && (
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-primary-3">
          <div className="grow">
            <ActionProgressBar
              action={referentiel}
              progressBarStyleOptions={{ fullWidth: true }}
            />
          </div>
          <Counter actionId={referentiel.id} className="ml-auto" />
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
            <ActionsReferentiels />
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
