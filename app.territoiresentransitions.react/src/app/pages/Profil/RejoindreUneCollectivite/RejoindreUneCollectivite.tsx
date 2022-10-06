import {useEffect, useState} from 'react';
import {Form, Formik} from 'formik';
import * as Yup from 'yup';

import FormSelect from 'ui/shared/form/FormSelect';
import FormAutoCompleteInput from 'ui/shared/form/FormAutoCompleteInput';
import Aide from './Aide';

import {AllCollectiviteRead} from 'generated/dataLayer';
import {useFilterCollectivites} from 'core-logic/hooks/useFilterCollectivites';
import {useClaimCollectivite} from 'core-logic/hooks/useClaimCollectivite';
import {
  getReferentContacts,
  ReferentContact,
} from 'core-logic/api/procedures/collectiviteProcedures';
import {MembreFonction} from 'generated/dataLayer/membres';
import {collectiviteFonctionOptions} from './data';
import CollectiviteSelectionee from './CollectiviteSelectionee';
import Success from './Success';

/** Schéma de validation du formulaire */
const formValidation = Yup.object({
  fonction: Yup.string().required('Champ requis'),
  collectiviteId: Yup.string().required('Champ requis'),
});

/** Props */
type FormProps = {fonction: MembreFonction; collectiviteId: string};

type RejoindreUneCollectiviteProps = {
  filteredCollectivites: AllCollectiviteRead[];
  isCollectivitesLoading: boolean;
  setSearch: (search: string) => void;
  getReferentContacts: (collectiviteId: number) => Promise<ReferentContact[]>;
};

/** Composant */
export const RejoindreUneCollectivite = ({
  filteredCollectivites,
  isCollectivitesLoading,
  setSearch,
  getReferentContacts,
}: RejoindreUneCollectiviteProps) => {
  /** Formate la liste des collectivités à afficher dans le select de l'auto complete */
  const listeCollectivites =
    filteredCollectivites.length > 0
      ? filteredCollectivites.map((collectiviteRead: AllCollectiviteRead) => {
          return {
            value: collectiviteRead.collectivite_id.toString(),
            label: collectiviteRead.nom,
          };
        })
      : [];

  /** Permet récupérer le/les référents d'une collectivité et d'afficher son statut */
  const [selectedCollectivite, setSelectedCollectivite] =
    useState<AllCollectiviteRead>();

  /** Stock les référents à chaque changement de collectivité sélectionnée */
  const [referentContacts, setReferentContacts] = useState<ReferentContact[]>(
    []
  );

  useEffect(() => {
    if (selectedCollectivite) {
      getReferentContacts(selectedCollectivite.collectivite_id).then(
        contacts => {
          setReferentContacts(contacts);
        }
      );
    }
  }, [selectedCollectivite?.collectivite_id]);

  /** À donner à l'auto complete pour update la collectivité sélectionnée */
  const onAutocompleteSelectChange = (collectiviteId?: string) => {
    if (!collectiviteId) {
      setSelectedCollectivite(undefined);
      return;
    }

    const parsedCollectiviteId = parseInt(collectiviteId);

    if (parsedCollectiviteId !== selectedCollectivite?.collectivite_id) {
      setSelectedCollectivite(
        filteredCollectivites.find(
          c => c.collectivite_id === parsedCollectiviteId
        )
      );
    }
  };

  /**
   * À donner à l'auto complete pour trigger un nouveau fetch des collectivités
   * en fonction de la saisie utilisateur.
   */
  const onAutocompleteInputChange = (inputValue: string) => {
    setSearch(inputValue);
  };

  /** Hook pour activer une collectivité et afficher les bonnes étapes du formulaire */
  const {
    claimCollectivite,
    isSuccess: isClaimSuccess,
    reset: claimReset,
  } = useClaimCollectivite();

  /** Soumission du formulaire uniquement pour l'activation d'une collectivité */
  const handleFormSubmit = (values: FormProps) => {
    if (selectedCollectivite) {
      claimCollectivite(parseInt(values.collectiviteId));
    }
  };

  return (
    <div data-test="RejoindreUneCollectivite">
      <h1 className="!mb-8 md:!mb-14">Rejoindre une collectivité</h1>
      <div className="p-4 md:p-14 lg:px-24 bg-gray-100">
        <Formik
          initialValues={{fonction: 'conseiller', collectiviteId: ''}}
          validationSchema={formValidation}
          onSubmit={handleFormSubmit}
        >
          {({isSubmitting, submitForm, setFieldValue, resetForm}) => (
            <div data-test="formulaire-RejoindreUneCollectivite">
              {!isClaimSuccess ? (
                <>
                  <Form>
                    <FormSelect
                      data-test="SelectFonction"
                      name="fonction"
                      label="Fonction principale"
                      hint="Quel est votre rôle au sein ou auprès de la collectivité ?"
                      options={collectiviteFonctionOptions}
                    />
                    <FormAutoCompleteInput
                      name="collectiviteId"
                      label="Quelle collectivité souhaitez-vous rejoindre ?"
                      hint="Recherchez par nom"
                      isLoading={isCollectivitesLoading}
                      options={listeCollectivites}
                      setFieldValue={setFieldValue}
                      onSelectChange={onAutocompleteSelectChange}
                      onInputChange={onAutocompleteInputChange}
                      inputDebounceDelay={500}
                    />
                  </Form>
                  {selectedCollectivite && (
                    <CollectiviteSelectionee
                      selectedCollectiviteId={
                        selectedCollectivite.collectivite_id
                      }
                      referentContacts={referentContacts}
                      submitForm={submitForm}
                      isSubmitting={isSubmitting}
                    />
                  )}
                  <Aide />
                </>
              ) : (
                selectedCollectivite && (
                  <Success
                    collectivite={selectedCollectivite}
                    handleResetForm={() => {
                      claimReset();
                      setSelectedCollectivite(undefined);
                      resetForm();
                    }}
                  />
                )
              )}
            </div>
          )}
        </Formik>
      </div>
    </div>
  );
};

/**
 * Composant connecté
 */
const RejoindreUneCollectiviteConnected = () => {
  const [search, setSearch] = useState('');
  const {filteredCollectivites, isLoading} = useFilterCollectivites({search});

  return (
    <RejoindreUneCollectivite
      filteredCollectivites={filteredCollectivites}
      isCollectivitesLoading={isLoading}
      setSearch={setSearch}
      getReferentContacts={getReferentContacts}
    />
  );
};

export default RejoindreUneCollectiviteConnected;
