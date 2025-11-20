import { COLLECTIVITE_SOURCE_ID } from '@tet/domain/indicateurs';
import { ScoreIndicatifType } from '@tet/domain/referentiels';
import { Field, FormSection, Input, Select } from '@tet/ui';
import { useEffect, useState } from 'react';
import {
  typeScoreToLabel,
  typeScoreToName,
  typeScoreToShortLabel,
} from './score-indicatif.labels';
import { ScoreIndicatifValeursIndicateur } from './score-indicatif.types';
import { useGetValeursUtilisables } from './use-get-valeurs-utilisables';

/**
 * Affiche les champs de sélection de la source/année/valeur à utiliser pour un
 * calcul de score indicatif
 */
export const ScoreIndicatifValeursUtilisees = ({
  selectionValeurs,
  openAddDataDlg,
}: {
  selectionValeurs: SelectionValeurIndicateur;
  openAddDataDlg: () => void;
}) => {
  if (!selectionValeurs) return;

  const {
    typeScore,
    optionsSources,
    optionsAnnees,
    valeurCourante,
    selection,
    setSelection,
  } = selectionValeurs;

  return (
    <FormSection
      className="grid-cols-1 md:grid-cols-[repeat(2,_1fr)_0.65fr]"
      title={`Informations sur les données utilisées pour le calcul du score ${typeScoreToName[typeScore]}`}
    >
      <Field
        title="Source"
        hint={`Sélectionner la source à utiliser pour le calcul du score "${typeScoreToName[typeScore]}"`}
      >
        <Select
          placeholder="Sélectionnez la source à utiliser"
          options={optionsSources}
          values={selection?.source}
          onChange={(value) =>
            setSelection({ source: value as string, id: null })
          }
          disabled={!optionsSources.length}
        />
      </Field>
      <Field
        title="Année utilisée"
        hint={`Sélectionner l'année à utiliser pour le calcul du score "${typeScoreToName[typeScore]}"`}
      >
        <Select
          placeholder={
            selection?.source
              ? 'Sélectionnez une année'
              : 'Sélectionnez la source à utiliser'
          }
          options={optionsAnnees}
          values={valeurCourante?.id ?? undefined}
          onChange={(id) => {
            if (id === ADD_DATA) {
              // affiche le dialogue de saisie des données
              openAddDataDlg();
            } else {
              return (
                selection &&
                setSelection({ ...selection, id: (id as number) ?? null })
              );
            }
          }}
          disabled={!optionsAnnees.length}
        />
      </Field>
      <Field
        title={typeScoreToShortLabel[typeScore]}
        hint="Valeur sélectionnée"
        className="justify-between"
      >
        <Input
          type="number"
          placeholder="Sélectionnez une année"
          value={valeurCourante?.valeur?.toString() ?? ''}
          disabled
        />
      </Field>
    </FormSection>
  );
};

// conserve l'état de la sélection pour les valeurs "résultat" et "objectif"
export const useSelectionValeurs = ({
  actionId,
  indicateurId,
}: {
  actionId: string;
  indicateurId: number;
}) => {
  const { data: valeursUtilisables } = useGetValeursUtilisables(
    actionId,
    indicateurId
  );

  return {
    fait: useSelectionValeurIndicateur(valeursUtilisables, 'fait'),
    programme: useSelectionValeurIndicateur(valeursUtilisables, 'programme'),
  };
};

type SelectionValeurIndicateur = ReturnType<
  typeof useSelectionValeurIndicateur
>;

// conserve l'état de la sélection pour une valeur ("résultat" ou "objectif")
const useSelectionValeurIndicateur = (
  valeursIndicateur: ScoreIndicatifValeursIndicateur | undefined,
  typeScore: ScoreIndicatifType
) => {
  const initialSelection = valeursIndicateur?.selection?.[typeScore] || null;
  const [selection, setSelection] = useState<{
    source: string;
    id: number | null;
  } | null>(initialSelection);

  useEffect(() => {
    setSelection(initialSelection);
  }, [initialSelection]);

  const sources = valeursIndicateur?.sources || [];

  const optionsSources = sources
    .filter((s) => s[typeScore].length > 0)
    .map((s) => ({
      label: s.libelle ?? typeScoreToLabel[typeScore],
      value: s.source,
    }));

  // la source "collectivité" est toujours affichée
  if (!optionsSources.find((s) => s.value === COLLECTIVITE_SOURCE_ID)) {
    optionsSources.push({
      label: typeScoreToLabel[typeScore],
      value: COLLECTIVITE_SOURCE_ID,
    });
  }

  const source = sources.find((s) => s.source === selection?.source);
  const valeurs = source?.[typeScore] || [];
  const optionsAnnees = valeurs.map((v) => ({
    label: v.annee.toString(),
    value: v.id,
  }));
  if (selection?.source === COLLECTIVITE_SOURCE_ID) {
    optionsAnnees.unshift({ label: 'Ajouter une année', value: ADD_DATA });
  }
  const valeurCourante = selection
    ? valeurs.find((v) => v.id === selection.id)
    : null;

  return {
    typeScore,
    optionsSources,
    optionsAnnees,
    selection,
    setSelection,
    valeurCourante,
  };
};

const ADD_DATA = -1;
