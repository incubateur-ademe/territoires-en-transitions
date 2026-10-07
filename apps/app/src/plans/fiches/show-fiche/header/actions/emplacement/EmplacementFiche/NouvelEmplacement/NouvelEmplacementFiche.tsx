import { appLabels } from '@/app/labels/catalog';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { toRootAxeNode } from '@/app/plans/plans/show-plan/actions/axe-node.adapter';
import { AxeNode } from '@/app/plans/plans/types';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { Alert, Button } from '@tet/ui';
import { isNotNil } from 'es-toolkit';
import { useFicheContext } from '../../../../../context/fiche-context';
import { useSelectAxes } from '../use-select-axes';
import { ColonneTableauEmplacement } from './ColonneTableauEmplacement';

type EmplacementsPanelProps = {
  isLoading: boolean;
  hasFailed: boolean;
  onRetry: () => void;
  plans: AxeNode[];
  selectedAxes: AxeNode[];
  onSelectAxe: (axe: AxeNode) => void;
  onSave: () => void;
};

const EmplacementsPanel = ({
  isLoading,
  hasFailed,
  onRetry,
  plans,
  selectedAxes,
  onSelectAxe,
  onSave,
}: EmplacementsPanelProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <SpinnerLoader className="w-8 h-8" />
      </div>
    );
  }

  if (hasFailed) {
    return <ErrorCard title={appLabels.uneErreurEstSurvenue} retry={onRetry} />;
  }

  if (plans.length === 0) {
    return (
      <span className="text-primary-9 text-sm font-bold">
        {appLabels.ficheEmplacementAucunPlanRattacher}
      </span>
    );
  }

  const selectedAxesIds = selectedAxes.map(({ axe }) => axe.id);
  const maxSelectedDepth = selectedAxes.length - 1;

  return (
    <>
      <div className="border border-grey-3 rounded-lg grid grid-flow-col auto-cols-[16rem] overflow-x-auto divide-x-[0.5px] divide-primary-3 py-3">
        <ColonneTableauEmplacement
          axesList={plans}
          selectedAxesIds={selectedAxesIds}
          maxSelectedDepth={maxSelectedDepth}
          onSelectAxe={onSelectAxe}
        />

        {selectedAxes.map(({ axe, enfants }) => (
          <ColonneTableauEmplacement
            key={axe.id}
            axesList={enfants}
            selectedAxesIds={selectedAxesIds}
            maxSelectedDepth={maxSelectedDepth}
            onSelectAxe={onSelectAxe}
          />
        ))}
      </div>

      <Button
        onClick={onSave}
        disabled={selectedAxes.length === 0}
        className="ml-auto"
      >
        {appLabels.ficheEmplacementValiderCetEmplacement}
      </Button>
    </>
  );
};

type NouvelEmplacementFicheProps = {
  fiche: FicheWithRelations;
  onSave: () => void;
};

const NouvelEmplacementFiche = ({
  fiche,
  onSave,
}: NouvelEmplacementFicheProps) => {
  const collectiviteId = useCollectiviteId();
  const {
    plans: allPlans,
    isLoading,
    error,
    refetch,
  } = useListPlans(collectiviteId);

  const { update } = useFicheContext();

  // Tableau contenant les ids des axes de la fiche
  const ficheAxesIds = (fiche.axes ?? []).map((axe) => axe.id);

  // On retire les plans qui contiennent déjà la fiche
  const plans = allPlans
    .filter(({ axes }) => !axes.some(({ id }) => ficheAxesIds.includes(id)))
    .map(({ axes }) => toRootAxeNode(axes))
    .filter(isNotNil);

  // gestion de la sélection d'un emplacement
  const {
    selectedAxes,
    setSelectedAxes,
    handleSelectAxe: handleSelectAxeBase,
  } = useSelectAxes();

  // Gestion de la sélection d'un nouvel axe
  const handleSelectAxe = (selectedAxe: AxeNode) => {
    const currentDepth = selectedAxes.length - 1;
    handleSelectAxeBase(selectedAxe);

    setTimeout(() => {
      // Le setTimeout permet d'attendre que la mise à jour de 'selectedAxes' soit terminée
      // et que la nouvelle colonne soit bien affichée avant de calculer 'idToScrollTo'
      const [firstChildAxe] = selectedAxe.enfants;
      const scrollTarget = firstChildAxe ?? selectedAxe;

      if (scrollTarget.depth > currentDepth) {
        document
          .getElementById(scrollTarget.axe.id.toString())
          ?.scrollIntoView({ behavior: 'smooth', inline: 'end' });
      }
    }, 0);
  };

  // Sauvegarde du plan sélectionné
  const handleSave = () => {
    const { axe } = selectedAxes[selectedAxes.length - 1];

    const updatedAxes =
      fiche.axes?.map((currentAxe) => ({
        id: currentAxe.id,
      })) || [];
    if (!updatedAxes.find((currentAxe) => currentAxe.id === axe.id)) {
      updatedAxes.push({
        id: axe.id,
      });
      update({
        ficheId: fiche.id,
        ficheFields: {
          axes: updatedAxes,
        },
      });
    }

    setSelectedAxes([]);
    onSave();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Message d'info */}
      <Alert title={appLabels.ficheEmplacementModalAlert} />

      <EmplacementsPanel
        isLoading={isLoading}
        hasFailed={isNotNil(error)}
        onRetry={refetch}
        plans={plans}
        selectedAxes={selectedAxes}
        onSelectAxe={handleSelectAxe}
        onSave={handleSave}
      />
    </div>
  );
};

export default NouvelEmplacementFiche;
