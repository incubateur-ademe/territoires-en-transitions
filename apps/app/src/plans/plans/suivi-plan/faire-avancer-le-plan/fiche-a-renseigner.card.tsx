import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useCanEditAction } from '@/app/plans/fiches/share-fiche/use-can-edit-action';
import FicheStatutBadge from '@/app/plans/fiches/show-fiche/components/fiche-statut.badge';
import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { JaugeBadge } from '@/app/plans/shared/jauge/jauge.badge';
import { JaugeSlider } from '@/app/plans/shared/jauge/jauge.slider';
import StatutsSelectDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsSelectDropdown';
import { generateTitle } from '@/app/utils/generate-title';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { isJaugeFigee } from '@tet/domain/plans';
import { format } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';

export const FicheARenseignerCard = ({
  collectiviteId,
  planId,
  fiche,
}: {
  collectiviteId: number;
  planId: number;
  fiche: FicheListItem;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const canEdit = useCanEditAction(fiche);
  const { mutate: updateFiche } = useUpdateFiche({
    onUpdateCallback: () =>
      queryClient.invalidateQueries({
        queryKey: trpc.plans.suivi.pathKey(),
      }),
  });
  const [jauge, setJauge] = useState(fiche.jauge);
  const [savedJauge, setSavedJauge] = useState(fiche.jauge);

  if (fiche.jauge !== savedJauge) {
    setSavedJauge(fiche.jauge);
    setJauge(fiche.jauge);
  }

  const titre = generateTitle(fiche.titre);
  const pilotes = (fiche.pilotes ?? [])
    .map((pilote) => pilote.nom)
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className="flex flex-col gap-2 p-4 bg-white rounded-lg border border-grey-3"
      data-test="plans.suivi.renseigner-avancement.fiche"
    >
      <Link
        href={makeCollectiviteActionUrl({
          collectiviteId,
          planId,
          ficheUid: fiche.id.toString(),
        })}
        className="text-sm font-bold text-primary-9 bg-none hover:underline"
      >
        {titre}
      </Link>
      <span className="text-xs text-grey-8">
        {[
          pilotes || appLabels.personnePiloteSans,
          appLabels.renseignerAvancementMiseAJour(
            format(new Date(fiche.modifiedAt), 'dd/MM/yyyy')
          ),
        ].join(' · ')}
      </span>
      <div className="flex items-center gap-3 mt-1">
        {canEdit ? (
          <StatutsSelectDropdown
            values={fiche.statut}
            onChange={(statut) =>
              updateFiche({ ficheId: fiche.id, ficheFields: { statut } })
            }
            buttonClassName="w-fit border-0 p-0 min-h-0 bg-transparent"
            badgeSize="sm"
            dataTest="plans.suivi.renseigner-avancement.statut"
          />
        ) : (
          fiche.statut && <FicheStatutBadge statut={fiche.statut} size="sm" />
        )}
        <JaugeBadge value={jauge} statut={fiche.statut} />
        <JaugeSlider
          ariaLabel={appLabels.renseignerAvancementJauge(titre)}
          value={jauge}
          isDisabled={!canEdit || isJaugeFigee(fiche.statut)}
          className="flex-1"
          onValueChange={setJauge}
          onValueCommit={(value) => {
            if (value === fiche.jauge) return;
            updateFiche({ ficheId: fiche.id, ficheFields: { jauge: value } });
          }}
          dataTest="plans.suivi.renseigner-avancement.jauge"
        />
      </div>
    </div>
  );
};
