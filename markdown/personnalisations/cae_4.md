# Réduction potentiel cae 4.1.1 liee AMO
```yaml
action_id: cae_4.1.1
```
## Règles
### Réduction de potentiel
```formule
max(reponse(AOM_2), 0.5) 
```
Pour une collectivité non AOM, le score est proportionnel à la participation dans la structure AOM dans la limite de 50 %.


# Réduction potentiel cae 4.1.2 liee mobilité interne
```yaml
action_id: cae_4.1.2
```
## Règles
### Réduction de potentiel
```formule
si reponse(TC_1, NON) et reponse(vehiculeCT_1, NON) alors 0.5
sinon si reponse(TC_1, NON) alors 0.8
sinon si reponse(vehiculeCT_1, NON) alors 0.7
```
Pour une collectivité dont la desserte des locaux par les transports publics est inenvisageable, le score est diminué de 20 %.
Pour une collectivité ne disposant pas de véhicules, le score est diminué de 30 % et les statuts des sous-actions 4.1.2.1, 4.1.2.3 et 4.1.2.4 sont "non concerné".
Ces 2 réductions sont cumulables.

# Désactivation cae 4.1.2.1 liee mobilité interne
```yaml
action_id: cae_4.1.2.1
```

## Règles 
### Désactivation
```formule
reponse(vehiculeCT_1, NON)
```

# Désactivation cae 4.1.2.3 liee mobilité interne
```yaml
action_id: cae_4.1.2.3
```

## Règles
### Désactivation
```formule
reponse(vehiculeCT_1, NON)
```

# Désactivation cae 4.1.2.4 liee mobilité interne
```yaml
action_id: cae_4.1.2.4
```

## Règles 
### Désactivation
```formule
reponse(vehiculeCT_1, NON)
```



# Réduction potentiel cae 4.2.1 liee stationnement
```yaml
action_id: cae_4.2.1
```
## Règles
### Réduction de potentiel
```formule
si identite(type, commune) alors max(reponse(voirie_2), 2/8)
sinon si identite(type, EPCI) et reponse(voirie_1, voirie_1_b) alors 0.5
sinon si reponse(voirie_1, voirie_1_c) et reponse(centre_polarite, NON) alors 0.25
```
Pour les communes, le score est réduit proportionnelle à la part dans l’EPCI en cas de transfert de la compétence en matière de voirie/stationnement, dans la limite de 2 points pour le pouvoir de police du maire.
Pour les intercommunalités qui n’ont la compétence que sur les voiries et parcs de stationnements communautaires, le score est réduit de 50 %.
En l’absence de compétences voirie et stationnement et de zones de polarités, le score est réduit de 75 %.


# Réduction potentiel cae 4.2.2 liee stationnement
```yaml
action_id: cae_4.2.2
```
## Règles
### Réduction de potentiel
```formule
si reponse(pouvoir_police, NON) et reponse(trafic, NON) et reponse(voirie_1,voirie_1_b) alors 2/16
sinon si reponse(pouvoir_police, NON) et reponse(trafic, NON) et reponse(voirie_1,voirie_1_c) alors 2/16
sinon si reponse(pouvoir_police, NON) et reponse(trafic, NON) alors 4/16
sinon si reponse(pouvoir_police, NON) et reponse(voirie_1,voirie_1_b) alors 4/16
sinon si reponse(pouvoir_police, NON) et reponse(voirie_1,voirie_1_c) alors 4/16
sinon si reponse(voirie_1,voirie_1_b) et reponse(voirie_1,voirie_1_c) alors 4/16
sinon si reponse(voirie_1,voirie_1_b) et reponse(trafic, NON) alors 4/16
sinon si reponse(voirie_1,voirie_1_c) et reponse(trafic, NON) alors 4/16
sinon si reponse(pouvoir_police, NON) ou reponse(voirie_1,voirie_1_b) ou reponse(voirie_1,voirie_1_c) ou reponse
(trafic, NON) alors 0.5
```
Pour les collectivités ne disposant pas des compétences en matière de circulation/gestion du trafic (pouvoir de police), le score est réduit de 50 %.
Pour les collectivités ne disposant pas de compétences en matière de voirie (création, aménagement, entretien) ou qui possèdent uniquement les voiries et parcs de stationnements communautaires, le score est réduit de 50 %.
Pour les collectivités pour lesquelles il n'y a manifestement pas de potentiel d'action ou de problèmes liés à la vitesse, le score est réduit de 50 %.
Ces réductions sont cumulables, dans la limite de 2 points potentiel restant.


