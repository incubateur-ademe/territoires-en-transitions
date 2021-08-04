## Fiche action

Représente une fiche action crée par une epci.
`epci_id/uid`

```yaml
FicheAction:
    epci_id:
        type: String
    uid:
        type: String
    custom_id:
        type: String
    avancement:
        type: String
    en_retard:
        type: bool
    referentiel_action_ids:
        type: List[String]
    referentiel_indicateur_ids:
        type: List[String]
    titre:
        type: String
    description:
        type: String
    budget:
        type: num
    personne_referente:
        type: String
    structure_pilote:
        type: String
    partenaires:
        type: String
    elu_referent:
        type: String
    commentaire:
        type: String
    date_debut:
        type: String
    date_fin:
        type: String
    indicateur_personnalise_ids:
        type: List[String]
```

## Avancement

L'avancement des fiches actions est représenté par les valeurs suivantes

```yaml
fiche_action_avancement_noms:
    non_concernee: 'Non concernée'
    programmee: 'Prévue'
    pas_faite: 'Pas faite'
    en_cours: 'En cours'
    faite: 'Faite'
```
