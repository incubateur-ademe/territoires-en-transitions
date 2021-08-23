import {FicheActionCategorieInterface} from 'generated/models/fiche_action_categorie';
import React, {useState} from 'react';
import {FicheActionCategorieStorable} from 'storables/FicheActionCategorieStorable';
import {ficheActionCategorieStore} from 'core-logic/api/hybridStores';
import {LabeledTextInput} from 'ui';

export function CategoryForm(props: {
  categorie: FicheActionCategorieInterface;
  onSave: () => void;
}) {
  const categorie = props.categorie;
  const [nom, setNom] = useState<string>(categorie.nom);

  const handleSave = async () => {
    if (!nom) return;
    const storable = new FicheActionCategorieStorable({...categorie, nom: nom});
    await ficheActionCategorieStore.store(storable);
    props.onSave();
  };

  return (
    <div>
      <LabeledTextInput
        label="Nom de la categorie"
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
