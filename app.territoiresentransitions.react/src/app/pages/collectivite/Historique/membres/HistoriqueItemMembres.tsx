import {useMemo} from 'react';
import {makeCollectiviteUsersUrl} from 'app/paths';
import {
  DetailNouvelleModificationWrapper,
  DetailPrecedenteModificationWrapper,
} from 'app/pages/collectivite/Historique/DetailModificationWrapper';
import Modification, {
  HistoriqueDescription,
} from 'app/pages/collectivite/Historique/Modification';
import {MembreChampModifie, THistoriqueItemProps} from './fakeTypes';

/**
 * Modification lors d'un changement sur un membre de la collectivité
 */
const HistoriqueItemMembres = (props: THistoriqueItemProps) => {
  const {item} = props;
  const {
    collectivite_id,
    membre_concerne,
    previous_membre_acces,
    new_membre_acces,
    champ_modifie,
  } = item;

  const titleDisplayed = useMemo(() => {
    if (new_membre_acces && previous_membre_acces === null) {
      return 'Membre ajouté';
    }
    if (champ_modifie) {
      return 'Membre modifié';
    }
    return 'Membre retiré de la collectivité';
  }, [new_membre_acces, previous_membre_acces, champ_modifie]);

  const descriptionDisplayed: HistoriqueDescription[] = useMemo(() => {
    if (membre_concerne) {
      /** Membre ajouté */
      if (new_membre_acces && previous_membre_acces === null) {
        return [
          {
            titre: 'Adresse email du nouveau membre',
            description: membre_concerne,
          },
          {titre: 'Accès', description: new_membre_acces},
        ];
      }
      /** Membre Modifié */
      if (champ_modifie) {
        return [
          {titre: 'Nom du membre modifié', description: membre_concerne},
          {
            titre: 'Champ modifié',
            description: generateChampModifieDisplayed(champ_modifie),
          },
        ];
      }
      /** Membre retiré */
      return [{titre: 'Nom du membre retiré', description: membre_concerne}];
    } else {
      return [];
    }
  }, [membre_concerne, previous_membre_acces, new_membre_acces, champ_modifie]);

  return (
    <Modification
      historique={item}
      icon="fr-fi-information-fill"
      nom={titleDisplayed}
      descriptions={descriptionDisplayed}
      detail={
        champ_modifie ? <HistoriqueItemMembresDetails {...props} /> : undefined
      }
      pageLink={makeCollectiviteUsersUrl({
        collectiviteId: collectivite_id,
      })}
    />
  );
};

export default HistoriqueItemMembres;

// TODO FAIRE LE DETAIL
const HistoriqueItemMembresDetails = (props: THistoriqueItemProps) => {
  const {item} = props;
  const {
    previous_membre_acces,
    new_membre_acces,
    previous_champ_modifie,
    new_champ_modifie,
  } = item;

  return (
    <>
      {previous_membre_acces || previous_champ_modifie ? (
        <DetailPrecedenteModificationWrapper>
          <span className="line-through">
            {(previous_champ_modifie && previous_champ_modifie) ||
              (previous_membre_acces && previous_membre_acces)}
          </span>
        </DetailPrecedenteModificationWrapper>
      ) : null}
      <DetailNouvelleModificationWrapper>
        {(new_champ_modifie && new_champ_modifie) ||
          (new_membre_acces && new_membre_acces)}
      </DetailNouvelleModificationWrapper>
    </>
  );
};

const generateChampModifieDisplayed = (champ: MembreChampModifie) => {
  if (champ === 'fonction') return 'Fonction';
  if (champ === 'champ_intervention') return "Champ d'intervention";
  if (champ === 'details_fonction') return 'Détails fonction';
  if (champ === 'acces') return 'Accès';
  return '';
};
