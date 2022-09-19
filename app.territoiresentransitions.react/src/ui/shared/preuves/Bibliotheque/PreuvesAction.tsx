import {TPreuveComplementaire, TPreuveReglementaire} from './types';
import {PreuveReglementaire} from './PreuveReglementaire';
import {AddPreuveComplementaire} from 'ui/shared/actions/AddPreuve/AddPreuveComplementaire';
import {PreuveComplementaire} from './PreuveComplementaire';

export type TPreuvesActionProps = {
  /** Identifiant de l'action (ou de la sous-action concernée). Si l'id se
   * termine par "%" il s'agit du cas "action et ses sous-actions"
   */
  action_id: string;
  /** les preuves réglementaires */
  reglementaires?: TPreuveReglementaire[];
  /** les preuves complémentaires */
  complementaires?: TPreuveComplementaire[];
  /** indique si l'avertissement "toutes les preuves ajoutées seront
   * visibles..." doit être affiché */
  showWarning?: boolean;
};

/**
 * Affiche la liste des preuves associées à une action, en regroupant pour les
 * preuves réglementaires celles associées au même id de définition
 */
export const PreuvesAction = (props: TPreuvesActionProps) => {
  const {action_id, reglementaires, complementaires, showWarning} = props;
  const preuvesParId = reglementaires?.length
    ? Array.from(groupByPreuveDefinitionId(reglementaires))
    : null;
  // si l'id se termine par "%" il s'agit du cas "action et ses sous-actions"
  const isAction = action_id.endsWith('%');

  return (
    <>
      {preuvesParId ? (
        <>
          <h5>Preuves attendues</h5>
          <div className="divide-y divide-[#ddd] -mt-2">
            {preuvesParId.map(([preuveDefId, preuvesList]) => (
              <PreuveReglementaire key={preuveDefId} preuves={preuvesList} />
            ))}
          </div>
          <YellowDivider />
        </>
      ) : (
        <p className="fr-text-sm">
          Il n'y a pas de preuve attendue pour cette{' '}
          {isAction ? 'action' : 'sous-action'} du référentiel.
          <br />
          Vous pouvez ajouter les documents preuves que vous jugez utiles pour
          justifier l'avancement.
        </p>
      )}
      <h5>Preuves complémentaires</h5>
      <AddPreuveComplementaire action_id={action_id} />
      <div className="divide-y divide-[#ddd]">
        {complementaires?.map(preuve => (
          <PreuveComplementaire key={preuve.id} preuve={preuve} />
        ))}
      </div>
      {showWarning ? (
        <>
          <YellowDivider />
          <p>
            Toutes les preuves ajoutées seront visibles par les membres de la
            communauté Territoires en Transitions
          </p>
        </>
      ) : null}
    </>
  );
};

const YellowDivider = () => (
  <div className="border-solid border-t-[1px] border-[#FCC63A] my-4" />
);

// regrouve les preuves réglementaires par l'identifiant de leur définition
const groupByPreuveDefinitionId = (preuves: TPreuveReglementaire[]) => {
  // on utilise une Map pour conserver l'ordre d'insertion
  const byId = new Map<string, TPreuveReglementaire[]>();

  preuves.forEach(preuve => {
    const {id} = preuve.preuve_reglementaire;
    byId.set(id, [...(byId.get(id) || []), preuve]);
  });

  return byId;
};
