# Petit titre sur la personnalisation de la cae 4.1.1
```yaml
action_id: cae_4.1.1
```

## Regles
### Réduction de potentiel 
```formule
si reponse(mobilite_1, OUI) alors max(reponse(dechets_2), 0.5) 
```
Pour une collectivité AOM, la réduction est proportionnelle 
à la participation dans la collectivité AOM dans la limite de 5 points (50%)

### Désactivation
```formule
reponse(dechets_1, NON) 
```

