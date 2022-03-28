# La collectivité (y compris tous les organismes liés) possède-t-elle des terrains utilisables ou vendables (depuis au plus 10 ans) ?
```yaml
id: amenagement_1
type: binaire
thematique_id: urbanisme_habitat
actions: [cae_1.3.2]
```

# La collectivité a-t-elle conclu des ventes ou des contrats d'utilisation (comme des contrats de construction) sur les 10 dernières années ?
```yaml
id: amenagement_2
type: binaire
thematique_id: urbanisme_habitat
actions: [cae_1.3.2]
```

# La collectivité a-t-elle la compétence "élaboration du Plan Local d'Urbanisme" (PLU) ?
```yaml
id: urba_1
type: binaire
thematique_id: urbanisme_habitat
actions: [cae_1.3.1, cae_1.3.3]
```
Il s'agit de la compétence Banatic C4515

# La collectivité a-t-elle la compétence "Schéma de Cohérence Territoriale" (SCoT) ?
```yaml
id: SCoT
type: binaire
thematique_id: urbanisme_habitat
actions: [cae_1.3.1]
```
Il s'agit de la compétence Banatic 4505

# La collectivité a-t-elle la compétence d'instruction des permis de construire ?
```yaml
id: urba_2
type: binaire
thematique_id: urbanisme_habitat
actions: [cae_1.3.2]
```

# La collectivité a-t-elle la compétence d'octroi des permis de construire ?
```yaml
id: urba_3
type: binaire
thematique_id: urbanisme_habitat
actions: [cae_1.3.2]
```
Il s'agit de la compétence Banatic 4560

# La collectivité a-t-elle la compétence habitat ?
```yaml
id: habitat_1
type: binaire
thematique_id: urbanisme_habitat
actions: [cae_1.2.4]
```
Il s'agit des compétences liées à l'habitat et au logement

# Quelle est la part de la collectivité dans la structure compétente en matière de logement et d'habitat ?
```yaml
id: habitat_2
type: proportion
thematique_id: urbanisme_habitat
actions: [cae_1.2.4, cae_6.2.1, cae_6.2.2, cae_6.2.3]
types_concernes: [commune]
```

# La collectivité participe-t-elle au conseil d'administration d'un bailleur social ?
```yaml
id: habitat_3
type: binaire
thematique_id: urbanisme_habitat
actions: [cae_6.2.1]
types_concernes: [commune]
```
