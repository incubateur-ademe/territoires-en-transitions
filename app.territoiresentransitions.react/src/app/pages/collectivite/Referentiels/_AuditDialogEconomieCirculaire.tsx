import {Checkbox} from 'material-ui';
import * as R from 'ramda';

const auditCheckListsEci = {
  'Faire acte de candidature': [
    "Le courrier d'acte de candidature (motivation et palier visé, précision des compétences, engagement à améliorer de façon continue sa politique ECi, identité et coordonnées du référent technique)",
    'Le règlement du label signé',
    'Les derniers statuts approuvés par l’autorité préfectorale ou arrêté préfectoral portant création de l’EPCI',
    "Éventuellement la délibération d'engagement dans le processus de labellisation",
  ],
  'Avoir un score minimal sur certaines sous-actions': [
    '100% à la sous-action 1.1.1',
    'Au moins 20% aux sous-actions 1.1.2 et 1.1.3',
    "100% à la sous-action 3.2.0 (si le montant annuel d'achats de la collectivité est supérieur à 100 millions d'€)",
    "100% aux sous-actions 2.1.0, 2.2.0, 2.3.0 et 4.1.0 (c'est-à-dire respecter la règlementation si l'EPCI est concernée dans le cadre des compétences exercées)",
  ],
  'Fournir les preuves attendues pour justifier les scores': [
    'Se référer à la rubrique "preuve" des différentes tâches',
  ],
};

const _UiCheckbox = (props: {label: string}) => (
  <div className="flex gap-2 items-center">
    <Checkbox color="primary" /> {props.label}
  </div>
);

export const AuditDialogEconomieCirculaire = () => (
  <div>
    <div className="text-center fr-h3 -mt-4">ÉCONOMIE CIRCULAIRE</div>
    <div className="mt-6 flex  flex-col gap-4">
      <div className="text-xl">
        Pour pouvoir faire une demande d'audit, il faut :
      </div>
      {R.keys(auditCheckListsEci).map(checkListTitle => (
        <div>
          <div className="font-semibold text-xl mb-4">{checkListTitle}</div>
          <div className="flex flex-col gap-4">
            {auditCheckListsEci[checkListTitle].map(checkListItem => (
              <_UiCheckbox label={checkListItem} />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
