import {
  makeCollectiviteReferentielUrl,
  makeCollectiviteActionUrl,
  ReferentielParamOption,
  REGLEMENTS,
} from 'app/paths';
import {DocItem} from 'ui/shared/ResourceManager/DocItem';
import {Doc} from 'ui/shared/ResourceManager/types';
import {AddDocsButton} from './AddDocsButton';
import {CritereActionTable} from './CritereActionTable';
import {
  CritereLabellisation,
  CritereLabellisationListeActions,
  CritereLabellisationListeFichiers,
  ParcoursLabellisation,
} from './types';

export type TCritereProps = {
  parcours: ParcoursLabellisation;
  critere: CritereLabellisation;
};

/**
 * Affiche un critère
 */
export const Critere = (props: TCritereProps) => {
  const {parcours, critere} = props;
  const {collectivite_id: collectiviteId, referentiel} = parcours;
  const referentielId = referentiel as ReferentielParamOption;
  const type = getCritereType(critere);

  // critère associé à une action
  if (type === CritereType.action) {
    return <Formulation {...props} />;
  }

  // critère associé à des pré-requis liés aux actions
  if (type === CritereType.liste_actions) {
    return (
      <>
        <Formulation {...props} />
        <CritereActionTable
          {...(critere as CritereLabellisationListeActions)}
          className="fr-my-4w"
          onClickRow={actionId => {
            window.document.open(
              makeCollectiviteActionUrl({
                collectiviteId,
                referentielId,
                actionId,
              })
            );
          }}
        />
      </>
    );
  }

  // critère nécessitant l'ajout d'un ou plusieurs fichiers
  const {rempli} = critere;
  if (type === CritereType.fichiers) {
    const {fichiers} = critere as CritereLabellisationListeFichiers;
    return (
      <>
        <Formulation {...props} />
        <ul>
          {(critere as CritereLabellisationListeFichiers).fichiers.map(
            (f, index) => (
              <li
                key={`f-${index}`}
                dangerouslySetInnerHTML={{__html: f.formulation}}
              />
            )
          )}
        </ul>
        {rempli ? <CritereRempli /> : null}
        {<AddDocsButton parcours_id="" />}
        {fichiers.map(doc => (
          <DocAttache key={doc.id || doc.filename} doc={doc} />
        ))}
      </>
    );
  }

  // critère "simple"
  return (
    <>
      <Formulation {...props} />
      {rempli ? (
        <CritereRempli />
      ) : (
        <a
          className="fr-link fr-link--icon-right fr-fi-arrow-right-line fr-mb-2w"
          target="_blank"
          href={makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId,
          })}
        >
          Mettre à jour
        </a>
      )}
    </>
  );
};

/**
 * Affiche le libellé d'un critère
 */
const reReglement = /\{le règlement du label\}/;
const Formulation = (props: TCritereProps) => {
  const {critere, parcours} = props;
  const {referentiel} = parcours;
  const {formulation} = critere;

  // cas particulier : ajouter un lien vers le règlement du label
  const matchReglement = formulation.match(reReglement);
  let html = formulation;
  if (matchReglement?.length) {
    html = formulation.replace(
      matchReglement[0],
      `<a href="${REGLEMENTS[referentiel]}" target="_blank" rel="noopener">le règlement du label</a>`
    );
  }

  return <li className="fr-mb-1w" dangerouslySetInnerHTML={{__html: html}} />;
};

/** Affiche le picto et le libellé "critère rempli" */
const CritereRempli = () => (
  <i className="flex fr-icon fr-fi-checkbox-circle-fill before:text-[#5FD68C] before:pr-3 fr-text--sm fr-mb-0 fr-ml-3w">
    Terminé
  </i>
);

/**
 * Affiche un document (nom de fichier ou titre de lien) et gère l'édition de
 * commentaire, la suppression et l'ouverture ou le téléchargement
 */
const DocAttache = ({doc}: {doc: Doc}) => {
  const handlers = useEditDoc(doc);
  return <DocItem doc={doc} handlers={handlers} />;
};

enum CritereType {
  simple = 'simple',
  liste_actions = 'liste_actions',
  action = 'action',
  liste_fichiers = 'liste_fichiers',
}

const getCritereType = (critere: CritereLabellisation): CritereType => {
  if ('action_id' in critere) {
    return CritereType.action;
  }
  if ('criteres' in critere) {
    return CritereType.liste_actions;
  }
  if ('fichiers' in critere) {
    return CritereType.liste_fichiers;
  }
  return CritereType.simple;
};
