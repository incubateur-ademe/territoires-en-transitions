import {Form, Formik} from 'formik';

import Modal from 'ui/shared/floating-ui/Modal';
import FormikInput from 'ui/shared/form/formik/FormikInput';
import {ValiderButton} from 'ui/buttons/ValiderButton';

import {PlanNode} from '../data/types';
import {useEditAxe} from '../data/useEditAxe';

interface ModifierPlanProps {
  titre: string;
}

type Props = {
  children: JSX.Element;
  axe: PlanNode;
  isAxePage: boolean;
};

/**
 * Modale pour modifier le titre d'un axe.
 * Utilisée pour modifier aussi bien un plan qu'un sous-axe
 */
const ModifierPlanModale = ({children, axe, isAxePage}: Props) => {
  const {mutate: updateAxe} = useEditAxe(axe.id);

  return (
    <Modal
      render={({labelId, close}) => {
        return (
          <div data-test="ModifierPlanTitreModale" className="mt-2">
            <h4 id={labelId} className="fr-h4 text-center !mb-8">
              {isAxePage ? "Modifier l'axe" : 'Modifier le plan d’action'}
            </h4>
            <Formik<ModifierPlanProps>
              initialValues={{titre: axe.nom}}
              onSubmit={credentials => {
                updateAxe({...axe, nom: credentials.titre});
                close();
              }}
            >
              <Form>
                <FormikInput
                  data-test="PlanNomInput"
                  name="titre"
                  label="Nom du plan d'action"
                  placeholder="Sans titre"
                />
                <div className="mt-12 fr-btns-group fr-btns-group--right fr-btns-group--inline-lg">
                  <button
                    onClick={close}
                    className="fr-btn fr-btn--secondary"
                    aria-label="Annuler"
                  >
                    Annuler
                  </button>
                  <ValiderButton />
                </div>
              </Form>
            </Formik>
          </div>
        );
      }}
    >
      {children}
    </Modal>
  );
};

export default ModifierPlanModale;
