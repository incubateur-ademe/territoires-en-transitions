import {Categorie, PlanActionTyped} from 'types/PlanActionTypedInterface';
import {LabeledTextInput} from 'ui';
import React, {useState} from 'react';

export function CategoryForm(props: {
  plan: PlanActionTyped;
  categorie: Categorie;
  onSave: () => void;
}) {
  const categorie = props.categorie;
  const [nom, setNom] = useState<string>(categorie.nom);

  const handleSave = async () => {
    if (!nom) return;
    // todo
  };

  return (
    <div>
      <LabeledTextInput
        label="Nom de la catégorie"
        maxLength={100}
        value={nom}
        onChange={event => {
          setNom(event.target.value);
        }}
      />
      <div className="flex flex-row-reverse p-5">
        <button
          className="fr-btn"
          onClick={e => {
            e.preventDefault();
            handleSave();
          }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