# Réduction potentiel cae 4.2.3 liee AMO et voirie et population
```yaml
action_id: cae_4.2.3
```
## Règles
### Réduction de potentiel
```formule
si reponse(AOM_1, NON) et reponse (voirie_1, voirie_1_c) et reponse(centre_polarite, NON) alors 0
sinon si reponse(AOM_1, NON) et reponse (voirie_1, voirie_1_c) et identite(population, moins_de_10000) alors 0
sinon si identite(population, moins_de_10000) ou reponse(centre_polarite, NON) alors 0.5
sinon si reponse(AOM_1, NON) et reponse (voirie_1, voirie_1_c) alors 0.5 
sinon si reponse(AOM_1, NON) alors 0.75
sinon si reponse (voirie_1, voirie_1_c) alors 0.75
```
Pour une collectivité non AOM, le score de la 4.2.3 est réduit de 25 %.
Pour une collectivité sans compétence voirie, le score de la 4.2.3 est réduit de 25 %.
Pour une collectivité de moins de 10 000 habitants ou ne comportant pas de commune ou centre-bourg de plus de 2000 habitants, le score de la 4.2.3 est réduit de 50 %.
Les réductions sont cumulables.

# Désactivation cae 4.2.3.5 liee stationnement
```yaml
action_id: cae_4.2.3.5
```
## Règles 
### Désactivation
```formule
reponse(voirie_1, voirie_1_c)
```

# Réduction potentiel cae 4.3.1 liee voirie
```yaml
action_id: cae_4.3.1
```
## Règles
### Réduction de potentiel
```formule
si identite(type, commune) alors max(reponse(voirie_2), 0.5)
sinon si identite(type, EPCI) et reponse(voirie_1, voirie_1_b) alors 0.5
```
Pour les communes, le score de la 4.3.1 est réduit proportionnellement à la part dans l’EPCI compétent en matière de voirie (création, aménagement, entretien) dans la limite de 50 % pour prendre en compte le pouvoir de police du maire.
Pour les intercommunalités qui n’ont la compétence que sur les voiries et parcs de stationnements communautaires, le score est réduit de 50 %.


# Réduction potentiel cae 4.3.2 liee competence cyclable
```yaml
action_id: cae_4.3.2
```
## Règles
### Réduction de potentiel
```formule
si identite(localisation,DOM) et reponse(cyclable, NON) alors 7/16
sinon si identite(localisation,DOM) alors 14/16
sinon si reponse(cyclable, NON) alors 0.5
```
Pour une collectivité disposant de peu de compétences en matière de politique cyclable (ni AOM, ni compétente en matière d’infrastructures vélos, de stationnement vélos, de services associés aux vélos), le score de la 4.3.2 est réduit de 50 %.
Le nombre de point max pour l'action 4.3.2 est de 16 points en Métropole et de 14 points pour les collectivités DOM.


# Réduction potentiel cae 4.3.3 liee transports en commun
```yaml
action_id: cae_4.3.3
```
## Règles
### Réduction de potentiel
```formule
si reponse(AOM_1, NON) et reponse(versement_mobilite, NON) alors min(reponse(AOM_2), 0.5)
sinon si reponse(AOM_1, NON) et reponse(versement_mobilite, OUI) alors reponse(AOM_2)
sinon si reponse(versement_mobilite, NON) alors 0.5
```
Pour une collectivité non AOM, le score de la 4.3.3 est réduit proportionnellement à la part de la collectivité dans la structure AOM.
Pour les collectivités non concernée par le versement mobilité, le score de la 4.3.3 est réduit de 50 %.
La réduction la plus forte prévaut.


# Réduction potentiel cae 4.3.4 liee AOM
```yaml
action_id: cae_4.3.4
```
## Règles
### Réduction de potentiel
```formule
si identite(localisation,DOM) et reponse(AOM_1, NON) alors max(reponse(AOM_2) * 10/8, 5/8)
sinon si identite(localisation,DOM) alors 10/8
sinon si reponse(AOM_1, NON) alors max(reponse(AOM_2), 4/8)
```
Pour une collectivité non AOM, le score de la 4.3.4 est réduit proportionnellement à la part de la collectivité dans la structure AOM dans la limite de 50%.
Le nombre de point max pour l'action 4.3.4 est de 8 points en Métropole et de 10 points pour les collectivités DOM.
