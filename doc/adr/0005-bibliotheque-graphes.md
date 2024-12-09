# 5. Utiliser la bibliothèque de graphes Apache ECharts

Date: 2024-12-09

## Statut

Accepté

## Contexte

La bibliothèque de graphes [Nivo](https://github.com/plouc/nivo) est utilisée dans l'app et le site.

Cependant certains problèmes sont devenus bloquants lors de la réalisation des pages Trajectoire SNBC.

Plus spécifiquement la tentative de combinaison de deux couches distinctes, "objectifs/résultats" (line chart) et "secteurs" (stacked area chart), a posé problème :

- le calcul d'échelle automatique ne fonctionne pas correctement dans ce cas, et il a fallu déterminer "manuellement" les bornes min/max des graduations
- il s'est avéré impossible d'afficher l'infobulle au survol des valeurs objectifs/résultats antérieures aux valeurs de la trajectoire
- les valeurs négatives dans le cumul ne sont pas représentées correctement

Ces problèmes sont notamment dû au fait que l'encapsulation en composants React n'offre pas suffisament de souplesse de composition.

## Décision

Utiliser la bibliothèque [ECharts](https://echarts.apache.org/en/index.html).

## Conséquences

### Positives

1. Permet de mixer plusieurs types de graphes
2. Gère correctement les valeurs négatives et la détermination automatique des échelles
3. Très grande variété de types de graphes et d'exemples
Voir [la galerie](https://echarts.apache.org/examples/en/index.html).
4. Facilité de prototypage

    On peut expérimenter des variations en éditant directement le code de chaque exemple.

    Puis partager le résultat via une URL autonome qui contient ce code.

    Par exemple, lors de l'évaluation de ECharts, j'ai réalisé [ce proto](https://echarts.apache.org/examples/en/editor.html?c=area-stack&lang=ts&code=PYBwLglsB2AEC8sDeAoWs20mANgUwC5lN0w8APMIgcgBUAnAQwCs8BjMYCevagGhKwAzgFcARmUo0A1mADCAeQBM1TAF8BpYMByQQRVOlL0IAc1N56NRuQhD-ggPSOjsRjgDujAJ5CAygAWwB5yMGTQVFj0IniaRgBmwPQAtoxgZFawABQAJmmMAJQIAHzEruhsMEI6eAB0OMCmufkFANyC6DxgIvRwAAYAPDkQAG7FHbADIMJg3vjwAERiSTmWALTL6cDJRACMIOTCOhA5ran0phDQG8BbO7AADLUArDzJC8UAgtDQAJd4sCIAzExQAJEg8mBGABtB4AXVqNjsADV3DEADKMMR4HBqAaOEH4kDjcqwcGQxgTdC1VIgLK5IrwUqGUlGCDxbI5WojNEA-D82AiaCreJXPA5IpdHpwajUdqsoxS3qwLlCSwQPBCACSOQQAuowDErA47PsVPKAH5YINpkJZvMFudLtdOPpHi83h8BkIRqZYB4TmAAoslAAWBawAJ4MwBMCLACcEZGGo8ACFgORFg9HrBds9YOHYKKcDhFtAYHgPuaFVM0gEVYsALJKWBKAASuwAzBG7fRgNI8ItybVKg16Goe2A-wO1gGckHFrtJ9O8GscGK2IwQIs-0Kcsv-6u8kIAox6ExvCHWwtHCSFaz8T7TGCIbU1SZNQA5RjJPBqSYgsOPI4DEeIEsURLFH01ZGEQNoQU-_qBsGCy7IWUYxnGqEPEmKbppmCzZtmaG5jhRYQCWZYVlW973gMPAcEh84oWhEYYaYsaLmR9AEUoEbFqWCzDqOSQTreMGko-vp3rRrjDu-GpCN-v7_sCL5csBoH4oSjjEn08r3moBTmrUzBcNAWSygUYHDGM-mCBoghIkIAAK5kZAYEyzCAhCwNQbB9kI9hxK4OBYjinkKmIjBsNIpi7sKoRjjQADEABsjAAOzxgAHM8qikmoDnqHE-AWMKkVGJsnD3A8IWwBAlTQDQCU5AASuwYAOK4FJENCEzUH4nV4D0ubdeUg3DaNKj1egk0cCN9CwJ242uPNZCjaGq1GOti2wPls1lKy0A_r51AKEanWmttriNTANDrtAvCHegEBkMkfj2r5LJRSslhJUkqUPA8jDxMDN3lMs9CrPQADqyFEJ2L1VX99AACKMCeCjxPEaqREoyPoFDMNtYwwwiEIRAEzBxOWLQ3g-TQx5RjkBWskVhWHT95Qnb-NBtb8oi6GkwXmndzV-Y9z1i-9n1zN9NOowDmTUCl8RYhDri03DCOtoTsDaxjWM43jVP69r9OM351Trqz5oc-UDvoHCJWYJwOjLOQlXoPEeBpD0CukkIjAjHgnzaqkFje-U2D4DQtC_DgvxsKeFyWBDjmuA7mewPFJzR_g8SRNQnYAKTbSYHHF6G5f1dV2w0JlteCE1UJXJi2I4EQU4xK76DkJ8tiU7A_WuNzpAM2dm5kKYSTeBDyx7me3gAOJbkQ6s4Gqh29SPSjA88fCtg8eZH_vuxpWfJ-ZVfuw5bf8ZX_vT-7HCh3OR3EVHeUziwH2UJkERofc0Torh7FDBMJ2sAHZv0wN4Qedg-qCHHlgSeNBNK8GKs7OIClNRILHhMXmZ0hoLVGrsCG3kzpSwhnaGK0h463HcBDM8fs5Zx2QDnVweBkggFPEIRB39yiJDYBTGguCzScwmLvaE0ARAliPjlZ-sB4ydgJsok-R8VGhiPrsJQ8Y6q5k7J2AxXZ96wNJCJFWKUsTPHVmINm6BOGCPQEQmgJCNpLRml5NBksxQ0KhLFBhUIcDMJ4IwNhgdWSgBim9bwRAnjPEgYdbhvDMYCJQT7YAIjh7UHEQ4owTj0DSNkfI3MSjTE6I0YY7R6iz7GLPrseE9UnEoNcX5dxe0VqHUoQ9Pxh1aGBL8rQRhIT35hIiQYQpsAUl8PSeaYRojrbqk1PkxxO98h9RKTgM-5TFE6PjLsOpNS9EGKMacxpLss71VaadNxU0lpbW6T46g1D-kBPoUMkZoTWFfUmcknhszh4ZKLFkxZuTlkSMdusqEmy5HbNgGsU-CKlBI2RQYtY9SEWhnRc8VFawDmXIKdcwhtz2n3P2hQ55ryJgDI-XQL5by6GfSYDPOJfl3CjImCw8JvyOH_NSfwoF8zQU5LyUkqRGyR5bMqacvFmKMVysfgi3FR81iZSUIStZyCJj5z8oaY0kBcYQzaedS6JojVPKti8vpNL3lEGlVy8ZvKHWkilhM5xRgel-WZuKVZ0DoWMD6nfYGOjMohtzCotRux9GHIjZ2Y5Jy6mYqUM8MxDliWkl1dQHgQsAGi1JCagWuaRaUqtdSoOdrYAuvKNy911aeqSuhNG8NaFw37yqe2w-x9Gln1DPos-uKDFKDSmYw6ljUp2Ihlg2ALs1CtCAA), pour tester la possibilité de superposer surfaces et lignes, que j'ai pu ensuite facilement partager avec la PO.

5. Documentation exhaustive

    et souvent interactive de [toutes les options](https://echarts.apache.org/en/option.html)

    Offre aussi des raccourcis classés [par composants](https://echarts.apache.org/en/cheat-sheet.html) facilitant la découvrabilité.

6. Projet pérenne

    - Soutenu par la fondation Apache
    - Existe depuis 2018
    - 60k+ stars GH
    - Maintenu par de nombreux contributeurs
    - Non spécifique à React

7. Autres fonctionnalités

    [Support SSR](https://echarts.apache.org/handbook/en/how-to/cross-platform/server/#server-side-rendering)

    [Gestion des données intégrées](https://echarts.apache.org/handbook/en/concepts/dataset)

    [Éditeur de thèmes](https://echarts.apache.org/en/theme-builder.html)

### Négatives

1. Nouvelle API à apprendre

2. Remplacer les graphes existants

Et notamment ceux des indicateurs pour afficher correctement les valeurs négatives

## Alternatives considérées

Les autres bibliothèques du marché (recharts, victory, etc.) sont souvent moins riches fonctionnellement, plus difficilement personnalisables (pour certaines) et avec un système d'exemples/playground moins pratique.

Le support SSR semble également être plus rare dans ces alternatives.

[Cet article](https://theaverageprogrammer.hashnode.dev/choosing-the-right-charting-library-for-your-nextjs-dashboard) compare ECharts à plusieurs alternatives.
