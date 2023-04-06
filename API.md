# API publique

## Labellisation

Pour obtenir les informations sur les dernières labellisations des collectivités de notre plateforme au format csv ou json.

### Variables
- `API_URL`: L'URL pour accéder notre API.
- `API_KEY`: La clef d'API.
- `FORMAT`: `text/csv` ou `application/json` selon le format attendu.
   
### Exemples
   
Une requête http :
```http request
GET {{API_URL}}/rest/v1/stats_derniere_labellisation
apikey: {{API_KEY}}
Authorization: Bearer {{API_KEY}}
Accept: {{FORMAT}}
```
 
Équivalent curl :
```sh 
curl -X GET \
     -H "apikey: $API_KEY" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Accept: $FORMAT" \
"$API_URL/rest/v1/stats_derniere_labellisation"
```

Les 3 premières collectivités obtenues :

```json
[
  {
    "collectivite_id": 59,
    "nom": "Saint-Quentin",
    "type_collectivite": "commune",
    "nature_collectivite": "commune",
    "code_siren_insee": "02691",
    "region_name": "Hauts-de-France",
    "region_code": "32",
    "departement_name": "Aisne",
    "departement_code": "02",
    "population_totale": 54851,
    "departement_iso_3166": "FR-02",
    "region_iso_3166": "FR-HDF",
    "referentiel": "cae",
    "etoiles": 1,
    "score_programme": null,
    "score_realise": null,
    "annee": 2021
  },
  {
    "collectivite_id": 248,
    "nom": "Châteaurenard",
    "type_collectivite": "commune",
    "nature_collectivite": "commune",
    "code_siren_insee": "13027",
    "region_name": "Provence-Alpes-Côte d'Azur",
    "region_code": "93",
    "departement_name": "Bouches-du-Rhône",
    "departement_code": "13",
    "population_totale": 16315,
    "departement_iso_3166": "FR-13",
    "region_iso_3166": "FR-PAC",
    "referentiel": "cae",
    "etoiles": 1,
    "score_programme": null,
    "score_realise": null,
    "annee": 2021
  },
  {
    "collectivite_id": 260,
    "nom": "Gardanne",
    "type_collectivite": "commune",
    "nature_collectivite": "commune",
    "code_siren_insee": "13041",
    "region_name": "Provence-Alpes-Côte d'Azur",
    "region_code": "93",
    "departement_name": "Bouches-du-Rhône",
    "departement_code": "13",
    "population_totale": 21859,
    "departement_iso_3166": "FR-13",
    "region_iso_3166": "FR-PAC",
    "referentiel": "cae",
    "etoiles": 2,
    "score_programme": 57.8,
    "score_realise": 46,
    "annee": 2022
  }
]
```
