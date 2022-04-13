# Réduction potentiel cae 6.1.2 liee commune
```yaml
action_id: cae_6.1.2
```
## Regles
### Reduction de potentiel
```formule
si identite(type, commune) alors 3/4
```

# Reduction potentiel cae 6.2.1 liee logement-habitat
```yaml
action_id: cae_6.2.1
```
## Regles
### Reduction de potentiel
```formule
si identite(type, commune) alors max(reponse(habitat_2), 2/10) 
sinon si identite(type, commune) et reponse(habitat_3, OUI) alors 11/10
```
Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de politique du logement et du cadre de vie, dans la limite de 2 points restant minimum.
Si la commune participe au conseil d’administration d'un bailleur social, le potentiel, possibilement rédest augmenté d'un point sur la 6.2.1



# Reduction potentiel cae 6.2.2 liee logement-habitat
```yaml
action_id: cae_6.2.2
```
## Regles
### Reduction de potentiel
```formule
si identite(type, commune) alors max (reponse(habitat_2),1/6) 
```


# Reduction potentiel cae 6.2.3 liee logement-habitat
```yaml
action_id: cae_6.2.3
```
## Regles
### Reduction de potentiel
```formule
si identite(type, commune) alors max (reponse(habitat_2),0.5) 
```


# Reduction potentiel cae 6.2.4 liee developpement economique
```yaml
action_id: cae_6.2.4
```
## Regles
### Reduction de potentiel
```formule
si identite(type, commune) alors max (reponse(dev_eco_2),2/8) 
```


# Reduction potentiel cae 6.3.1 liee developpement economique
```yaml
action_id: cae_6.3.1
```
## Regles
### Reduction de potentiel
```formule
si identite(type, commune) alors max (reponse(dev_eco_2),2/8) 
```

# Desactivation cae 6.3.1.4 liee tissu economique
```yaml
action_id: cae_6.3.1.4
```
## Regles
### Desactivation
```formule
reponse(dev_eco_4,NON) 
```

# Modification potentiel cae 6.3.1.3 liee tissu economique
```yaml
action_id: cae_6.3.1.3
```
## Regles
### Reduction de potentiel
```formule
si reponse(dev_eco_4,NON) alors 1.625
```

# Modification potentiel cae 6.3.1.5 liee tissu economique
```yaml
action_id: cae_6.3.1.5
```
## Regles
### Reduction de potentiel
```formule
si reponse(dev_eco_4,NON) alors 1.625
```
👆 En l’absence de tissu économique propice à l’émergence de projets d’écologie industrielle, le statut de la 6.3.1.4 est "non concernée" et les 2 points liés sont affectés à la 6.3.1.3 et la 6.3.1.5


# Reduction potentiel cae 6.3.2 liee tourisme
```yaml
action_id: cae_6.3.2
```
## Regles
### Reduction de potentiel
```formule
si identite(type, commune) alors max (reponse(tourisme_1),1/4) 
```
### Reduction de potentiel
```formule
si identite(type, EPCI) et si reponse(tourisme_2, NON) alors 1/4 
```


# Reduction potentiel cae 6.4.1 liee surfaces agricoles
```yaml
action_id: cae_6.4.1
```
## Regles
### Reduction de potentiel
```formule
si reponse(SAU, OUI) alors 0.5 
```

# Modification points cae 6.4.1.6 liee DOM
```yaml
action_id: cae_6.4.1.6
```
## Regles
### Reduction de potentiel
```formule
si type(localisation,DOM) alors 4/3
```
👆 La note du référentiel actuel est à 15 %. Pour les collectivités DOM, la note de la sous-action passe à 20 %.

# Modification points cae 6.4.1.8 liee DOM
```yaml
action_id: cae_6.4.1.8
```
## Regles
### Reduction de potentiel
```formule
si type(localisation,DOM) alors 2/3
```
👆 La note du référentiel actuel est à 15 %. Pour les collectivités DOM, la note de la sous-action passe à 10 %.

# Reduction potentiel cae 6.4.2 liee surfaces forestieres
```yaml
action_id: cae_6.4.2
```
## Regles
### Reduction de potentiel
```formule
si reponse(foret, OUI) alors 0.5
```

# Desactivation cae 6.5.2.5 liee a publicite
```yaml
action_id: cae_6.5.2.5
```
## Regles
### Desactivation
```formule
reponse(dev_eco_3, NON)
```

# Reduction potentiel cae 6.5.2 liee a publicite
```yaml
action_id: cae_6.5.2
```
## Regles
### Reduction de potentiel
```formule
si reponse(dev_eco_3, NON) alors 5/6 
```
Pour une collectivité non responsable de la publicité et des enseignes, le statut de la tâche 6.5.2.5 est "non concernée" et le score de la 6.5.2 est réduit d'un point.


# Reduction potentiel cae 6.5.3 liee scolaire
```yaml
action_id: cae_6.5.3
```
## Regles
### Reduction de potentiel
```formule
si reponse(scolaire_1, NON) alors 0.5 
```
### Reduction de potentiel
```formule
si reponse(scolaire_2, NON) alors 0
```
