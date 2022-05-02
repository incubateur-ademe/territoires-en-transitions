# Désactivation eci_1.2.2 liee syndicat
```yaml
action_id: eci_1.2.2
```
## Règles
### Désactivation
```formule
si identite(type, syndicat) alors VRAI
sinon si reponse(dev_eco_1, NON) alors VRAI
```
Les syndicats ne sont pas concernés par la sous-action 1.2.2.

# Désactivation eci_1.2.3 liee syndicat
```yaml
action_id: eci_1.2.3
```
## Règles
### Désactivation
```formule
si identite(type, syndicat) alors VRAI
sinon si reponse(dev_eco_1, NON) alors VRAI
```
Les syndicats ne sont pas concernés par la sous-action 1.2.3.

# Désactivation eci_1.2.4 liee syndicat
```yaml
action_id: eci_1.2.4
```
## Règles
### Désactivation
```formule
si identite(type, syndicat) alors FAUX sinon VRAI
```
Les syndicats ne sont pas concernés par la sous-action 1.2.4.

# Désactivation eci_2.1 liee collecte dechets
```yaml
action_id: eci_2.1
```
## Règles
### Désactivation
```formule
reponse(dechets_3, NON) 
```
Pour les collectivités n'ayant pas la compétence "collecte des déchets", le score de l'action 2.1. est réduit à 0 et les statuts sont "non concerné".

# Désactivation eci_2.2 liee collecte dechets
```yaml
action_id: eci_2.2
```
## Règles
### Désactivation
```formule
reponse(dechets_1, NON) 
```
Pour les collectivités n'ayant pas la compétence "collecte des déchets", le score de l'action 2.2. est réduit à 0 et les statuts sont "non concerné".

# Désactivation eci_2.3 liee traitement dechets
```yaml
action_id: eci_2.3
```
## Règles
### Désactivation
```formule
reponse(dechets_2, NON) 
```
Pour les collectivités n'ayant pas la compétence "traitement des déchets", le score de l'action 2.3. est réduit à 0 et les statuts sont "non concerné".
   

# Désactivation eci_2.4 liee collecte dechets
```yaml
action_id: eci_2.4
```
## Règles
### Désactivation
```formule
reponse(dechets_1, NON) et reponse(dechets_2, NON)
```
Pour les collectivités n'ayant ni la compétence "collecte des déchets", ni la compétence "traitement des déchets", le score de l'action 2.4. est réduit à 0 et les statuts sont "non concerné".
Pour les collectivités n'ayant pas la compétence "collecte des déchets", les scores des sous-actions 2.4.2 et 2.4.3 sont réduits à 0 et les statuts de ces 2 sous-actions sont "non concerné".
Pour les collectivités n'ayant pas la compétence "traitement des déchets", le score de la sous-action 2.4.4 est réduit à 0 et le statut de cette sous-action est "non concerné".


# Désactivation eci_2.4.2 liee collecte dechets
```yaml
action_id: eci_2.4.2
```
## Règles
### Désactivation
```formule
reponse(dechets_1, NON) 
```

# Désactivation eci_2.4.3 liee collecte dechets
```yaml
action_id: eci_2.4.3
```
## Règles
### Désactivation
```formule
reponse(dechets_1, NON) 
```
                                                   ˚
# Désactivation eci_2.4.4 liee traitement dechets
```yaml
action_id: eci_2.4.4
```
## Règles
### Désactivation
```formule
reponse(dechets_2, NON) 
```



# Désactivation eci_3.2.0 liee SPASER
```yaml
action_id: eci_3.2.0
```
## Règles
### Désactivation
```formule
reponse(SPASER, NON) 
```
Les collectivités ayant un montant total annuel des achats inférieur à 100 millions d’euros hors-taxes ne sont pas concernées par le SPASER.

# Désactivation eci_3.4 liee competence dev eco
```yaml
action_id: eci_3.4
```
## Règles
### Désactivation
```formule
reponse(dev_eco_1, NON) 
```
Pour les collectivités n'ayant pas la compétence "développement économique", le score de l'action 3.4. est réduit à 0 et les statuts sont "non concerné".
Pour les collectivités ne possédant pas d'établissements de formation initiale et continue sur leur territoire, le score de la sous-action 3.4.2 est réduit à 0 et le statut est "non concerné".

# Désactivation eci_3.4.2 liee etablissement de formation
```yaml
action_id: eci_3.4.2
```
## Règles
### Désactivation
```formule
reponse(formation, NON) 
```


