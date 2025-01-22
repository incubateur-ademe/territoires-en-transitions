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
import { Card, Tab, Tabs } from '@/ui';
import { useRouter } from 'next/navigation';
import { useReferentielDownToAction } from '../../../../core-logic/hooks/referentiel';
import ActionProgressBar from '../../../../ui/referentiels/ActionProgressBar';
import AidePriorisation from '../AidePriorisation';
import DetailTacheTable from '../DetailTaches';
import ActionsReferentiels from './ActionsReferentiels';

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
      <h2 className="mb-0">
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
        <ActionProgressBar
          action={referentiel}
          progressBarStyleOptions={{ fullWidth: true }}
          className="mb-4"
        />
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
    <div className="grow bg-grey-2 -mb-8 py-12 px-4 lg:px-6 2xl:px-0">
      <div className="m-auto xl:max-w-[90rem] 2xl:px-6">
        <ReferentielHeader
          referentielId={referentielId}
          className="flex flex-col justify-between max-sm:flex-col gap-y-4"
        />
        <Tabs
          defaultActiveTab={activeTab}
          onChange={handleChange}
          tabsListClassName="!justify-start pl-0 flex-nowrap overflow-x-scroll bg-transparent"
        >
          <Tab label="Actions">
            <Card>
              <ActionsReferentiels />
            </Card>
          </Tab>
          <Tab label="Aide à la priorisation" className="!text-primary-500">
            {activeTab === TABS_INDEX['priorisation'] ? (
              <Card>
                <AidePriorisation />
              </Card>
            ) : (
              '...'
            )}
          </Tab>
          <Tab label="Détail des statuts">
            {activeTab === TABS_INDEX['detail'] ? <DetailTacheTable /> : '...'}
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default ReferentielTabs;
