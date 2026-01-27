import { referentielToName } from '@/app/app/labels';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { Icon, Tooltip, useCopyToClipboard } from '@tet/ui';
import { CollectiviteMembre } from './useMembres';

export type ReferentItemProps = {
  membre: CollectiviteMembre;
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
            <span className="text-grey-8">Champ d&apos;intervention :</span>{' '}
            <span>
              {membre.champIntervention?.length
                ? membre.champIntervention
                    .map((ref) => referentielToName[ref])
                    .join(' / ')
                : 'Non renseigné'}
            </span>
          </p>
          <p>
            <span className="text-grey-8">Intitulé de poste :</span>{' '}
            <span>
              {membre.detailsFonction
                ? membre.detailsFonction
                : 'Non renseigné'}
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
