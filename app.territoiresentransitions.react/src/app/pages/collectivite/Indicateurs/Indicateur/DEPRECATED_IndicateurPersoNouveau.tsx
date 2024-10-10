// import {useCollectiviteId} from 'core-logic/hooks/params';
// import {
//   TIndicateurPersoDefinitionWrite,
//   useInsertIndicateurPersoDefinition,
// } from './useInsertIndicateurPersoDefinition';
// import {makeCollectiviteIndicateursUrl} from 'app/paths';
// import classNames from 'classnames';
// import {FicheAction} from '../../PlansActions/FicheAction/data/types';
// import {Form, Formik} from 'formik';
// import * as Yup from 'yup';
// import {TThematiqueRow} from 'types/alias';
// import {useState} from 'react';
// import FormikInput from 'ui/shared/form/formik/FormikInput';
// import FormField from 'ui/shared/form/FormField';
// import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';

// const validation = Yup.object({
//   titre: Yup.string()
//     .max(300, 'Ce champ doit faire au maximum 300 caractères')
//     .required('Un titre est requis'),
//   unite: Yup.string(),
//   description: Yup.string(),
// });

// /** Affiche la page de création d'un indicateur personnalisé  */
// const IndicateurPersoNouveau = ({
//   className,
//   fiche,
//   onClose,
// }: {
//   className?: string;
//   /** Fiche action à laquelle rattacher le nouvel indicateur */
//   fiche?: FicheAction;
//   onClose?: () => void;
// }) => {
//   const collectiviteId = useCollectiviteId()!;
//   const newDefinition = {
//     collectiviteId,
//     titre: '',
//     description: '',
//     unite: '',
//     commentaire: '',
//   };

//   const [thematiques, setThematiques] = useState<TThematiqueRow[]>(
//     fiche?.thematiques ?? []
//   );

//   const {mutate: save, isLoading} = useInsertIndicateurPersoDefinition({
//     onSuccess: indicateurId => {
//       // redirige vers la page de l'indicateur après la création
//       const url = makeCollectiviteIndicateursUrl({
//         collectiviteId,
//         indicateurView: 'perso',
//         indicateurId,
//       });
//       onClose?.();
//       window.open(url, '_blank');
//     },
//   });

//   const onSave = (definition: TIndicateurPersoDefinitionWrite) => {
//     save({definition: {...definition, thematiques}, ficheId: fiche?.id});
//   };

//   return (
//     <div className={classNames('fr-p-2w', className)}>
//       <h4>
//         <i className="fr-icon-line-chart-line fr-pr-2w" />
//         Créer un indicateur
//       </h4>
//       <Formik<TIndicateurPersoDefinitionWrite>
//         initialValues={newDefinition}
//         validateOnMount
//         validationSchema={validation}
//         onSubmit={onSave}
//       >
//         {({isValid}) => (
//           <Form>
//             <div className="bg-grey975 fr-py-7w fr-px-10w">
//               <p>
//                 Les indicateurs personnalisés vous permettent de suivre de
//                 manière spécifique les actions menées par votre collectivité.
//                 Associez-les à une ou plusieurs fiches action pour faciliter
//                 leur mise à jour !
//               </p>
//               <FormikInput name="titre" label="Nom de l’indicateur" />
//               <FormikInput name="unite" label="Unité" />
//               <FormikInput type="area" name="description" label="Description" />
//               <FormField className="fr-mt-4w" label="Thématique">
//                 <ThematiquesDropdown
//                   values={thematiques?.map(t => t.id)}
//                   onChange={({thematiques}) => setThematiques(thematiques)}
//                 />
//               </FormField>
//             </div>
//             <div className="flex flex-row justify-end gap-4 pt-5">
//               {onClose && (
//                 <button className="fr-btn fr-btn--secondary" onClick={onClose}>
//                   Annuler
//                 </button>
//               )}
//               <button
//                 className={classNames('fr-btn', {
//                   'fr-btn--icon-right fr-icon-arrow-right-line': !isLoading,
//                 })}
//                 data-test="ok"
//                 disabled={isLoading || !isValid}
//               >
//                 {isLoading
//                   ? 'Enregistrement en cours...'
//                   : 'Valider et compléter'}
//               </button>
//             </div>
//           </Form>
//         )}
//       </Formik>
//     </div>
//   );
// };

// export default IndicateurPersoNouveau;
