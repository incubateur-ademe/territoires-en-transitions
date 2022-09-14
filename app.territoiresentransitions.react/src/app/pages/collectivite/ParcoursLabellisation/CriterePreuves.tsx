/**
 * Affiche le critère Fichiers
 */
import {LabellisationDemandeRead} from 'generated/dataLayer/labellisation_demande_read';
import {LabellisationParcoursRead} from 'generated/dataLayer/labellisation_parcours_read';
import {referentielToName} from 'app/labels';
import {PreuveDoc} from 'ui/shared/preuves/Bibliotheque/PreuveDoc';
import {AddDocsButton} from './AddDocsButton';
import {CritereRempli} from './CritereRempli';
import {useEditPreuve} from 'ui/shared/preuves/Bibliotheque/useEditPreuve';
import {TPreuveLabellisation} from 'ui/shared/preuves/Bibliotheque/types';

const REGLEMENTS: {[k: string]: string} = {
  eci: '/Reglement_label_ECi_20220316.pdf',
  cae: '/TE-CAE_Reglement-label_2021.pdf',
};

export type TCriterePreuvesProps = {
  collectiviteId: number;
  parcours: LabellisationParcoursRead;
  preuves: TPreuveLabellisation[];
  demande: LabellisationDemandeRead | null;
};

export const CriterePreuves = (props: TCriterePreuvesProps) => {
  const {parcours, preuves, demande} = props;
  const {referentiel, etoiles} = parcours;

  // critère nécessitant l'ajout d'une ou plusieurs preuves
  const rempli = preuves.length > 0;
  return (
    <>
      {referentiel === 'eci' && etoiles !== '1' ? (
        <>
          <li className="fr-mb-1w">
            Ajouter les documents officiels de candidature
          </li>
          <ul>
            <li>
              <b>Courrier d’acte de candidature</b> : motivation et palier visé,
              précision des compétences, engagement à améliorer de façon
              continue la politique {referentielToName[referentiel]} et
              coordonnées de la personne référente technique
            </li>
            <li>
              <b>Arrêté préfectoral de création de l’EPCI</b> (Établissement
              public de coopération intercommunale)
            </li>
          </ul>
        </>
      ) : null}
      <li className="fr-mb-1w">
        Signer un{' '}
        <a href="/Acte_engagement.docx" target="_blank" rel="noopener">
          acte d’engagement
        </a>{' '}
        dans le programme affirmant votre adhésion{' '}
        <a href={REGLEMENTS[referentiel]} target="_blank" rel="noopener noreferrer">
          au règlement du label
        </a>
      </li>
      {rempli ? <CritereRempli className="fr-mb-2w" /> : null}
      {demande && demande.en_cours ? (
        <AddDocsButton demande_id={demande.id} />
      ) : null}
      {demande ? <LabellisationPreuves {...props} /> : null}
    </>
  );
};

/**
 * Affiche les fichiers attachés à la demande
 */
const LabellisationPreuves = (props: TCriterePreuvesProps) => {
  const {preuves} = props;
  if (!preuves.length) {
    return null;
  }

  return (
    <div className="mt-2" data-test="LabellisationPreuves">
      {preuves.map(preuve => (
        <PreuveFichierDetail
          key={preuve.fichier?.hash}
          {...props}
          preuve={preuve}
        />
      ))}
    </div>
  );
};

/**
 * Affiche un fichier et gère l'édition de
 * commentaire, la suppression et le téléchargement
 */
const PreuveFichierDetail = ({
  preuve,
  demande,
}: TCriterePreuvesProps & {
  preuve: TPreuveLabellisation;
}) => {
  const handlers = useEditPreuve(preuve);

  return (
    <PreuveDoc
      preuve={preuve}
      readonly={!demande?.en_cours}
      classComment="pb-0 mb-2"
      handlers={handlers}
    />
  );
};
