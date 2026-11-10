import type { IndicateurCardProps } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import type { Plan } from '@tet/domain/plans';
import { useListIndicateurValeurs } from '@/app/indicateurs/valeurs/use-list-indicateur-valeurs';
import { appLabels } from '@/app/labels/catalog';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import {
  COLLECTIVITE_SOURCE_ID,
  ELECTRIFICATION_SOURCE_ID,
  IndicateurPeriodes,
} from '@tet/domain/indicateurs';

type CibleProps = {
  collectiviteId: number;
  indicateurId: number;
  metadonneeId: number;
  unite: string | null | undefined;
};

export function getElectrificationCibleDisplay({
  source,
  ...props
}: Omit<CibleProps, 'metadonneeId'> & {
  source: Plan['indicateurSource'];
}): Pick<IndicateurCardProps, 'excludedSources' | 'additionalContent'> {
  if (source?.sourceId !== ELECTRIFICATION_SOURCE_ID) return {};
  return {
    excludedSources: [source.sourceId],
    additionalContent: (
      <ElectrificationCible {...props} metadonneeId={source.id} />
    ),
  };
}

/** La cible de cette annexe est indépendante de l'objectif courant. */
const ElectrificationCible = ({ metadonneeId, ...props }: CibleProps) => (
  <div className="space-y-3">
    <SourceObjectifs
      {...props}
      sourceId={COLLECTIVITE_SOURCE_ID}
      label={appLabels.indicateurObjectifCollectivite}
      emptyLabel={appLabels.indicateurValeurAbsente}
      dataTest="plans.indicateurs.objectifs-collectivite"
    />
    <SourceObjectifs
      {...props}
      sourceId={ELECTRIFICATION_SOURCE_ID}
      metadonneeId={metadonneeId}
      label={appLabels.electrificationCibleAnnexe}
      emptyLabel={appLabels.indicateurCibleAbsente}
      dataTest="plans.indicateurs.cible-annexe"
    />
  </div>
);

const SourceObjectifs = ({
  collectiviteId,
  indicateurId,
  metadonneeId,
  unite,
  sourceId,
  label,
  emptyLabel,
  dataTest,
}: Omit<CibleProps, 'metadonneeId'> & {
  metadonneeId?: number;
  sourceId: string;
  label: string;
  emptyLabel: string;
  dataTest: string;
}) => {
  const { data, isPending, isError } = useListIndicateurValeurs({
    collectiviteId,
    indicateurIds: [indicateurId],
    metadonneeId,
    sources: [sourceId],
  });
  const objectifs = data?.indicateurs[0]?.sources[sourceId]?.valeurs.flatMap(
    ({ objectif, ...valeur }) =>
      objectif == null ? [] : [{ ...valeur, objectif }]
  );

  return (
    <div
      className="border-t border-primary-3 pt-3 text-sm"
      data-test={dataTest}
    >
      <div className="font-bold text-primary-10">{label}</div>
      {isPending ? (
        <p className="mb-0">{appLabels.formChargement}</p>
      ) : isError ? (
        <p className="mb-0 text-error">
          {appLabels.indicateurObjectifsLectureErreur}
        </p>
      ) : objectifs?.length ? (
        <ul className="mb-0 pl-0 list-none">
          {objectifs.map(({ id, objectif, dateValeur, periodicite }) => (
            <li key={id}>
              {appLabels.indicateurObjectifValeur({
                valeur: toLocaleFixed(objectif, 20),
                unite: unite ?? '',
                periode: IndicateurPeriodes.format(
                  IndicateurPeriodes.containing(periodicite, dateValeur)
                ),
              })}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-0 text-grey-7">{emptyLabel}</p>
      )}
    </div>
  );
};
