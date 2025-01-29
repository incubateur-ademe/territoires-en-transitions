import { Indicateurs } from '@/api';
import BadgeIndicateurPerso from '@/app/app/pages/collectivite/Indicateurs/components/BadgeIndicateurPerso';
import IndicateurDetailChart from '@/app/app/pages/collectivite/Indicateurs/Indicateur/detail/IndicateurDetailChart';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { ToolbarIconButton } from '@/app/ui/buttons/ToolbarIconButton';
import { BadgeACompleter } from '@/app/ui/shared/Badge/BadgeACompleter';
import TextareaControlled from '@/app/ui/shared/form/TextareaControlled';
import { Field, Input, Modal, ModalFooterOKCancel } from '@/ui';
import { useState } from 'react';
import { HeaderIndicateur } from './detail/HeaderIndicateur';
import { IndicateurInfoLiees } from './detail/IndicateurInfoLiees';
import { IndicateurValuesTabs } from './detail/IndicateurValuesTabs';
import { FichesActionLiees } from './FichesActionLiees';
import { useExportIndicateurs } from './useExportIndicateurs';
import { useIndicateurDefinition } from './useIndicateurDefinition';
import { useDeleteIndicateurPerso } from './useRemoveIndicateurPerso';
import { useUpdateIndicateurDefinition } from './useUpdateIndicateurDefinition';

/** Affiche le détail d'un indicateur personnalisé */
const IndicateurPersonnaliseBase = ({
  definition,
}: {
  definition: Indicateurs.domain.IndicateurDefinition;
}) => {
  const { description, unite, titre, rempli } = definition;
  const { mutate: updateDefinition } = useUpdateIndicateurDefinition();
  const collectivite = useCurrentCollectivite();
  const isReadonly = !collectivite || collectivite?.isReadOnly;
  const { mutate: exportIndicateurs, isLoading } = useExportIndicateurs(
    'app/indicateurs/perso',
    [definition]
  );

  // génère les fonctions d'enregistrement des modifications
  const handleUpdate = (
    name: 'description' | 'commentaire' | 'unite' | 'titre',
    value: string
  ) => {
    const collectivite_id = collectivite?.collectiviteId;
    const nouveau = value?.trim();
    if (collectivite_id && nouveau !== definition[name]) {
      updateDefinition({ ...definition, [name]: nouveau });
    }
  };

  /**
   * TEMPORARY: currently, description input feeds two columns:
   * `description` column in `indicateur_definition`
   * `commentaire` column in `indicateur_collectivite` (via the hardcoded ['commentaire'] prop).
   * This is step 2 of expand and contract pattern
   * (https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern).
   *
   * Next step: remove this function and change
   * handleUpdate('description', e.target.value) to handleUpdate('commentaire', e.target.value).
   *
   * Related to this PR: https://github.com/incubateur-ademe/territoires-en-transitions/pull/3313.
   */
  const TEMPORARY_handleDescriptionUpdate = (value: string) => {
    const trimmedValue = value.trim();
    updateDefinition({
      ...definition,
      description: trimmedValue,
      commentaire: trimmedValue,
    });
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const { mutate: deleteIndicateurPerso } = useDeleteIndicateurPerso(
    definition.id
  );

  const [uniteInput, setUniteInput] = useState(unite);

  return (
    <>
      <HeaderIndicateur
        title={titre}
        isReadonly={isReadonly}
        onUpdate={(value) => handleUpdate('titre', value)}
      />
      <div className="px-10 py-6">
        <div className="flex flex-row items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BadgeACompleter a_completer={!rempli} />
            <BadgeIndicateurPerso />
          </div>
          <div>
            <ToolbarIconButton
              className="fr-mr-1w"
              disabled={isLoading}
              icon="download"
              title="Exporter"
              onClick={() => exportIndicateurs()}
            />
            {!isReadonly && (
              <ToolbarIconButton
                className="fr-mr-1w text-error-1"
                disabled={isLoading}
                icon="delete"
                title="Supprimer"
                aria-label="Supprimer"
                onClick={() => setShowConfirm(true)}
              />
            )}
          </div>
        </div>

        <IndicateurDetailChart className="mb-10" definition={definition} />

        <IndicateurValuesTabs definition={definition} />
        <div className="flex flex-col gap-8 mt-10">
          <Field title="Description et méthodologie de calcul">
            <TextareaControlled
              data-test="desc"
              className="fr-input fr-mt-1w !outline-none"
              initialValue={description}
              readOnly={isReadonly}
              disabled={isReadonly}
              onBlur={(e) => TEMPORARY_handleDescriptionUpdate(e.target.value)}
            />
          </Field>
          <IndicateurInfoLiees definition={definition} />
          <FichesActionLiees definition={definition} />
          <Field title="Unité">
            <Input
              type="text"
              value={uniteInput}
              onChange={(e) => setUniteInput(e.target.value)}
              onBlur={(e) => handleUpdate('unite', e.target.value)}
              disabled={isReadonly}
            />
          </Field>
        </div>
        <ScrollTopButton className="fr-mt-4w" />
      </div>
      {showConfirm && (
        <Modal
          openState={{ isOpen: showConfirm, setIsOpen: setShowConfirm }}
          title={`Suppression indicateur "${definition.titre}"`}
          description="Êtes-vous sûr de vouloir supprimer cet indicateur personnalisé ? Vous perdrez définitivement les données associées à cet indicateur."
          renderFooter={({ close }) => (
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
