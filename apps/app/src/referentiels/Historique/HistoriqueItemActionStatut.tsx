import { appLabels } from '@/app/labels/catalog';
import ActionStatutBadge from '@/app/referentiels/actions/action-statut/action-statut.badge';
import { cn } from '@tet/ui';
import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from './DetailModificationWrapper';
import Modification from './Modification';
import { HistoriqueItemPropsOf } from './types';
import { getItemActionProps } from './utils';

type Props = HistoriqueItemPropsOf<'action_statut'>;

const HistoriqueItemActionStatut = (props: Props) => {
  const { item } = props;

  return (
    <Modification
      historique={item}
      nom="Mesure : statut modifié"
      detail={<HistoriqueItemActionStatutDetails {...props} />}
      {...getItemActionProps(item)}
    />
  );
};

export default HistoriqueItemActionStatut;

const HistoriqueItemActionStatutDetails = (props: Props) => {
  const { item } = props;
  const {
    previousAvancement,
    previousAvancementDetaille,
    previousConcerne,
    avancement,
    avancementDetaille,
    concerne,
  } = item;

  return (
    <>
      {previousAvancement !== null ? (
        <DetailPrecedenteModificationWrapper>
          {previousAvancement === 'detaille' && previousAvancementDetaille ? (
            <ActionStatutDetaillee
              avancementDetaille={previousAvancementDetaille}
              barre
            />
          ) : (
            <ActionStatutBadge
              statut={
                (previousAvancement === 'non_renseigne' ||
                  !previousAvancement) &&
                previousConcerne === false
                  ? 'non_concerne'
                  : previousAvancement ?? 'non_renseigne'
              }
              barre
              size="md"
            />
          )}
        </DetailPrecedenteModificationWrapper>
      ) : null}
      <DetailNouvelleModificationWrapper>
        {avancement === 'detaille' && avancementDetaille ? (
          <ActionStatutDetaillee avancementDetaille={avancementDetaille} />
        ) : (
          <ActionStatutBadge
            statut={
              (avancement === 'non_renseigne' || !avancement) &&
              concerne === false
                ? 'non_concerne'
                : avancement ?? 'non_renseigne'
            }
            size="md"
          />
        )}
      </DetailNouvelleModificationWrapper>
    </>
  );
};

const STATUTS = [
  appLabels.avancementFait,
  appLabels.avancementProgramme,
  appLabels.avancementPasFait,
] as const;

type ActionStatutDetailleeProps = {
  avancementDetaille: number[];
  barre?: boolean;
};

const ActionStatutDetaillee = ({
  avancementDetaille,
  barre = false,
}: ActionStatutDetailleeProps) => (
  <>
    <ActionStatutBadge statut="detaille" barre={barre} size="md" />
    <div className="mt-2 flex flex-col gap-0.5 [&>p]:mb-0">
      {STATUTS.map((statut, index) => (
        <p
          key={statut}
          className={cn('text-sm whitespace-nowrap', barre && 'line-through')}
        >
          {appLabels.detailleStatutPourcentage({
            statut,
            percent: avancementDetaille[index] * 100,
          })}
        </p>
      ))}
    </div>
  </>
);
