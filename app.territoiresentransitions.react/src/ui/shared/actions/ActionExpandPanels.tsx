import {addTargetToContentAnchors} from 'utils/content';
import {
  CrossExpandPanelWithHtmlContent,
  CrossExpandPanelWithNode,
} from 'ui/shared/CrossExpandPanelWithHtmlContent';
import {
  useActionContexte,
  useActionExemples,
  useActionPreuve,
  useActionResources,
} from 'core-logic/hooks/referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionPreuvePanel} from './ActionPreuvePanel';

const ActionExpandPanelAdemeContent = (props: {
  content?: string;
  title: string;
}) => {
  if (!props.content) return <></>;
  return (
    <div className="ActionExpandPanelAdemeContent">
      <div className="border-gray-300">
        <CrossExpandPanelWithHtmlContent
          title={props.title}
          content={addTargetToContentAnchors(props.content)}
        />
      </div>
    </div>
  );
};

export const ActionContexteExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const contexte = useActionContexte(action.id);

  return (
    <ActionExpandPanelAdemeContent
      content={contexte}
      title="Contexte et réglementation"
    />
  );
};

export const ActionExemplesExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const exemples = useActionExemples(action.id);
  return <ActionExpandPanelAdemeContent content={exemples} title="Exemples" />;
};

export const ActionPreuvesExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const preuve = useActionPreuve(action.id);
  // console.log({preuve});
  const PREUVE_TMP = {
    title: 'Fiches de poste des membres de l’équipe mises à jour ',
    info: 'Si l’élaboration d’une politique Économie circulaire a fait l’objet d’un travail spécifique, fournir le document le plus récent démontrant l’existence de celle-ci : Plan/Programme/Convention issue d’un Contrat de transition écologique, d’un CODEC, etc.',
    files: [
      {pathName: 'un-fichier.pdf'},
      {pathName: 'un-autre.doc', comment: 'mon commentaire'},
    ],
  };
  return (
    <div className="ActionExpandPanelAdemeContent">
      <div className="border-gray-300">
        <CrossExpandPanelWithNode title="Preuves">
          <ActionPreuvePanel preuve={PREUVE_TMP} />
        </CrossExpandPanelWithNode>
      </div>
    </div>
  );
};

export const ActionRessourcesExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const ressources = useActionResources(action.id);

  return (
    <ActionExpandPanelAdemeContent content={ressources} title="Ressources" />
  );
};
