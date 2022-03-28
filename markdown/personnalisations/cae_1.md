# Réduction potentiel cae 1.2.2 liee AOM
```yaml
action_id: cae_1.2.2
```
## Regles
### Réduction de potentiel
```formule
si reponse (AOM_1, NON) alors 6/12 
```
Pour une collectivité n'ayant pas la compétence AOM, le score de la 1.2.2 est réduit de 50 %.


# Réduction potentiel cae 1.2.2 liee centre urbain > 5000 hab
```yaml
action_id: cae_1.2.2
```
## Regles
### Réduction de potentiel
```formule
si identite(poulation, moins_de_5000) et reponse (AOM_1, NON) alors 2/12 
```
Pour une collectivité n'ayant pas de centre urbain de plus de 5000 habitants ET n'ayant pas la compétence AOM, le score de la 1.2.2 est réduit à 2 points.


# Réduction potentiel cae 1.2.3 liee competences dechets
```yaml
action_id: cae_1.2.3
```
## Regles
### Réduction de potentiel
```formule
si reponse(dechets_1, OUI) et reponse(dechets_2, OUI) et reponse(dechets_3, OUI) alors 1.0
sinon si reponse(dechets_1, NON) et reponse(dechets_2, NON) et reponse(dechets_3, NON) alors 2/12
sinon 0.75
```
Pour une collectivité ne possédant que partiellement les compétences collecte, traitement des déchets et plan de prévention des déchets, le score de la 1.2.3 est réduit de 25 %.

Pour une collectivité n'ayant aucune des compétences collecte, traitement des déchets et plan de prévention des déchets, le score de la 1.2.3 est réduit à 2 points.


# Réduction potentiel cae 1.2.4 liee habitat
```yaml
action_id: cae_1.2.4
```
## Regles
### Réduction de potentiel
```formule
si identite(type, EPCI) et reponse(habitat_1, NON) alors 8/12 
```
Pour un EPCI n'ayant pas la compétence habitat, le score de la 1.2.4 est réduit à 8 points.

# Réduction potentiel cae 1.2.4 liee habitat
```yaml
action_id: cae_1.2.4
```
## Regles
### Réduction de potentiel
```formule
si identite(type, commune) alors max (reponse(habitat_2), 0.5) 
```
Si la collectivité est une commune, le potentiel est réduit à la part de la commune dans la collectivité compétente en matière de Programme Local de l’Habitat (PLH), dans la limite de 50 %.


# Réduction potentiel cae 1.3.1 liee competence urba
```yaml
action_id: cae_1.3.1
```
## Regles
### Réduction de potentiel
```formule
si reponse(urba_1, NON) et reponse (SCOT, NON) alors 6/12 
```
Pour une collectivité n'ayant ni la compétence PLU, ni la compétence SCOT, le score de la 1.3.1 est réduit de 50 %.

# Réduction potentiel cae 1.3.1 liee competence urba
```yaml
action_id: cae_1.3.1
```
## Regles
### Réduction de potentiel
```formule
si reponse(urba_1, NON) et reponse (SCOT, OUI) alors 0.7 
```
Pour une collectivité n'ayant pas la compétence PLU mais disposant de la compétence SCOT, le score de la 1.3.1 est réduit de 30 %.


# Réduction potentiel cae 1.3.2 liee possession terrains
```yaml
action_id: cae_1.3.2
```
## Regles
### Réduction de potentiel
```formule
si reponse(amenagement_1, NON) ou si reponse (amenagement_2, NON) alors 5/10 
```
Si une collectivité n'a pas de terrains utilisables ou vendables ou si elle dispose de terrains de ce type mais n'a pas réalisé de vente ou de contrats d'utilisation alors le score de la 1.3.2 est réduit de 50 %.


# Réduction potentiel cae 1.3.3 liee competence urba
```yaml
action_id: cae_1.3.3
```
## Regles
### Réduction de potentiel
```formule
si reponse(urba_1, NON) et reponse (urba_2, NON) et reponse(urba_3, NON) alors 0
```
Pour une collectivité n'ayant ni la compétence PLU, ni l'instruction, ni l'octroi des permis de construire, le score de la 1.3.3 est réduit de 100 %.

# Désactivation cae_1.3.3 liee competence urba
```yaml
action_id: cae_1.3.3
```
## Regles
### Désactivation
```formule
si reponse(urba_1, NON) et reponse (urba_2, NON) et reponse(urba_3, NON) alors VRAI
```
Pour une collectivité n'ayant ni la compétence PLU, ni l'instruction, ni l'octroi des permis de construire, le statut de la 1.3.3 est "non concerné".

# Réduction potentiel cae 1.3.3 liee competence urba
```yaml
action_id: cae_1.3.3
```
## Regles
### Réduction de potentiel
```formule
si reponse(urba_1, OUI) ou si reponse (urba_2, OUI) et reponse(urba_3, OUI) alors 0.5
```
Pour une collectivité ayant au moins 1 des compétences (PLU, instruction ou octroi des permis de construire), le score de la 1.3.3 est réduit de 50 %.
