## ECPI de test

La liste des EPCIs qui servent à la phase de test avec certaines personnes primo-utilisatrices.

Sert à afficher les boutons sur la page d'accueil. L'ordre de l'affichage est le même que celui du bloc yaml.

La clé `test` de `test: 'Ville de test` représente notamment l'endroit ou le stockage à lieu en local. Il ne faut pas utiliser de caractères spéciaux pour les clés.
Il ne faut pas changer `test` non plus car c'est la clé par default.

```yaml
epcis_default:
  test: 'Ville de test'
  clunisois: "CC du Clunisois"
  haut_poitou: "CC Haut Poitou"
  pays_rethelois: "CC Pays Rethélois"
  pyrenees_gaves: "CC Pyrénées Vallées des Gaves"
  touraine_est: "CC Touraine-Est Vallées"
  doubs_baumois: "CC Doubs Baumois"
```
