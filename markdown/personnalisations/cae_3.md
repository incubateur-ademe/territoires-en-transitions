
# Réduction potentiel cae 3.1.1 liee autorités organisatrices énergie
```yaml
action_id: cae_3.1.1
```
## Règles
### Réduction de potentiel
```formule
si reponse(AOD_elec, OUI) et reponse(AOD_gaz, OUI) et reponse(AOD_chaleur, OUI) alors 1.0 
sinon si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 2/10 
sinon si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) alors 4/10 
sinon si reponse(AOD_elec, NON) et reponse(AOD_chaleur, NON) alors 3/10 
sinon si reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 3/10 
sinon si reponse(AOD_elec, NON) ou reponse(AOD_gaz, NON) alors 7/10 
sinon si reponse(AOD_chaleur, NON) alors 6/10 
```
Pour une collectivité non autorité organisatrice de la distribution d'électricité, le score de la 3.1.1 est réduit de 30 %.
Pour une collectivité non autorité organisatrice de la distribution de gaz, le score de la 3.1.1 est réduit de 30 %.
Pour une collectivité non autorité organisatrice de la distribution de chaleur, le score de la 3.1.1 est réduit de 40 %.
Ces réductions sont cumulables dans la limite de 2 points restants pour prendre en compte la part d’influence dans les instances compétentes et les actions partenariales.


# Réduction potentiel cae 3.1.2 liee autorités organisatrices énergie
```yaml
action_id: cae_3.1.2
```
## Règles
### Réduction de potentiel
```formule
si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 0.5
```
Pour une collectivité non autorité organisatrice de la distribution d'électricité, de gaz et de chaleur, le score de la 3.1.2 est réduit de 50 %.
En l’absence de fournisseurs d’énergie maîtrisés par la collectivité (SEM/régie/exploitants de réseau de chaleur urbain liés à la collectivité par DSP), le score de la 3.1.2 est réduit de 20 % et le statut de la sous-action 3.1.2.2 liée aux actions de la facturation est "non concerné". 
La réduction la plus forte prévaut.

# Réduction potentiel cae 3.1.2.2 liee fournisseurs énergie
```yaml
action_id: cae_3.1.2.2
```
## Règles
### Réduction de potentiel
```formule
si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 1.0
sinon si reponse(fournisseur_energie, NON) alors 0.8
```
Si le parent est réduit de 50% alors la réduction de 20% ne s'applique pas même si il y a des fournisseurs d'energie maîtrisés par la collectivité.

### Désactivation
```formule
reponse(fournisseur_energie, NON) 
```


# Réduction potentiel cae 3.2.1.1
```yaml
action_id: cae_3.2.1.1
```
## Règles
### Réduction de potentiel
```formule
si reponse(recuperation_cogeneration, NON) et identite(localisation,DOM) alors 2/10
sinon si reponse(recuperation_cogeneration, NON) alors 2/12
```


# Modification points cae 3.2.1 liee DOM
```yaml
action_id: cae_3.2.1
```
## Regles
### Réduction de potentiel
```formule
si identite(localisation,DOM) alors 10/12
```
Le nombre de point max pour l'action 3.2.1 est de 12 points en Métropole et de 10 points pour les collectivités DOM.
Pour une collectivité avec peu d'activités industrielles adaptées pour la récupération de chaleur fatale et peu de potentiel pour la cogénération voir la micro-cogénération (donc ni de chaufferies ni de consommateurs suffisants en chaleur ni de producteur-consommateur visant l’autoconsommation), le score de la 3.2.1 est réduit à 2 points et les statuts des sous-action 3.2.1.2 et 3.2.1.3 sont "non concernée".

# Réduction potentiel cae 3.2.1.2
```yaml
action_id: cae_3.2.1.2
```
## Règles
### Réduction de potentiel
```formule
si reponse(recuperation_cogeneration, NON) alors 0
```
### Désactivation
```formule
reponse(recuperation_cogeneration, NON) 
```

