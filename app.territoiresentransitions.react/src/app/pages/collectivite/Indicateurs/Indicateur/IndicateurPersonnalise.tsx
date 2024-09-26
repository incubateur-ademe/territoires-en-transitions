import {useState} from 'react';
import {Field, Modal, ModalFooterOKCancel} from '@tet/ui';
import {BadgeACompleter} from 'ui/shared/Badge/BadgeACompleter';
import TextareaControlled from 'ui/shared/form/TextareaControlled';
import InputControlled from 'ui/shared/form/InputControlled';
import ScrollTopButton from 'ui/buttons/ScrollTopButton';
import {ToolbarIconButton} from 'ui/buttons/ToolbarIconButton';
import {useUpdateIndicateurPersoDefinition} from './useUpdateIndicateurPersoDefinition';
import {HeaderIndicateur} from './detail/HeaderIndicateur';
import {IndicateurValuesTabs} from './detail/IndicateurValuesTabs';
import {FichesActionLiees} from './FichesActionLiees';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {IndicateurInfoLiees} from './detail/IndicateurInfoLiees';
import {useIndicateurDefinition} from './useIndicateurDefinition';
import IndicateurDetailChart from 'app/pages/collectivite/Indicateurs/Indicateur/detail/IndicateurDetailChart';
import {useDeleteIndicateurPerso} from './useRemoveIndicateurPerso';
import {Indicateurs} from '@tet/api';
import BadgeIndicateurPerso from 'app/pages/collectivite/Indicateurs/components/BadgeIndicateurPerso';

/** Affiche le détail d'un indicateur personnalisé */
const IndicateurPersonnaliseBase = ({
  definition,
}: {
  definition: Indicateurs.domain.IndicateurDefinition;
}) => {
  const {description, unite, titre, rempli} = definition;
  const {mutate: updateDefinition} = useUpdateIndicateurPersoDefinition();
  const collectivite = useCurrentCollectivite();
  const isReadonly = !collectivite || collectivite?.readonly;

  // génère les fonctions d'enregistrement des modifications
  const handleUpdate = (
    name: 'description' | 'commentaire' | 'unite' | 'titre',
    value: string
  ) => {
    const collectivite_id = collectivite?.collectivite_id;
    const nouveau = value?.trim();
    if (collectivite_id && nouveau !== definition[name]) {
      /**
       * TEMPORARY: updating hardcoded commentaire prop, in order to link the description input
       * to the `commentaire` column in `indicateur_collectivite` 
       * -> step 2 of expand and contract pattern (
       * https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern)
       */
      updateDefinition({...definition, [name]: nouveau, ['commentaire']: nouveau});
    }
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const {mutate: deleteIndicateurPerso} = useDeleteIndicateurPerso(
    collectivite?.collectivite_id as number,
    definition.id
  );

  return (
    <>
      <HeaderIndicateur
        title={titre}
        isReadonly={isReadonly}
        onUpdate={value => handleUpdate('titre', value)}
      />
      <div className="px-10 py-6">
        <div className="flex flex-row items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BadgeACompleter a_completer={!rempli} />
            <BadgeIndicateurPerso />
          </div>

          {!isReadonly && (
            <ToolbarIconButton
              className="fr-mr-1w text-error-1"
              icon="delete"
              title="Supprimer"
              aria-label="Supprimer"
              onClick={() => setShowConfirm(true)}
            />
          )}
        </div>

        <IndicateurDetailChart
          definition={definition}
          rempli={definition.rempli}
          titre={definition.titre}
          fileName={definition.titre}
        />

        <IndicateurValuesTabs definition={definition} />
        <div className="flex flex-col gap-8 mt-10">
          <Field title="Description et méthodologie de calcul">
            <TextareaControlled
              data-test="desc"
              className="fr-input fr-mt-1w !outline-none"
              initialValue={description}
              readOnly={isReadonly}
              onBlur={e => handleUpdate('description', e.target.value)}
            />
          </Field>
          <IndicateurInfoLiees definition={definition} />
          <FichesActionLiees definition={definition} />
          <Field title="Unité">
            <InputControlled
              className="fr-input fr-mt-1w !outline-none"
              initialValue={unite}
              readOnly={isReadonly}
              onBlur={e => handleUpdate('unite', e.target.value)}
            />
          </Field>
        </div>
        <ScrollTopButton className="fr-mt-4w" />
      </div>
      {showConfirm && (
        <Modal
          openState={{isOpen: showConfirm, setIsOpen: setShowConfirm}}
          title={`Suppression indicateur "${definition.titre}"`}
          description="Êtes-vous sûr de vouloir supprimer cet indicateur personnalisé ? Vous perdrez définitivement les données associées à cet indicateur."
          renderFooter={({close}) => (
            <ModalFooterOKCancel
              btnCancelProps={{
                onClick: () => close(),
              }}
              btnOKProps={{
                'aria-label': 'Supprimer',
                children: 'Supprimer',
                onClick: () => {
                  deleteIndicateurPerso();
                  close();
                },
              }}
            />
          )}
        />
      )}
    </>
  );
};

/** Charge les données et affiche le détail d'un indicateur personnalisé */
export const IndicateurPersonnalise = ({
  indicateurId,
}: {
  indicateurId: number;
}) => {
  const definition = useIndicateurDefinition(indicateurId);
  if (!definition) return null;

  return <IndicateurPersonnaliseBase definition={definition} />;
};
