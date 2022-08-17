# Personnalisation cae 1.1.2.0.1 liee obligation PCAET
```yaml
action_id: cae_1.1.2.0.1
```
## Règles
### Désactivation
```formule
si identite(type, commune) alors VRAI
sinon si identite(type, EPCI) et identite(population, moins_de_20000) alors VRAI
```
Seuls les EPCI à fiscalité propre de plus de 20 000 habitants sont concernées par l'obligation de réaliser un PCAET.

# Personnalisation cae 1.1.2.0.2 liee obligation BEGES
```yaml
action_id: cae_1.1.2.0.2
```
## Règles
### Désactivation
```formule
identite(population, moins_de_50000)
```
Les collectivités de moins de 50 000 habitants ne sont pas concernées par l'obligation BEGES.


# Réduction potentiel cae 1.2.2 liee AOM
```yaml
action_id: cae_1.2.2
```
## Règles
### Réduction de potentiel
```formule
si reponse(centre_urbain, OUI) et reponse (AOM_1, NON) alors 6/12 
sinon si reponse (AOM_1, NON) alors 2/12
```
Pour une collectivité n'ayant pas la compétence AOM, le score de la 1.2.2 est réduit de 50 %.

Pour une collectivité n'ayant pas de centre urbain de plus de 5000 habitants ET n'ayant pas la compétence AOM, le score de la 1.2.2 est réduit à 2 points.

# Personnalisation cae 1.2.2.1.1 liee EPCI
```yaml
action_id: cae_1.2.2.1.1
```
## Règles
### Désactivation
```formule
identite(type, commune)
```

# Personnalisation cae 1.2.2.1.3 liee commmune
```yaml
action_id: cae_1.2.2.1.3
```
## Règles
### Désactivation
```formule
identite(type, EPCI)
```


# Personnalisation cae 1.2.2.1 liee AOM > 100 000 hab
```yaml
action_id: cae_1.2.2.1
```
## Règles
### Réduction de potentiel
```formule
si reponse(AOM_1, OUI) et identite(population, plus_de_100000) alors 0
```
### Désactivation
```formule
reponse(AOM_1, OUI) et identite(population, plus_de_100000)
```
Pour une collectivité AOM, de plus de 100 000 habitants, la 1.2.2.1 est désactivée.

# Personnalisation cae 1.2.2.5 liee AOM > 100 000 hab
```yaml
action_id: cae_1.2.2.5
```
## Règles
### Réduction de potentiel
```formule
si reponse(AOM_1, OUI) et identite(population, plus_de_100000) alors 4.8/12
```
Pour une collectivité AOM, de plus de 100 000 habitants, la 1.2.2.5 est notée sur 40 % (au lieu de 30 %).

# Réduction potentiel cae 1.2.3 liee competences dechets
```yaml
action_id: cae_1.2.3
```
## Règles
### Réduction de potentiel
```formule
si reponse(dechets_1, OUI) et reponse(dechets_2, OUI) et reponse(dechets_3, OUI) alors 1.0
sinon si reponse(dechets_1, NON) et reponse(dechets_2, NON) et reponse(dechets_3, NON) alors 2/10
sinon si reponse(dechets_1, OUI) ou reponse(dechets_2, OUI) ou reponse(dechets_3, OUI) alors 0.75
```
Pour une collectivité ne possédant que partiellement les compétences collecte, traitement des déchets et plan de prévention des déchets, le score de la 1.2.3 est réduit de 25 %.

Pour une collectivité n'ayant aucune des compétences collecte, traitement des déchets et plan de prévention des déchets, le score de la 1.2.3 est réduit à 2 points.

# Personnalisation cae 1.2.3.1.4 liee competence collecte
```yaml
action_id: cae_1.2.3.1.4
```
## Règles
### Désactivation
```formule
reponse(dechets_1, NON)
```

# Personnalisation cae 1.2.3.1.5 liee competence traitement
```yaml
action_id: cae_1.2.3.1.5
```
## Règles
### Désactivation
```formule
reponse(dechets_2, NON)
```


# Réduction potentiel cae 1.2.4 liee habitat
```yaml
action_id: cae_1.2.4
```
## Règles
### Réduction de potentiel
```formule
si identite(type, EPCI) et reponse(habitat_1, NON) alors 8/12 
sinon si identite(type, commune) alors max (reponse(habitat_2), 0.5) 
```
Pour un EPCI n'ayant pas la compétence habitat, le score de la 1.2.4 est réduit à 8 points.

Si la collectivité est une commune, le potentiel est réduit à la part de la commune dans la collectivité compétente en matière de Programme Local de l’Habitat (PLH), dans la limite de 50 %.


# Réduction potentiel cae 1.3.1 liee competence urba
```yaml
action_id: cae_1.3.1
```
## Règles
### Réduction de potentiel
```formule
si reponse(urba_1, NON) et reponse(SCoT, NON) alors 6/12 
sinon si reponse(urba_1, NON) et reponse(SCoT, OUI) alors 0.7 
```
Pour une collectivité n'ayant ni la compétence PLU, ni la compétence SCOT, le score de la 1.3.1 est réduit de 50 %.
Pour une collectivité n'ayant pas la compétence PLU mais disposant de la compétence SCOT, le score de la 1.3.1 est réduit de 30 %.


# Réduction potentiel cae 1.3.2 liee possession terrains
```yaml
action_id: cae_1.3.2
```
## Règles
### Réduction de potentiel
```formule
si reponse(amenagement_1, NON) ou reponse (amenagement_2, NON) alors 5/10 
```
Si une collectivité n'a pas de terrains utilisables ou vendables ou elle dispose de terrains de ce type mais n'a pas réalisé de vente ou de contrats d'utilisation alors le score de la 1.3.2 est réduit de 50 %.


# Personnalisation cae 1.3.3 liee competence urba
```yaml
action_id: cae_1.3.3
```
## Règles
### Désactivation
```formule
reponse(urba_1, NON) et reponse (urba_2, NON) et reponse(urba_3, NON)
```

### Réduction de potentiel
```formule
si reponse(urba_1, NON) et reponse (urba_2, NON) et reponse(urba_3, NON) alors 0
sinon si reponse(urba_1, OUI) et reponse(urba_2, NON) et reponse(urba_3, NON) alors 0.5
sinon si reponse(urba_1, NON) et reponse(urba_2, OUI) et reponse(urba_3, NON) alors 0.5
sinon si reponse(urba_1, NON) et reponse(urba_2, NON) et reponse(urba_3, OUI) alors 0.5
```
Pour une collectivité n'ayant ni la compétence PLU, ni l'instruction, ni l'octroi des permis de construire, le score de la 1.3.3 est réduit de 100 % et le statut de la 1.3.3 est "non concerné".
Pour une collectivité n'ayant que l'une des compétences (PLU, instruction ou octroi des permis de construire), le score de la 1.3.3 est réduit de 50 %.
