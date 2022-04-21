# La collectivité a-t-elle la compétence "éclairage public" ?
```yaml
id: EP_1
type: choix
thematique_id: energie
actions: [cae_2.3.1]
```
## Choix
### Oui sur l'ensemble du territoire
```yaml
id: EP_1_a
```
### Oui partiellement (uniquement sur les zones d'intérêt communautaire par exemple)
```yaml
id: EP_1_b
```
### Non pas du tout
```yaml
id: EP_1_c
```

# Quelle est la part de la collectivité dans la structure compétente en matière d'éclairage public ?
```yaml
id: EP_2
type: proportion
thematique_id: energie
actions: [cae_2.3.1]
```
## Description
La part se rapporte au nombre d'habitants (nombre d'habitants de la collectivité / nombre d'habitants de la structure compétente) ou au pouvoir de la collectivité dans la structure compétente (nombre de voix d'élu de la collectivité / nombre de voix total dans l'organe délibératoire de la structure compétente) si cette part est supérieure à celle liée au nombre d'habitants.

# La collectivité est-elle autorité organisatrice de la distribution (AOD) pour l'électricité ?
```yaml
id: AOD_elec
type: binaire
thematique_id: energie
actions: [cae_3.1.1, cae_3.1.2]
```

# La collectivité est-elle autorité organisatrice de la distribution (AOD) pour le gaz ?
```yaml
id: AOD_gaz
type: binaire
thematique_id: energie
actions: [cae_3.1.1, cae_3.1.2]
```

# La collectivité est-elle autorité organisatrice de la distribution (AOD) pour la chaleur ?
```yaml
id: AOD_chaleur
type: binaire
thematique_id: energie
actions: [cae_3.1.1, cae_3.1.2]
```

# Existe-t-il des fournisseurs d’énergie maîtrisés par la collectivité (Société d'économie mixte (SEM) ou régie ou exploitants de réseau de chaleur urbain liés à la collectivité par délégation de service public) ?
```yaml
id: fournisseur_energie
type: binaire
thematique_id: energie
actions: [cae_3.1.2]
```

# Existe-t-il des activités industrielles, en nombre assez important, adaptées pour la récupération de chaleur fatale ou du potentiel pour la cogénération voir la micro-cogénération (soit des chaufferies ou des consommateurs suffisants en chaleur ou des producteurs-consommateurs visant l’autoconsommation) ?
```yaml
id: recuperation_cogeneration
type: binaire
thematique_id: energie
actions: [cae_3.2.1]
```
