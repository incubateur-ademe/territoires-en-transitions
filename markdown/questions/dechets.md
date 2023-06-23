# La collectivité a-t-elle la compétence collecte des déchets ?
```yaml
id: dechets_1
type: binaire
thematique_id: dechets
actions: [cae_1.2.3, eci_2.2, eci_2.4, eci_2.4.2, eci_2.4.3, eci_4.1, eci_4.2, eci_4.2.1, eci_4.2.2, eci_4.2.3, eci_4.2.4]
```

# La collectivité a-t-elle la compétence traitement des déchets ?
```yaml
id: dechets_2
type: binaire
thematique_id: dechets
actions: [cae_1.2.3, cae_3.3.5, eci_2.3, eci_2.4, eci_2.4.4, eci_4.1, eci_4.2]
```

# La collectivité est-elle chargée de la réalisation d'un "Programme local de prévention des déchets ménagers et assimilés" (PLPDMA) du fait de sa compétence collecte et/ou par délégation d'une autre collectivité ?
```yaml
id: dechets_3
type: binaire
thematique_id: dechets
actions: [cae_1.2.3, eci_2.1]
```

# La collectivité a-t-elle mise en place la redevance d’enlèvement des ordures ménagères (REOM) ?
```yaml
id: REOM
type: binaire
thematique_id: dechets
actions: [eci_4.2, eci_4.2.1, eci_4.2.3]
```

# Si la collectivité a transféré le traitement des déchets à un syndicat compétent en la matière, quelle est la part de la collectivité dans ce syndicat ?
```yaml
id: dechets_4
type: proportion
thematique_id: dechets
actions: [cae_3.3.5]
types_concernes: [EPCI]
```
