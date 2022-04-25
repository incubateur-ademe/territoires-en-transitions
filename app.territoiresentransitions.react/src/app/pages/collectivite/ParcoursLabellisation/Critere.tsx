import {
  makeCollectiviteReferentielUrl,
  makeCollectiviteActionUrl,
  ReferentielParamOption,
  REGLEMENTS,
} from 'app/paths';
import {CritereActionTable} from './CritereActionTable';
import {CritereLabellisation, ParcoursLabellisation} from './types';

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

  // critère associé à une action
  if ('action_id' in critere) {
    return <Formulation {...props} />;
  }

  // critère associé à des pré-requis liés aux actions
  if ('criteres' in critere) {
    return (
      <>
        <Formulation {...props} />
        <CritereActionTable
          {...critere}
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
  if ('fichiers' in critere) {
    return (
      <>
        <Formulation {...props} />
      </>
    );
  }

  // critère "simple"
  const {rempli} = critere;
  return (
    <>
      <Formulation {...props} />
      {rempli ? (
        <i className="flex fr-icon fr-fi-checkbox-circle-fill before:text-[#5FD68C] before:pr-3 fr-text--sm fr-mb-0 fr-ml-3w">
          Terminé
        </i>
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
