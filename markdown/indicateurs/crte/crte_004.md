# Surface Agricole Utile totale
```yaml
id: crte_4.1
identifiant: 4.1
unite: ha

titre_long: Surface Agricole Utile totale du territoire
selection: yes
programmes:
  - crte
climat_pratic_ids:
  - urbanisme
  - agri_alim
thematiques:
  - urbanisme_et_amenagement
```
## Description

**Définition:** Surface Agricole Utile (SAU) totale du territoire
**Modalités de calcul:** Somme des surfaces agricoles utiles (SAU) du territoire
**Sources:** <a href="https://www.agencebio.org/vos-outils/les-chiffres-cles/">Agence bio</a> DRAAF/DDTM
**Périodicité:** Annuelle
**Objectif environnemental associé:** Lutte contre le changement climatique; Gestion de la ressource en eau; Biodiversité
**Politique publique:** Agriculture et alimentation durable
**Objectif stratégique:** Développement de l’agriculture biologique
**Objectif opérationnel national fixé par les documents de référence**: Stratégie “De la Ferme à la Fourchette” (F2F) UE ; Plan ambition bio - Loi Egalim :
- 15 % de SAU affectée à l’agriculture biologique au 31/12/2022 ; 30 % en 2030

# Surface agricole utile en agriculture biologique (AB) ou en conversion
```yaml
id: crte_4.2
identifiant: 4.2
unite: ha
parent: crte_4.1

titre_long: Surface agricole utile en agriculture biologique (AB) ou en conversion
programmes:
  - crte
climat_pratic_ids:
  - urbanisme
  - agri_alim
thematiques:
  - urbanisme_et_amenagement
  - agri_alim
```
## Description

**Définition:** Surfaces d’exploitations agricoles certifiée agriculture biologique (AB) ou en conversion.
**Modalités de calcul:** Somme des surfaces (en SAU) exploitées selon le label agriculture biologique (certifiée ou en conversion)
