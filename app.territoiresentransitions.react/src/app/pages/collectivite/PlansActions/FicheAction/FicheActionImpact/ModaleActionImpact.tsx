import {Modal, InfoActionImpact} from '@tet/ui';
import {useActionImpact} from './useActionImpact';
import Markdown from 'ui/Markdown';

type ModaleActionImpactProps = {
  actionImpactId: number;
  children: React.JSX.Element;
};

/**
 * Affiche le descriptif d'une action à impact (du panier d'actions)
 */
export const ModaleActionImpact = (props: ModaleActionImpactProps) => {
  const {actionImpactId, children} = props;
  const {data: action} = useActionImpact(actionImpactId);

  if (!action) {
    return null;
  }

  const {titre, description} = action;
  return (
    <Modal
      size="lg"
      title={titre}
      textAlign="left"
      render={() => {
        return (
          <InfoActionImpact
            action={action}
            descriptionMarkdown={
              <Markdown
                content={description}
                className="paragraphe-18 mb-8 [&_ul]:list-disc [&_ul]:pl-8"
              />
            }
          />
        );
      }}
    >
      {children}
    </Modal>
  );
};