# Réduction potentiel cae 3.2.1.3
```yaml
action_id: cae_3.2.1.3
```
## Règles
### Réduction de potentiel
```formule
si reponse(recuperation_cogeneration, NON) alors 0
```
### Désactivation
```formule
reponse(recuperation_cogeneration, NON) 
```



# Modification points cae 3.2.2 liee DOM
```yaml
action_id: cae_3.2.2
```
## Regles
### Réduction de potentiel
```formule
si identite(localisation,DOM) alors 10/12
```
Le nombre de point max pour l'action 3.2.2 est de 12 points en Métropole et de 10 points pour les collectivités DOM.


# Modification points cae 3.2.3 liee DOM
```yaml
action_id: cae_3.2.3
```
## Regles
### Réduction de potentiel
```formule
si identite(localisation,DOM) alors 12/8
```
Le nombre de point max pour l'action 3.2.3 est de 8 points en Métropole et de 12 points pour les collectivités DOM.


# Réduction potentiel cae 3.3.1 liee eau potable
```yaml
action_id: cae_3.3.1
```
## Règles
### Réduction de potentiel
```formule
si reponse(eau_1, NON) alors 0/6 
```
### Désactivation
```formule
reponse(eau_1, NON) 
```
Pour une collectivité sans la compétence eau potable, le score de la 3.3.1 est réduit à 0 point et le statut de la sous-action est "non concernée".


# Réduction potentiel cae 3.3.2 liee assainissement collectif
```yaml
action_id: cae_3.3.2
```
## Règles
### Réduction de potentiel
```formule
si reponse(assainissement_1, NON) alors 0/12
sinon si reponse(assainissement_4, NON) alors 0.5
```
### Désactivation
```formule
reponse(assainissement_1, NON)
```
Pour une collectivité sans la compétence assainissement collectif, le score de la 3.3.2 est réduit à 0 point et le statut de la sous-action est "non concernée".
En cas d'absence de potentiel de valorisation énergétique (méthanisation ou récupération de chaleur) attestée par une étude portant sur la totalité du périmètre d’assainissement, le score de la 3.3.2 est réduit à 50 %.


# Réduction potentiel cae 3.3.3 liee assainissement
```yaml
action_id: cae_3.3.3
```
## Règles
### Réduction de potentiel
```formule
si identite(type, EPCI) alors max(reponse(assainissement_3), 0.5)
sinon si identite(type, commune) et reponse(assainissement_1, NON) et reponse(assainissement_2, NON) alors 0.5
```
Pour un EPCI, en cas de compétence "assainissement" partagée ou variable sur le territoire, la réduction de potentielle est proportionnelle à la part des communes ayant délégué leur compétence assainissement, dans la limite de moins 50%. Des actions sont possibles sur d’autres compétences, notamment « gestion des milieux aquatiques et prévention des inondations ».
Pour les communes sans compétence assainissement, le score de la 3.3.3 est réduit de 50 %. 


# Réduction potentiel cae 3.3.5 liee dechets 
```yaml
action_id: cae_3.3.5
```
## Règles
### Reduction de potentiel
```formule
si identite(type, commune) et reponse(dechets_2, NON) alors min(score(cae_1.2.3), 2/12)
sinon si identite (type,EPCI) et reponse(dechets_2, OUI) alors min(score(cae_1.2.3), 1.0)
sinon si identite(type, EPCI) et reponse(dechets_2, NON) alors min(score(cae_1.2.3), max(reponse(dechets_4),2/12))
```
Pour une commune, la note est réduite à 2 points.
Pour un EPCI ayant transféré la compétence traitement des déchets à un syndicat compétent en la matière, la note est réduite proportionnelle à sa participation dans cet syndicat, dans la limite de 2 points restants.
Pour favoriser la prévention des déchets, la note attribuée à cette action ne peut dépasser celle obtenue dans l'action 1.2.3.
