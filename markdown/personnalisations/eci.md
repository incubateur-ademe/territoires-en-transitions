# Désactivation eci_1.2.2 liee syndicat
```yaml
action_id: eci_1.2.2
```
## Regles
### Désactivation
```formule
si identite(type, syndicat) alors VRAI
```


# Désactivation eci_1.2.3 liee syndicat
```yaml
action_id: eci_1.2.3
```
## Regles
### Désactivation
```formule
si identite(type, syndicat) alors VRAI
```

# Désactivation eci_1.2.4 liee syndicat
```yaml
action_id: eci_1.2.4
```
## Regles
### Désactivation
```formule
si identite(type, syndicat) alors FAUX sinon VRAI
```


# Désactivation eci_2.1 liee collecte dechets
```yaml
action_id: eci_2.1
```
## Regles
### Désactivation
```formule
reponse(dechets_3, NON) 
```


# Désactivation eci_2.2 liee collecte dechets
```yaml
action_id: eci_2.2
```
## Regles
### Désactivation
```formule
reponse(dechets_1, NON) 
```


# Désactivation eci_2.3 liee traitement dechets
```yaml
action_id: eci_2.3
```
## Regles
### Désactivation
```formule
reponse(dechets_2, NON) 
```


# Désactivation eci_2.4 liee collecte et traitement dechets
```yaml
action_id: eci_2.4
```
## Regles
### Désactivation
```formule
reponse(dechets_1, NON) et reponse(dechets_2, NON)
```


# Désactivation eci_2.4.2 liee collecte dechets
```yaml
action_id: eci_2.4.2
```
## Regles
### Désactivation
```formule
reponse(dechets_1, NON) 
```


# Désactivation eci_2.4.3 liee collecte dechets
```yaml
action_id: eci_2.4.3
```
## Regles
### Désactivation
```formule
reponse(dechets_1, NON) 
```


# Désactivation eci_2.4.4 liee traitement dechets
```yaml
action_id: eci_2.4.4
```
## Regles
### Désactivation
```formule
reponse(dechets_2, NON) 
```


# Désactivation eci_3.2.0 liee SPASER
```yaml
action_id: eci_3.2.0
```
## Regles
### Désactivation
```formule
reponse(SPASER, NON) 
```


# Désactivation eci_3.4 liee competence dev eco
```yaml
action_id: eci_3.4
```
## Regles
### Désactivation
```formule
reponse(dev_eco_1, NON) 
```


# Désactivation eci_3.4.2 liee etablissement de formation
```yaml
action_id: eci_3.4.2
```
## Regles
### Désactivation
```formule
reponse(formation, NON) 
```


# Modification points eci_3.7.1 liee taille population
```yaml
action_id: eci_3.7.1
```
## Regles
### Réduction de potentiel
```formule
si identite(population, moins_de_100000) alors 3 
```
👆 La note du référentiel actuel est à 25 %. Pour les collectivités ayant une population inférieure à 100 000 habitants, la note de la sous-action passe à 75 %.


# Modification points eci_3.7.2 liee taille population
```yaml
action_id: eci_3.7.2
```
## Regles
### Réduction de potentiel
```formule
si identite(population, moins_de_100000) alors 1/3
```
👆 La note du référentiel actuel est à 75 %. Pour les collectivités ayant une population inférieure à 100 000 habitants, la note de la sous-action passe à 25 %.


# Désactivation eci_4.1 liee collecte et traitement dechets
```yaml
action_id: eci_4.1
```
## Regles
### Désactivation
```formule
reponse(dechets_1, NON) et reponse(dechets_2, NON)
```


# Désactivation eci_4.2 liee collecte et traitement dechets
```yaml
action_id: eci_4.2
```
## Regles
### Désactivation
```formule
reponse(dechets_1, NON) et reponse(dechets_2, NON)
```


# Désactivation eci_4.2.1 liee collecte dechets
```yaml
action_id: eci_4.2.1
```
## Regles
### Désactivation
```formule
reponse(dechets_1, NON) ou reponse(REOM, OUI) 
```

# Désactivation eci_4.2.2 liee collecte dechets
```yaml
action_id: eci_4.2.2
```
## Regles
### Désactivation
```formule
reponse(dechets_1, NON) 
```


# Désactivation eci_4.2.3 liee collecte dechets
```yaml
action_id: eci_4.2.3
```
## Regles
### Désactivation
```formule
reponse(dechets_1, NON) ou reponse(REOM, OUI) 
```


# Désactivation eci_4.2.4 liee collecte dechets
```yaml
action_id: eci_4.2.4
```
## Regles
### Désactivation
```formule
reponse(dechets_1, NON) 
```


# Désactivation eci_4.2.5 liee syndicat de traitement
```yaml
action_id: eci_4.2.5
```
## Regles
### Désactivation
```formule
si identite(type, syndicat_traitement) alors FAUX sinon VRAI
```


# Désactivation eci_4.3 liee competence dev eco
```yaml
action_id: eci_4.3
```
## Regles
### Désactivation
```formule
reponse(dev_eco_1, NON) 
```
