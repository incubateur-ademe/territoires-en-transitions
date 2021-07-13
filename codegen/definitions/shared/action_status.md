# Le statut d'une action

Le statuts d'une action permet à l'utilisateur de connaître le statuts de son avancement sur une action.


## Statut
Un status est rattaché
- à une action via `action_id` qui est égal à l'`id` d'une [action](action.md).
- à une epci via `epci_id` qui est égal à l'`id` d'une [EPCI](epci.md).

Un statuts a:
- un avancement
- une date de creation

Il est stocké en local à l'adresse `epci_id/action_id`

```yaml
ActionStatus:
  action_id:
      type: String
  epci_id:
      type: String
  valeur_selectionnee:
      type: String
      options: # pas implémenté
          - faite
          - programmee
          - pas_faite
          - non_concernee
```


