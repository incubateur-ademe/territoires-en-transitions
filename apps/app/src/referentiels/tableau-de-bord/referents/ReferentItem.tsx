import { appLabels } from '@/app/labels/catalog';
import { referentielToName } from '@/app/app/labels';
import { Membre } from '@/app/collectivites/membres/list-membres/use-list-membres';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { Icon, Tooltip, useCopyToClipboard } from '@tet/ui';

export type ReferentItemProps = {
  membre: Membre;
};

/**
 * Affiche des infos à propos d'un référent de la collectivité
 */
export const ReferentItem = (props: ReferentItemProps) => {
  const { membre } = props;
  const { copy } = useCopyToClipboard();
  const { setToast } = useToastContext();

  return (
    <Tooltip
      label={
        <div>
          <p>
            <span className="text-grey-8">
              {appLabels.champInterventionLabel}
            </span>{' '}
            <span>
              {membre.champIntervention?.length
                ? membre.champIntervention
                    .map((ref) => referentielToName[ref])
                    .join(' / ')
                : appLabels.nonRenseigne}
            </span>
          </p>
          <p>
            <span className="text-grey-8">{appLabels.intituleDePosteLabel}</span>{' '}
            <span>
              {membre.detailsFonction
                ? membre.detailsFonction
                : appLabels.nonRenseigne}
            </span>
          </p>
          <p className="text-primary underline">{membre.email}</p>
        </div>
      }
    >
      <div
        className="inline-flex gap-1 items-center p-1 cursor-pointer text-grey-8 hover:rounded-md hover:bg-grey-3"
        onClick={() => {
          if (membre.email) {
            copy(membre.email);
            setToast('success', 'Courriel copié');
          }
        }}
      >
        {membre.prenom} {membre.nom}{' '}
        <Icon icon="mail-line" className="text-grey-5" />
      </div>
    </Tooltip>
  );
};
