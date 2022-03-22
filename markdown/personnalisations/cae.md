# Petit titre sur la personnalisation de la cae 4.1.1
```yaml
action_id: cae_4.1.1
```

## Regles
### Réduction de potentiel 
```formule
si reponse(mobilite_1, mobilite_1_a) alors max(reponse(mobilite_2), 0.5) 
```
Pour une collectivité AOM, la réduction est proportionnelle 
à la participation dans la collectivité AOM dans la limite de 5 points (50%)


# Petit titre sur la personnalisation de la cae 3.3.5
```yaml
action_id: cae_3.3.5
```

## Regles
### Score
```formule
min(score(cae_1.2.3), score(cae_3.3.5 )) 
```
Score de la 3.3.5 ne peut pas dépasser le score de la 1.2.3