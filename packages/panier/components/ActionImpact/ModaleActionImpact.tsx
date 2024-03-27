/* eslint-disable react/no-unescaped-entities */
import classNames from 'classnames';
import {ModaleActionImpactProps} from './types';
import {
  Badge,
  Button,
  Divider,
  InfoTooltip,
  Modal,
  ModalFooter,
  ModalFooterSection,
} from '@tet/ui';
import NiveauBudget from './NiveauBudget';
import LienExterneModale from './LienExterneModale';
import Markdown from '@components/Markdown';

/**
 * Modale action à impact du panier d'actions
 */

export const ModaleActionImpact = ({
  children,
  titre,
  thematiques,
  budget,
  description,
  miseEnOeuvre,
  ressources,
  rex,
  subventions,
  statut,
  panier,
  onToggleSelected,
  onUpdateStatus,
}: ModaleActionImpactProps) => {
  return (
    <Modal
      size="lg"
      title={titre}
      textAlign="left"
      render={() => (
        <div>
          {/* Badges thématiques */}
          {!!thematiques.length && (
            <div className="flex gap-4 flex-wrap mb-6">
              {thematiques.map(theme => (
                <Badge
                  key={theme.id}
                  title={theme.nom}
                  size="sm"
                  state="standard"
                />
              ))}
            </div>
          )}

          {/* Description */}
          <Markdown content={description} className="paragraphe-18 mb-8" />

          {/* Temps de mise en oeuvre */}
          <p className="text-base text-primary-10 font-bold mb-8">
            Temps de mise en oeuvre :{' '}
            <span className="text-primary-8">
              {miseEnOeuvre?.nom.toLowerCase() ?? 'non estimé'}
            </span>
            <InfoTooltip
              activatedBy="click"
              className="ml-2"
              label={
                <div className="w-52 !font-normal flex flex-col gap-3 p-1">
                  <div>
                    Temps estimatif correspondant au déploiement de l’action une
                    fois celle-ci validée, de son démarrage à ses premières
                    réalisations.
                  </div>
                  <div>
                    Cette temporalité peut varier en fonction des priorisations,
                    des moyens et des ressources disponibles.
                  </div>
                  <Button
                    variant="underlined"
                    size="xs"
                    className="!text-info-1 !border-info-1"
                    href="https://www.territoiresentransitions.fr/"
                    external
                  >
                    En savoir plus
                  </Button>
                </div>
              }
            />
          </p>

          {/* Estimation budgétaire */}
          <p className="text-base text-primary-10 font-bold mb-8">
            Estimation budgétaire :{' '}
            <span className="text-primary-8">
              {budget?.nom.toLowerCase() ?? 'non estimé'}
            </span>
            <InfoTooltip
              activatedBy="click"
              className="ml-2"
              label={
                <div className="w-52 !font-normal flex flex-col gap-3 p-1">
                  <div>
                    Estimation budgétaire HT (investissement et fonctionnement,
                    hors subvention).
                  </div>
                  <div>
                    Une évaluation précise du budget sera à réaliser lors du
                    dimensionnement exacte de l’action.
                  </div>
                  <Button
                    variant="underlined"
                    size="xs"
                    className="!text-info-1 !border-info-1"
                    href="https://www.territoiresentransitions.fr/"
                    external
                  >
                    En savoir plus
                  </Button>
                </div>
              }
            />
          </p>

          {/* Ressources externes */}
          {!!ressources && ressources.length > 0 && (
            <div className="flex gap-x-8 gap-y-3 flex-wrap pb-8">
              {ressources.map(r => (
                <LienExterneModale key={r.label} {...r} />
              ))}
            </div>
          )}

          <Divider className="mt-4" />

          {/* REX */}
          <div className="mt-2">
            <h6 className="text-primary-10 text-base font-bold">
              D’autres collectivités l’ont fait :
            </h6>
            <div className="flex gap-x-8 gap-y-3 flex-wrap pb-8">
              {!rex || rex.length === 0 ? (
                <span className="text-sm text-grey-7">
                  Exemples d'autres collectivités à venir
                </span>
              ) : (
                rex.map(r => <LienExterneModale key={r.label} {...r} />)
              )}
            </div>
          </div>

          {/* Subventions mobilisables */}
          <div className="mt-2">
            <h6 className="text-primary-10 text-base font-bold">
              Subventions mobilisables :{' '}
              <InfoTooltip
                activatedBy="click"
                className="ml-1"
                label={
                  <div className="w-52 !font-normal flex flex-col gap-3 p-1">
                    <div>
                      De nombreux programmes d’aides nationaux et locaux peuvent
                      vous permettre de financer ou d’accompagner vos projets.
                    </div>
                    <div>
                      Les liens directs vers les programmes concernés seront
                      prochainement disponibles sur la plateforme.
                    </div>
                  </div>
                }
              />
            </h6>
            <div className="flex gap-x-8 gap-y-3 flex-wrap">
              <LienExterneModale
                label="Aides territoires"
                url="https://aides-territoires.beta.gouv.fr"
              />
              {!!subventions &&
                subventions.length > 0 &&
                subventions.map(s => (
                  <LienExterneModale key={s.label} {...s} />
                ))}
            </div>
          </div>
        </div>
      )}
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
