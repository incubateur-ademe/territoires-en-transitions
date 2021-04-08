## Action personnalisée
Représente une fiche action crée pour une epci.
`epci_id/uid`

```yaml
FicheAction:
    epci_id:
        type: String
    uid:
        type: String
    custom_id:
        type: String
    referentiel_action_paths:
        type: List[String]
    titre:
        type: String
    description:
        type: String
    budget:
        type: num
    porteur:
        type: String
    commentaire:
        type: String
    date_debut:
        type: String
    date_fin:
        type: String
```
