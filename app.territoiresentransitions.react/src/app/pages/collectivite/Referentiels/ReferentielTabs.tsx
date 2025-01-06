import { avancementToLabel, referentielToName } from '@/app/app/labels';
import {
  makeCollectiviteReferentielUrl,
  ReferentielParamOption,
  ReferentielVueParamOption,
} from '@/app/app/paths';
import { actionAvancementColors } from '@/app/app/theme';
import {
  useCollectiviteId,
  useReferentielId,
  useReferentielVue,
} from '@/app/core-logic/hooks/params';
import { ReferentielOfIndicateur } from '@/app/types/litterals';
import { Tab, Tabs } from '@/app/ui/shared/Tabs';
import { Button } from '@/ui';
import { useRouter } from 'next/navigation';
import ProgressBarWithTooltip from '../../../../ui/score/ProgressBarWithTooltip';
import AidePriorisation from '../AidePriorisation';
import DetailTacheTable from '../DetailTaches';
import ActionsReferentiels from './Referentiels';

const TABS_INDEX: Record<ReferentielVueParamOption, number> = {
  progression: 0,
  priorisation: 1,
  detail: 2,
};

/**
 * Affiche les onglets des vues tabulaires sur le référentiel
 */
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
    <main className="fr-container fr-mt-4w flex flex-col">
      <div className="flex justify-between max-sm:flex-col gap-y-4 mb-8">
        <h2 className="mb-0">
          Référentiel{' '}
          {referentielToName[referentielId as ReferentielOfIndicateur]}
        </h2>
        <Button icon="save-3-line" size="xs">
          Figer le référentiel
        </Button>
      </div>
      <div className="mb-8">
        <ProgressBarWithTooltip
          score={[
            {
              label: avancementToLabel.fait,
              value: 10,
              color: actionAvancementColors.fait,
            },
          ]}
          total={100}
          defaultScore={{
            label: avancementToLabel.non_renseigne,
            color: actionAvancementColors.non_renseigne,
          }}
          valueToDisplay={avancementToLabel.fait}
          styleOptions={{
            justify: 'start',
            fullWidth: true,
          }}
        />
      </div>

      <Tabs
        className="w-full"
        defaultActiveTab={activeTab}
        onChange={handleChange}
      >
        <Tab label="Actions">
          <ActionsReferentiels />
        </Tab>
        <Tab label="Aide à la priorisation">
          {activeTab === TABS_INDEX['priorisation'] ? (
            <AidePriorisation />
          ) : (
            '...'
          )}
        </Tab>
        <Tab label="Détail des statuts">
          {activeTab === TABS_INDEX['detail'] ? <DetailTacheTable /> : '...'}
        </Tab>
      </Tabs>
    </main>
  );
};

export default ReferentielTabs;
