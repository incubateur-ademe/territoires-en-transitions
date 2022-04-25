# Réduction potentiel cae 6.1.2 liee commune
```yaml
action_id: cae_6.1.2
```
## Règles
### Réduction de potentiel
```formule
si identite(type, commune) alors 3/4
```
Les communes sont évaluées sur 3 points au lieu de 4.

# Reduction potentiel cae 6.2.1 liee logement-habitat
```yaml
action_id: cae_6.2.1
```
## Règles
### Réduction de potentiel
```formule
si identite(type, commune) et reponse(habitat_3, NON) alors max(reponse(habitat_2), 2/10) 
sinon si identite(type, commune) et reponse(habitat_3, OUI) alors max(reponse(habitat_2), 3/11) 
```
Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de politique du logement et du cadre de vie, dans la limite de 2 points restant minimum.
Si la commune participe au conseil d’administration d'un bailleur social, le potentiel, possiblement réduit est 
augmenté d'un point sur la 6.2.1

# Reduction potentiel cae 6.2.2 liee logement-habitat
```yaml
action_id: cae_6.2.2
```
## Règles
### Réduction de potentiel
```formule
si identite(type, commune) alors max (reponse(habitat_2),1/6) 
```
Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de politique du logement et du cadre de vie, dans la limite d'un point restant minimum.

# Reduction potentiel cae 6.2.3 liee logement-habitat
```yaml
action_id: cae_6.2.3
```
## Règles
### Réduction de potentiel
```formule
si identite(type, commune) alors max (reponse(habitat_2),0.5) 
```
Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de politique du logement et du cadre de vie, dans la limite de 50 % des points.

# Reduction potentiel cae 6.2.4 liee developpement economique
```yaml
action_id: cae_6.2.4
```
## Règles
### Réduction de potentiel
```formule
si identite(type, commune) alors max (reponse(dev_eco_2),2/8) 
```
Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de développement économique, dans la limite de 2 points de potentiel restant.

# Reduction potentiel cae 6.3.1 liee developpement economique
```yaml
action_id: cae_6.3.1
```
## Règles
### Réduction de potentiel
```formule
si identite(type, commune) alors max (reponse(dev_eco_2),2/8) 
```
Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de développement économique, dans la limite de 2 points de potentiel restant.
En l’absence de tissu économique propice à l’émergence de projets d’écologie industrielle, le score de la 6.3.1.4 est réduit à 0 et son statut est "non concerné" : les 2 points liés sont affectés à la 6.3.1.3 et la 6.3.1.5.

# Désactivation cae 6.3.1.4 liee tissu economique
```yaml
action_id: cae_6.3.1.4
```
## Règles
### Désactivation
```formule
reponse(dev_eco_4,NON) 
```

# Modification potentiel cae 6.3.1.3 liee tissu economique
```yaml
action_id: cae_6.3.1.3
```
## Règles
### Réduction de potentiel
```formule
si reponse(dev_eco_4,NON) alors 1.625
```

# Modification potentiel cae 6.3.1.5 liee tissu economique
```yaml
action_id: cae_6.3.1.5
```
## Règles
### Réduction de potentiel
```formule
si reponse(dev_eco_4,NON) alors 1.625
```

# Reduction potentiel cae 6.3.2 liee tourisme
```yaml
action_id: cae_6.3.2
```
## Règles
### Réduction de potentiel
```formule
si identite(type, commune) alors max (reponse(tourisme_1),1/4) 
sinon si identite(type, EPCI) et reponse(tourisme_2, NON) alors 1/4 
```
Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de tourisme, dans la limite d'un point de potentiel restant.
Pour les EPCI dont le territoire est très peu touristique (non dotés d’un office du tourisme, d'un syndicat d’initiative ou d'un bureau d’information touristique), le score est réduit à 1 point.

# Reduction potentiel cae 6.4.1 liee surfaces agricoles
```yaml
action_id: cae_6.4.1
```
## Règles
### Réduction de potentiel
```formule
si reponse(SAU, OUI) alors 0.5 
```
Pour les collectivités possédant moins de 3 % de surfaces agricoles, le score de la 6.4.1 est réduit de 50 %.

# Modification points cae 6.4.1.6 liee DOM
```yaml
action_id: cae_6.4.1.6
```
## Règles
### Réduction de potentiel
```formule
si identite(localisation, DOM) alors 4/3
```
La note du référentiel actuel est à 15 %. Pour les collectivités DOM, la note de la sous-action passe à 20 %.

# Modification points cae 6.4.1.8 liee DOM
```yaml
action_id: cae_6.4.1.8
```
## Règles
### Réduction de potentiel
```formule
si identite(localisation, DOM) alors 2/3
```
La note du référentiel actuel est à 15 %. Pour les collectivités DOM, la note de la sous-action passe à 10 %.

# Reduction potentiel cae 6.4.2 liee surfaces forestieres
```yaml
action_id: cae_6.4.2
```
## Règles
### Réduction de potentiel
```formule
si reponse(foret, OUI) alors 0.5
```
Pour les collectivités possédant moins de 10 % de surfaces agricoles, le score de la 6.4.2 est réduit de 50 %.

# Désactivation cae 6.5.2.5 liee a publicite
```yaml
action_id: cae_6.5.2.5
```
## Règles
### Désactivation
```formule
reponse(dev_eco_3, NON)
```

# Reduction potentiel cae 6.5.2 liee a publicite
```yaml
action_id: cae_6.5.2
```
## Règles
### Réduction de potentiel
```formule
si reponse(dev_eco_3, NON) alors 5/6 
```
Pour une collectivité non responsable de la publicité et des enseignes, le statut de la tâche 6.5.2.5 est "non concernée" et le score de la 6.5.2 est réduit d'un point.


# Reduction potentiel cae 6.5.3 liee scolaire
```yaml
action_id: cae_6.5.3
```
## Règles
### Réduction de potentiel
```formule
si reponse(scolaire_2, NON) alors 0
sinon si reponse(scolaire_1, NON) alors 0.5
```
### Désactivation
```formule
reponse(scolaire_2, NON)
```
Si le territoire de la collectivité ne compte aucun établissement scolaire ou structure d’accueil de jeunes enfants sur le territoire, le score de l'action 6.5.3 est réduit à 0.
Si la collectivité n’est pas en charge des écoles, le score de l'action 6.5.3 est 'reduit de 50 % : le reste du potentiel est maintenu pour la compétence « soutien aux actions de maîtrise de la demande d'énergie » que la collectivité peut prendre de manière facultative.
