# La collectivité est-elle autorité organisatrice de la mobilité (AOM) ?
```yaml
id: AOM_1
type: binaire
thematique_id: mobilite
actions: [cae_1.2.2, cae_4.2.3, cae_4.3.3, cae_4.3.4]
```

# Quelle est la part de la collectivité autorité organisatrice de la mobilité (AOM) ?
```yaml
id: AOM_2
type: proportion
thematique_id: mobilite
actions: [cae_4.1.1, cae_4.3.3, cae_4.3.4]
```

# La collectivité a-t-elle la compétence voirie ?
```yaml
id: voirie_1
type: choix
thematique_id: mobilite
actions: [cae_2.3.3, cae_4.2.1, cae_4.2.2, cae_4.2.3, cae_4.3.1]
```
## Choix
### Oui sur l'ensemble du territoire
```yaml
id: voirie_1_a
```
### Oui uniquement sur les trottoirs, parkings ou zones d'activités et industrielles
```yaml
id: voirie_1_b
```
### Non pas du tout
```yaml
id: voirie_1_c
```

# Si la commune a transféré la compétence voirie (création, aménagement, entretien) et stationnement à l'EPCI, quelle est la part de la commune dans l'EPCI ?
```yaml
id: voirie_2
type: proportion
thematique_id: mobilite
actions: [cae_4.2.1, cae_4.3.1]
types_concernes: [commune]
```

# Les locaux de la collectivité sont-ils desservis ou desservables par les transports en commun ?
```yaml
id: TC_1
type: binaire
thematique_id: mobilite
actions: [cae_4.1.2]
```

# La collectivité dispose-t-elle de véhicules ?
```yaml
id: vehiculeCT_1
type: binaire
thematique_id: mobilite
actions: [cae_4.1.2]
```

# La collectivité dispose-t-elle des compétences en matière de circulation/gestion du trafic (pouvoir de police) ?
```yaml
id: pouvoir_police
type: binaire
thematique_id: mobilite
actions: [cae_4.2.2]
```

# Existe-t-il un potentiel d'action ou des problèmes liés à la limitation et réduction du trafic et de la vitesse sur les axes principaux ou dans certaines zones ?
```yaml
id: trafic
type: binaire
thematique_id: mobilite
actions: [cae_4.2.2]
```

# La collectivité dispose-t-elle de compétences en matière de politique cyclable (AOM ou compétente en matière d’infrastructures vélos, de stationnement vélos, de services associés aux vélos) ?
```yaml
id: cyclable
type: binaire
thematique_id: mobilite
actions: [cae_4.3.2]
```

# La collectivité est-elle concernée par le versement mobilité ?
```yaml
id: versement_mobilite
type: binaire
thematique_id: mobilite
actions: [cae_4.3.3]
ordonnancement: 2
```
