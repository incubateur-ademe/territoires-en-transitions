# Désactivation cae 2.2.3.1 liee DOM-ROM
```yaml
action_id: cae_2.2.3.1
```
## Règles
### Désactivation
```formule
identite(localisation, DOM) 
```
Pour une collectivité hors France Métropolitaine, le statut de la tâche 2.2.3.1 est "non concernée".

# Désactivation cae 2.2.3.2 liee DOM-ROM
```yaml
action_id: cae_2.2.3.2
```
## Règles
### Désactivation
```formule
identite(localisation, DOM) 
```
Pour une collectivité hors France Métropolitaine, le statut de la tâche 2.2.3.2 est "non concernée".

# Désactivation cae 2.2.3.3 liee DOM-ROM
```yaml
action_id: cae_2.2.3.3
```
## Règles
### Désactivation
```formule
identite(localisation, DOM) 
```
Pour une collectivité hors France Métropolitaine, le statut de la tâche 2.2.3.3 est "non concernée".

# Réduction potentiel cae 2.2.3 liee eau chaude sanitaire
```yaml
action_id: cae_2.2.3
```
## Règles
### Réduction de potentiel
```formule
si identite(localisation, DOM) et reponse(ECS, NON) alors 0.3
```
Pour une collectivité hors France Métropolitaine, et en l'absence de besoin d'eau chaude sanitaire, le score de la 2.2.3 est réduit de 70 %.
Pour une collectivité hors France Métropolitaine, le statut des tâches 2.2.3.1 à 2.2.3.3 est "non concerné".


# Réduction potentiel cae 2.3.1 liee eclairage public
```yaml
action_id: cae_2.3.1
```
## Règles
### Réduction de potentiel
```formule
si identite(type, EPCI) et reponse(EP_1, EP_1_b) alors 2/6
sinon si identite(type, EPCI) et reponse(EP_1, EP_1_c) alors 0
sinon 1-reponse(EP_2)
```
### Désactivation
```formule
identite(type, EPCI) et reponse(EP_1, EP_1_c)
```
Si la collectivité est un EPCI sans compétence sur l'éclairage public, alors le score est réduit à 0 et les statuts sont "non concernés".
Si la collectivité est un EPCI avec une compétence éclairage public limitée, alors la collectivité est évaluée sur 2 points (au lieu de 6).
Si la collectivité a délégué sa compétence éclairage public à une autre structure, alors le score est proportionnel à la participation de la collectivité dans la structure.


# Réduction potentiel cae 2.3.3 liee voirie
```yaml
action_id: cae_2.3.3
```
## Règles
### Réduction de potentiel
```formule
si reponse(voirie_1, voirie_1_b) alors 0.5
sinon si reponse(voirie_1, voirie_1_c) alors 0/2
```
### Désactivation
```formule
reponse(voirie_1, voirie_1_c)
```
Si la collectivité n'a pas la compétence voirie, alors le score est réduit à 0 et les statuts sont "non concernés".
Si la collectivité a une compétence voirie limitée, alors la collectivité est évaluée sur 1 point (au lieu de 2).
