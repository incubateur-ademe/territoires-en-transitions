import { appLabels } from '@/app/labels/catalog';
import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';
import {
  SecteurReglementaire,
  secteurReglementaireEnumValues,
} from '@tet/domain/plans';
import { Icon, SelectMultiple, Tooltip } from '@tet/ui';
import { useFicheContext } from '../../../context/fiche-context';
import { useGetFicheSecteurs } from '../../../data/use-get-fiche-secteurs';
import { useUpsertFicheSecteurs } from '../../../data/use-upsert-fiche-secteurs';
import { InlineEditableItem } from '../editable-item';
import { FicheSecteursList, isARenseigner } from './fiche-secteurs.list';

const secteurOptions = secteurReglementaireEnumValues.map((secteur) => ({
  value: secteur,
  label: appLabels.ficheSecteurReglementaireLabels[secteur],
}));

const toSecteursOrdonnes = (values: unknown[] | undefined) =>
  secteurReglementaireEnumValues.filter((secteur) => values?.includes(secteur));

export const Secteurs = () => {
  const isEnabled = useIsFeatureFlagEnabled('is-fiche-secteurs-enabled');
  if (!isEnabled) {
    return null;
  }
  return <SecteursItem />;
};

const SecteursItem = () => {
  const { fiche, isReadonly } = useFicheContext();
  const { data, isLoading, isError } = useGetFicheSecteurs(fiche.id);
  const { mutate: upsertSecteurs } = useUpsertFicheSecteurs(fiche.id);

  const secteurs = isError ? { etat: 'en_cours_de_calcul' as const } : data;
  if (isLoading || secteurs?.etat === 'non_renseigne') {
    return null;
  }
  const selectedSecteurs: SecteurReglementaire[] =
    secteurs?.etat === 'attribue' ? secteurs.secteurs : [];

  return (
    <InlineEditableItem
      small
      icon="stack-line"
      label={
        secteurs && 'origine' in secteurs && !isARenseigner(secteurs) ? (
          <div className="text-primary-10 text-base flex items-center gap-1">
            {appLabels.ficheSecteursReglementaires}
            <Tooltip
              label={appLabels.ficheSecteursOrigineLabels[secteurs.origine]}
            >
              <span>
                <Icon icon="information-line" size="sm" />
              </span>
            </Tooltip>
            {appLabels.labelDeuxPoints({ label: '' }).trim()}
          </div>
        ) : (
          appLabels.ficheSecteursReglementaires
        )
      }
      value={<FicheSecteursList isLoading={isLoading} secteurs={secteurs} />}
      isReadonly={isReadonly || isLoading}
      renderOnEdit={({ openState }) => (
        <SelectMultiple
          inlineEdit
          openState={openState}
          options={secteurOptions}
          values={selectedSecteurs}
          onChange={({ values }) => {
            upsertSecteurs({
              ficheId: fiche.id,
              secteurs: toSecteursOrdonnes(values),
            });
          }}
        />
      )}
    />
  );
};
