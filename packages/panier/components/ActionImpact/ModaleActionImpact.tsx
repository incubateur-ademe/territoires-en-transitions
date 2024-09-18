import classNames from 'classnames';
import {ModaleActionImpactProps} from './types';
import {
  Button,
  Modal,
  ModalFooter,
  ModalFooterSection,
  InfoActionImpact,
} from '@tet/ui';
import Markdown from '@tet/panier/components/Markdown';

/**
 * Modale action à impact du panier d'actions
 */
export const ModaleActionImpact = (props: ModaleActionImpactProps) => {
  const {
    children,
    titre,
    description,
    statut,
    panier,
    onToggleSelected,
    onUpdateStatus,
  } = props;

  return (
    <Modal
      size="lg"
      title={titre}
      textAlign="left"
      render={() => {
        return (
          <InfoActionImpact
            action={{...props}}
            descriptionMarkdown={
              <Markdown
                content={description}
                className="paragraphe-18 mb-8 [&_ul]:list-disc [&_ul]:pl-8"
              />
            }
          />
        );
      }}
      renderFooter={({close}) => (
        <ModalFooter variant="space">
          <ModalFooterSection>
            <Button
              variant="outlined"
              className={classNames({
                'bg-primary-2': statut === 'en_cours',
              })}
              onClick={() => {
                onUpdateStatus?.('en_cours');
                close();
              }}
            >
              En cours
            </Button>
            <Button
              variant="outlined"
              className={classNames({
                'bg-primary-2': statut === 'realise',
              })}
              onClick={() => {
                onUpdateStatus?.('realise');
                close();
              }}
            >
              Réalisée
            </Button>
          </ModalFooterSection>
          <Button
            icon={panier ? 'file-reduce-fill' : 'file-add-fill'}
            onClick={() => {
              onToggleSelected(!panier);
              close();
            }}
          >
            {panier ? 'Retirer du panier' : 'Ajouter au panier'}
          </Button>
        </ModalFooter>
      )}
    >
      {children}
    </Modal>
  );
};
