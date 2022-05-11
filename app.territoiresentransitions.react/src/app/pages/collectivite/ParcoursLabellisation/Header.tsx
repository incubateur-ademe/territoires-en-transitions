/**
 * Affiche l'en-tête de page contenant l'objectif et le bouton pour candidater
 */

import {LabellisationDemandeRead} from 'generated/dataLayer/labellisation_demande_read';
import {LabellisationParcoursRead} from 'generated/dataLayer/labellisation_parcours_read';
import {LabellisationPreuveFichierRead} from 'generated/dataLayer/labellisation_preuve_fichier_read';
import {useState} from 'react';
import {PageHeaderLeft} from 'ui/PageHeader';
import {DemandeLabellisationModal} from './DemandeLabellisationModal';
import {numLabels} from './numLabels';

export type THeaderProps = {
  parcours: LabellisationParcoursRead;
  demande: LabellisationDemandeRead | null;
  preuves: LabellisationPreuveFichierRead[];
};

export const Header = (props: THeaderProps) => {
  const {parcours, demande, preuves} = props;
  const {
    etoiles,
    completude_ok,
    critere_score,
    criteres_action,
    derniere_demande,
    derniere_labellisation,
  } = parcours;

  const demande_envoyee = demande && !demande.en_cours && derniere_demande;

  // on peut soumettre la demande de labellisation si...
  const canSubmit =
    // la demande est toujours en cours
    !demande_envoyee &&
    // et le référentiel est rempli
    completude_ok &&
    // et le score nécessaire est atteint
    critere_score?.atteint &&
    // et il n'y a pas de critère action non rempli
    !criteres_action.find(c => !c.rempli) &&
    // et le critère preuves est rempli
    preuves?.length > 0;
  const [opened, setOpened] = useState(false);

  return (
    <PageHeaderLeft>
      {demande_envoyee ? (
        <p className="m-0">
          Votre demande pour la {numLabels[derniere_demande.etoiles]} étoile a
          été envoyée
        </p>
      ) : null}
      {derniere_labellisation && !demande_envoyee ? (
        <p className="m-0">
          <span className="capitalize">
            {numLabels[derniere_labellisation.etoiles]}
          </span>{' '}
          étoile depuis le{' '}
          {new Date(derniere_labellisation.obtenue_le).toLocaleDateString(
            'fr-FR',
            {dateStyle: 'long'}
          )}
        </p>
      ) : null}
      <h2 className="fr-mb-2w">Objectif : {numLabels[etoiles]} étoile</h2>
      <button
        className="fr-btn self-start"
        disabled={!canSubmit}
        onClick={() => setOpened(true)}
      >
        {etoiles === '1' ? 'Demander la première étoile' : 'Demander un audit'}
      </button>
      {demande ? (
        <DemandeLabellisationModal
          demande={demande}
          parcours={parcours}
          opened={opened}
          setOpened={setOpened}
        />
      ) : null}
    </PageHeaderLeft>
  );
};
