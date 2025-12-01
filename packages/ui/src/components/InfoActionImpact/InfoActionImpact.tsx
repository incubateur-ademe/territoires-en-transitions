import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactStatut,
  ActionImpactTempsMiseEnOeuvre,
  ActionImpactThematique,
} from '@tet/api';
import { Badge } from '../../design-system/Badge';
import { Button } from '../../design-system/Button';
import { Divider } from '../../design-system/Divider';
import { InfoTooltip } from '../../design-system/Tooltip';

const URL_AIDES_TERRITOIRES = 'https://aides-territoires.beta.gouv.fr';

type LinkType = {
  url: string;
  label: string;
};

export type ActionImpactDetail = {
  /** Titre de l'action à impact */
  titre: string;
  /** Thématiques de l'action à impact */
  thematiques: ActionImpactThematique[];
  /** Budget de la mise en place de l'action : petit, moyen ou élevé */
  budget?: ActionImpactFourchetteBudgetaire;
  /** Description de l'action à impact */
  description: string;
  /** Temps de mise en oeuvre */
  miseEnOeuvre?: ActionImpactTempsMiseEnOeuvre;
  /** Lien vers les ressources externes */
  ressources?: LinkType[] | null;
  /** Lien vers les retours d'expérience */
  rex?: LinkType[] | null;
  /** Lien vers les subventions mobilisables */
  subventions?: LinkType[] | null;
  /** Statut de l'action */
  statut?: ActionImpactStatut;
};

type InfoActionImpactProps = {
  /** Détail de l'action */
  action: ActionImpactDetail;
  /** Description de l'action à impact rendu depuis le contenu Markdown */
  descriptionMarkdown: React.JSX.Element;
  /** Styles additionnels */
  className?: string;
};

/**
 * Affiche les informations détaillées d'une action à impact
 */
export const InfoActionImpact = ({
  action,
  descriptionMarkdown,
  className,
}: InfoActionImpactProps) => {
  const { thematiques, budget, miseEnOeuvre, ressources, rex, subventions } =
    action;

  return (
    <div className={className}>
      {/* Badges thématiques */}
      {!!thematiques?.length && (
        <div className="flex gap-4 flex-wrap mb-6">
          {thematiques.map((theme) => (
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
      {descriptionMarkdown}

      {/* Temps de mise en oeuvre */}
      <p className="text-base text-primary-10 font-bold mb-8">
        Temps de mise en oeuvre :{' '}
        <span className="text-primary-8">
          {miseEnOeuvre?.nom.toLowerCase() ?? 'non estimé'}
        </span>
        <InfoTooltip
          activatedBy="click"
          iconClassName="ml-2"
          label={
            <div className="w-52 !font-normal flex flex-col gap-3 p-1">
              <div>
                Temps estimatif correspondant au déploiement de l’action une
                fois celle-ci validée, de son démarrage à ses premières
                réalisations.
              </div>
              <div>
                Cette temporalité peut varier en fonction des priorisations, des
                moyens et des ressources disponibles.
              </div>
              <Button
                variant="underlined"
                size="xs"
                className="!text-info-1 !border-info-1"
                href="https://aide.territoiresentransitions.fr/fr/article/en-savoir-plus-sur-les-criteres-du-panier-dactions-a-impact-b37tky/#1-temps-de-mise-en-oeuvre"
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
          iconClassName="ml-2"
          label={
            <div className="w-52 !font-normal flex flex-col gap-3 p-1">
              <div>
                Estimation budgétaire HT (investissement et fonctionnement, hors
                subvention).
              </div>
              <div>
                Une évaluation précise du budget sera à réaliser lors du
                dimensionnement exacte de l’action.
              </div>
              <Button
                variant="underlined"
                size="xs"
                className="!text-info-1 !border-info-1"
                href="https://aide.territoiresentransitions.fr/fr/article/en-savoir-plus-sur-les-criteres-du-panier-dactions-a-impact-b37tky/#1-estimation-des-ordres-de-grandeur-budgetaires"
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
          {ressources.map((r, i) => (
            <Button key={i} href={r.url} variant="underlined" external>
              {r.label}
            </Button>
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
            rex.map((r, i) => (
              <Button key={i} href={r.url} variant="underlined" external>
                {r.label}
              </Button>
            ))
          )}
        </div>
      </div>

      {/* Subventions mobilisables */}
      <div className="mt-2">
        <h6 className="text-primary-10 text-base font-bold">
          Subventions mobilisables :{' '}
          <InfoTooltip
            activatedBy="click"
            iconClassName="ml-1"
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
          <Button href={URL_AIDES_TERRITOIRES} variant="underlined" external>
            Aides territoires
          </Button>
          {!!subventions &&
            subventions.length > 0 &&
            subventions.map(
              (s, i) =>
                s.url &&
                s.url !== URL_AIDES_TERRITOIRES &&
                s.url !== `${URL_AIDES_TERRITOIRES}/` && (
                  <Button key={i} href={s.url} variant="underlined" external>
                    {s.url}
                  </Button>
                )
            )}
        </div>
      </div>
    </div>
  );
};
