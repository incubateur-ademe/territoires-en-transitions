# Modes de déplacement
```yaml
id: modes_de_deplacement
unite: '%'

titre_long: Part des personnes utilisant un mode de déplacement par rapport à l'ensemble des personnes qui se déplacent
selection: yes
sans_valeur: yes
programmes:
  - cae
thematiques:
  - mobilite_et_transport
```
## Description
La part modale est une part modale en nombre de déplacements.

Les valeurs limites et cibles des différentes parts modales sont données à titre indicatif : il faut également juger de l'évolution de la part modale au fil du temps et des caractéristiques du territoire. À défaut de posséder les parts modales issues d'une enquête ménages, les collectivités peuvent utiliser les données INSEE donnant les parts modales des déplacements domicile-travail pour la population active (tableau NAV2A ou NAV2B).

# Couverture des Plans de déplacements 
```yaml
id: plans_de_deplacement
unite: '%'

titre_long: Couverture des Plans de déplacements
sans_valeur: yes
selection: yes
programmes:
  - cae
thematiques:
  - mobilite_et_transport
```
## Description
L'indicateur comptabilise le nombre d'habitants couverts par un Plan de Déplacements sur le territoire et le rapporte à la population du territoire. Ce chiffre doit être en augmentation chaque année. Des valeurs indicatives limites et cibles sont données, basées sur des données ADEME et les meilleurs scores des collectivités du programme Territoire Engagé.

# Émissions de polluants atmosphériques 
```yaml
id: emission_polluants_atmo
unite: tonnes

titre_long: Quantité totale d'émissions de polluants atmosphériques
sans_valeur: yes
selection: yes
programmes:
  - cae
  - crte
thematiques:
  - nature_environnement_air
```
## Description
Ces indicateurs estiment les émissions annuelles des six polluants atmosphériques exigés dans le contenu réglementaire des PCAET (décret n°2016-849 du 28 juin 2016 et arrêté du 4 août 2016 relatifs au plan climat-air-énergie territorial) : oxydes d’azote (NOx), les particules PM 10 et PM 2,5 et les composés organiques volatils (COV), tels que définis au I de l’article R. 221-1 du même code, ainsi que le dioxyde de soufre (SO2) et l’ammoniac (NH3).

Les données peuvent être fournies notamment par les associations agréées pour la surveillance de la qualité de l'air (AASQA).

**Objectif opérationnel national fixé par les documents de référence:**
Plan national de réduction des émissions polluantes (décret n°2017-949 du 10 mai 2017): réduction des polluants par rapport aux émissions de 2005 :
- SO2 (objectifs : 2020 = -55% / 2025 = -66% / 2030 = -77%)
- Nox (2020 = -50% /2025 = -60% / 2030 = -69%)
- COV (2020 = -43% / 2025 = -47% /2030 = -52%)
- PM2,5 (2020 = -27% /2025 = -42% /2030 = -57%)
- NH3 (2020 = -4% /2025 = -8% / 2030 = -13%)"

# Compacité des formes urbaines
```yaml
id: cae_9
unite: "%"
identifiant: 9

titre_long: Compacité des formes urbaines
sans_valeur: yes
selection: yes
actions:
  - cae_1.3.1
programmes:
  - cae
climat_pratic_ids:
  - urbanisme
thematiques:
  - urbanisme_et_amenagement
```
## Description
Les trois indicateurs permettent d'évaluer la compacité des formes urbaines. Il est conseillé de suivre celui qui a le plus de sens pour la collectivité, si elle ne dispose pas des informations pour renseigner les 3.

- Rapport annuel entre nouvelle surface construite ou réhabilitée sur des sites en reconversion (sites déjà urbanisés : friches industrielles, dents creuses, habitat insalubre...) / nouvelle surface construite en extension (en limite d'urbanisation ou sur des espaces naturels ou agricoles). La comptabilisation se fait sur la base des permis de construire. Pour une agglomération, le ratio de 2 (soit 1/3 en extension et 2/3 en renouvellement) est une bonne performance ; pour une ville-centre les objectifs visés pourront être plus élevés.

- Nombre de nouveaux logements collectifs et individuels groupés / nb total de logements autorisés dans l’année (disponibles dans la base SITADEL) la valeur moyenne des régions françaises est indiquée pour information (45 %).

- Part du foncier en friche : L’indicateur permet d’identifier et caractériser les gisements fonciers locaux qualifiés comme étant « en friche ». Les enjeux sont d’effectuer une veille foncière, d’anticiper la formation de friches et d’étudier la mutabilité des espaces en friche. Compacité des formes urbaines
