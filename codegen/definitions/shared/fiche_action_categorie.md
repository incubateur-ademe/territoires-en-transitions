## Catégorie fiches action
Représente la catégorie utilisée pour classer des fiches action d'une epci.
`epci_id/uid`

```yaml
FicheActionCategorie:
    epci_id:
        type: String
    uid:
        type: String
    parent_uid:
        type: List[String]
    titre:
        type: String
    fiche_actions_uids:
        type: List[String]
```
