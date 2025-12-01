import Markdown from '@/panier/components/Markdown';
import {
  Button,
  Card,
  InfoActionImpact,
  Modal,
  ModalFooter,
  ModalFooterSection,
} from '@tet/ui';
import classNames from 'classnames';
import { ModaleActionImpactProps } from './types';

const referentielToName: Record<string, string> = {
  cae: 'Climat Air Énergie',
  eci: 'Économie Circulaire',
};

/**
 * Modale action à impact du panier d'actions
 */
export const ModaleActionImpact = (props: ModaleActionImpactProps) => {
  const {
    children,
    actionsLiees,
    titre,
    typologie,
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
      subTitle={typologie?.nom}
      textAlign="left"
      render={() => {
        return (
          <>
            <InfoActionImpact
              action={{ ...props }}
              descriptionMarkdown={
                <Markdown
                  content={description}
                  className="paragraphe-18 mb-8 [&_ul]:list-disc [&_ul]:pl-8"
                />
              }
            />
            {!!actionsLiees?.length && (
              <div className="mt-4">
                <h6 className="text-primary-10 text-base font-bold">
                  Mesures des référentiels liés :
                </h6>
                <div className={'grid lg:grid-cols-2 xl:grid-cols-3 gap-3'}>
                  {actionsLiees.map(({ identifiant, nom, referentiel }) => (
                    <Card
                      key={identifiant}
                      className="h-full px-4 py-[1.125rem] !gap-3 text-grey-8 !shadow-none"
                    >
                      <span className="text-grey-8 text-sm font-medium">
                        Référentiel {referentielToName[referentiel]}
                      </span>

                      <span className="text-base font-bold text-primary-9">
                        {identifiant} {nom}
                      </span>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      }}
      renderFooter={({ close }) => (
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
