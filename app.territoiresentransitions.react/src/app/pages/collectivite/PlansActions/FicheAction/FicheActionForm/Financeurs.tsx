import FormField from 'ui/shared/form/FormField';
import SelectCreateTagsDropdown from 'ui/shared/select/SelectCreateTagsDropdown';
import {TOption} from 'ui/shared/select/commons';
import {useFinanceurListe} from '../data/options/useFinanceurListe';
import {formatNewTag} from '../data/utils';
import FicheActionFormBudgetInput from './FicheActionFormBudgetInput';
import {FicheAction, Financeur} from '../data/types';

type Props = {
  fiche: FicheAction;
  onUpdate: (newFiche: FicheAction) => void;
  isReadonly: boolean;
};

const Financeurs = ({fiche, onUpdate, isReadonly}: Props) => {
  const {data: financeurTagListe} = useFinanceurListe();

  // On invalide la liste des options dans useEditFicheAction
  const options: TOption[] = financeurTagListe
    ? financeurTagListe.map(financeur => ({
        value: financeur.id?.toString(),
        label: financeur.nom,
      }))
    : [];

  /** Cette fonction est utilisée aussi bien pour mettre à jour un tag financeur que le montant associé */
  const updateFinanceur = (newFinanceur: Financeur) => {
    // Si le financeur existe déjà (il a un id) et que la fiche à déjà des financeurs,
    // on le remplace dans la liste de financeurs
    if (newFinanceur.id && fiche.financeurs) {
      onUpdate({
        ...fiche,
        financeurs: fiche.financeurs.map((f: Financeur) =>
          f.id === newFinanceur.id ? newFinanceur : f
        ),
      });
    }
    // Si l'utilisateur crée un nouveau financeur,
    // on l'ajoute
    else {
      onUpdate({
        ...fiche,
        financeurs: [...(fiche.financeurs ?? []), newFinanceur],
      });
    }
  };

  /** Gère la sélection / déselection des tags */
  const onSelect = (values: string[], financeur?: Financeur) => {
    // Si on sélectionne un tag
    if (values && values.length > 0 && financeurTagListe) {
      // On récupère uniquement le dernier financeur sélectionné
      // comme on ne peut sélectionner qu'une valeur à la fois.
      const financeur_tag = financeurTagListe.find(
        f => f.id === parseInt(values[values.length - 1])
      );

      financeur_tag && updateFinanceur({...financeur, financeur_tag});
    }
    // Si on désélectionne un tag,
    // on supprime directement tout le financeur de la fiche
    else {
      onUpdate({
        ...fiche,
        financeurs:
          fiche.financeurs?.filter((f: Financeur) => f.id !== financeur!.id) ??
          null,
      });
    }
  };

  return (
    <div>
      {/** Liste des financeurs */}
      {fiche.financeurs?.map((financeur: Financeur, i) => (
        <div key={financeur.id} className="grid grid-cols-2 gap-4">
          <FormField label={`Financeur ${i + 1}`}>
            <SelectCreateTagsDropdown
              // On affiche une seule valeur
              values={
                financeur.financeur_tag.id
                  ? [financeur.financeur_tag.id?.toString()]
                  : []
              }
              options={options}
              onSelect={values => onSelect(values, financeur)}
              disabled={(financeur.financeur_tag && true) || isReadonly}
              onCreateClick={() => null}
            />
          </FormField>
          <FormField label={`Montant engagé financeur ${i + 1}`}>
            <div className="mt-4">
              <FicheActionFormBudgetInput
                budget={financeur.montant_ttc ?? null}
                onBlur={e => {
                  if (financeur.montant_ttc) {
                    parseInt(e.target.value) !== financeur.montant_ttc &&
                      updateFinanceur({
                        ...financeur,
                        montant_ttc: parseInt(e.target.value),
                      });
                  } else {
                    e.target.value.length > 0 &&
                      updateFinanceur({
                        ...financeur,
                        montant_ttc: parseInt(e.target.value),
                      });
                  }
                }}
                disabled={isReadonly}
              />
            </div>
          </FormField>
        </div>
      ))}
      {/** Champ ajout d'un nouveau financeur */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <FormField label="Ajouter un financeur">
          <SelectCreateTagsDropdown
            options={options}
            onSelect={values => onSelect(values)}
            onCreateClick={inputValue =>
              updateFinanceur({
                financeur_tag: formatNewTag(inputValue, fiche.collectivite_id!),
              })
            }
            placeholderText="Sélectionnez ou créez un tag"
            disabled={isReadonly}
          />
        </FormField>
      </div>
    </div>
  );
};

export default Financeurs;
