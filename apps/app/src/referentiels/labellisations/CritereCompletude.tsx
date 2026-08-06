import { makeReferentielUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { TLabellisationParcours } from '@/app/referentiels/labellisations/types';
import { StatutAvancementEnum } from '@tet/domain/referentiels';
import { Button } from '@tet/ui';
import { CritereRempli } from './CritereRempli';

export type TCritereScoreProps = {
  collectiviteId: number;
  parcours: TLabellisationParcours;
};

/**
 * Affiche le critère lié au remplissage du référentiel
 */
export const CritereCompletude = (props: TCritereScoreProps) => {
  const { collectiviteId, parcours } = props;
  const { completude_ok, referentiel } = parcours;
  const referentielId = referentiel;

  return (
    <>
      <li className="mb-2">{appLabels.renseignerStatutsReferentiel}</li>
      {completude_ok ? (
        <CritereRempli />
      ) : (
        <Button
          variant="underlined"
          size="sm"
          icon="arrow-right-line"
          iconPosition="right"
          external
          href={makeReferentielUrl({
            collectiviteId,
            referentielId,
            referentielTab: 'progression',
            filters: { statuts: [StatutAvancementEnum.NON_RENSEIGNE] },
          })}
        >
          {appLabels.mettreAJour}
        </Button>
      )}
    </>
  );
};
