## Les méta données d'une action

Ces méta données permettent de stocker des choses relative à une collectivité *et* à une action, elles sont rattachées :
- à une action via `action_id` qui est égal à l'`id` d'une [action](action.md).
- à une epci via `epci_id` qui est égal à l'`id` d'une [EPCI](epci.md).

Elles sont stockées à l'adresse `epci_id/action_id`

Pour l'instant ces méta données stockent un commentaire à la clé "commentaire" de l'objet meta.

| nom de la meta  | description |
| --------------- | ----------- |
| 'commentaire'   | Permet de stocker un commentaire lié à l'action |

```yaml
ActionMeta:
  action_id:
      type: String
  epci_id:
      type: String
  meta:
      type: Dict
```