# Modification points eci_3.7.1 liee taille population
```yaml
action_id: eci_3.7.1
```
## Règles
### Réduction de potentiel
```formule
si identite(population, moins_de_100000) alors 3 
```
La note du référentiel actuel est à 25 %. Pour les collectivités ayant une population inférieure à 100 000 habitants, la note de la sous-action passe à 75 %.


# Modification points eci_3.7.2 liee taille population
```yaml
action_id: eci_3.7.2
```
## Règles
### Réduction de potentiel
```formule
si identite(population, moins_de_100000) alors 1/3
```
La note du référentiel actuel est à 75 %. Pour les collectivités ayant une population inférieure à 100 000 habitants, la note de la sous-action passe à 25 %.


# Désactivation eci_4.1 liee collecte et traitement dechets
```yaml
action_id: eci_4.1
```
## Règles
### Désactivation
```formule
reponse(dechets_1, NON) et reponse(dechets_2, NON)
```
Pour les collectivités n'ayant ni la compétence "collecte des déchets", ni la compétence "traitement des déchets", le score de l'action 4.1. est réduit à 0 et les statuts sont "non concerné".


# Désactivation eci_4.2.1 liee collecte dechets
```yaml
action_id: eci_4.2.1
```
## Règles
### Désactivation
```formule
reponse(dechets_1, NON) ou reponse(REOM, OUI) 
```
Pour les collectivités n'ayant ni la compétence "collecte des déchets", ni la compétence "traitement des déchets", le score de l'action 4.2 est réduit à 0 et les statuts sont "non concerné".
Pour les collectivités n'ayant pas la compétence "collecte des déchets", les scores des sous-actions 4.2.1 à 4.2.4 sont réduits à 0 et les statuts de ces 4 sous-actions sont "non concerné".
Pour les collectivités ayant mis en place la redevance d’enlèvement des ordures ménagères (REOM), les scores des sous-action 4.2.1 et 4.2.3 sont réduits à 0 et les statuts de ces 2 sous-actions sont "non concerné".
La sous-action 4.2.5 ne s'adressent qu'aux syndicats de traitement.

# Désactivation eci_4.2.2 liee collecte dechets
```yaml
action_id: eci_4.2.2
```
## Règles
### Désactivation
```formule
reponse(dechets_1, NON) 
```
Pour les collectivités n'ayant ni la compétence "collecte des déchets", ni la compétence "traitement des déchets", le score de l'action 4.2 est réduit à 0 et les statuts sont "non concerné".

# Désactivation eci_4.2.3 liee collecte dechets
```yaml
action_id: eci_4.2.3
```
## Règles
### Désactivation
```formule
reponse(dechets_1, NON) ou reponse(REOM, OUI) 
```
Pour les collectivités n'ayant ni la compétence "collecte des déchets", ni la compétence "traitement des déchets", le score de l'action 4.2 est réduit à 0 et les statuts sont "non concerné".
Pour les collectivités ayant mis en place la redevance d’enlèvement des ordures ménagères (REOM), les scores des sous-action 4.2.1 et 4.2.3 sont réduits à 0 et les statuts de ces 2 sous-actions sont "non concerné".

# Désactivation eci_4.2.4 liee collecte dechets
```yaml
action_id: eci_4.2.4
```
## Règles
### Désactivation
```formule
reponse(dechets_1, NON) 
```
Pour les collectivités n'ayant ni la compétence "collecte des déchets", ni la compétence "traitement des déchets", le score de l'action 4.2 est réduit à 0 et les statuts sont "non concerné".
Pour les collectivités n'ayant pas la compétence "collecte des déchets", les scores des sous-actions 4.2.1 à 4.2.4 sont réduits à 0 et les statuts de ces 4 sous-actions sont "non concerné".

# Désactivation eci_4.2.5 liee syndicat de traitement
```yaml
action_id: eci_4.2.5
```
## Règles
### Désactivation
```formule
si identite(type, syndicat) et reponse(dechets_2, OUI) alors FAUX sinon VRAI
```
Pour les collectivités n'ayant ni la compétence "collecte des déchets", ni la compétence "traitement des déchets", le score de l'action 4.2 est réduit à 0 et les statuts sont "non concerné".
La sous-action 4.2.5 ne s'adressent qu'aux syndicats de traitement.


# Désactivation eci_4.3 liee competence dev eco
```yaml
action_id: eci_4.3
```
## Règles
### Désactivation
```formule
reponse(dev_eco_1, NON) 
```
Pour les collectivités n'ayant pas la compétence "développement économique", le score de l'action 4.3. est réduit à 0 et les statuts sont "non concerné".
