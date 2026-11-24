# Salaire annuel moyen de la retraite de base

Le calcul couvre le régime général et la liquidation unique des régimes alignés (LURA) avec la MSA salariée. Le mode express utilise le salaire annuel moyen fourni.

## Années et revenus

- Examiner les années civiles depuis 1948, avant l’année de prise d’effet de la pension. Écarter l’année de liquidation et les années suivantes, les années uniquement assimilées et les années comprenant un rachat qui entraîne l’exclusion légale. [Code de la sécurité sociale, art. R. 351-29](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053335651/2026-01-01)
- Ne retenir que les revenus admissibles inscrits au compte, dont les salaires forfaitaires AVPF le cas échéant. Une ligne signalant une interruption avec du salaire déclaré peut comprendre un revenu admissible. Le traitement de la ligne permet de préciser ce cas, d’exclure une indemnité non admissible ou de signaler un rachat excluant l’année. Saisir les indemnités de maternité admissibles pour leur montant porté au compte. [CNAV 2024/28, § 3.2](https://legislation.lassuranceretraite.fr/Pdf/circulaire_cnav_2024_28_14102024.pdf) · [Code de la sécurité sociale, art. R. 351-29](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053335651/2026-01-01)
- Additionner les revenus admissibles d’une même année, y compris s’ils proviennent de la CNAV et de la MSA salariée. Appliquer le seuil de salaire permettant de valider un trimestre au total annuel. Appliquer un seul PASS annuel lorsque le plafond s’applique, puis revaloriser le salaire annuel retenu. Le PASS s’applique aussi aux années antérieures à 2005 en LURA. [Code de la sécurité sociale, art. L. 173-1-2](https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006073189&idArticle=LEGIARTI000028497986) · [CNAV 2017/27, § 4.2.1](https://legislation.lassuranceretraite.fr/Pdf/circulaire_cnav_2017_27_21072017.pdf) · [Seuils métropolitains de validation](https://www.lassuranceretraite.fr/sarn/jsp/acsarEstPopupTrimVal.jsp)
- Classer les années admissibles par revenu revalorisé et calculer la moyenne des années réellement sélectionnées. En dessous du plafond, utiliser toutes les années admissibles et leur nombre comme diviseur. Si aucune année n’est exploitable, afficher un résultat indisponible. [Service Public](https://www.service-public.gouv.fr/particuliers/vosdroits/F21552)

## Plafond du nombre d’années

Le plafond est de 25 années. Pour une pension à compter du 1er septembre 2026, il passe à 24 si une majoration ou une bonification admissible a été attribuée pour un enfant, et à 23 pour deux ou plus. La saisie distingue le nombre d’enfants du nombre pour lequel un droit admissible est attribué. Si le profil a des enfants et laisse cette dernière information inconnue, l’estimation retient provisoirement 25 années et indique le point à confirmer. [Code de la sécurité sociale, art. R. 173-3-2](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000054059837) · [Assurance retraite](https://www.lassuranceretraite.fr/portail-info/hors-menu/actualites-nationales/actif/2026/des-changements-dans-le-calcul.html)

## Cas d’acceptation

| Situation | Résultat attendu |
| --- | --- |
| Deux années admissibles et une année de liquidation avec un salaire plus élevé | Moyenne sur les deux années antérieures |
| Deux revenus cotisables de 900 € en 2024, CNAV et MSA salariée | Une seule année admissible, le total atteint le seuil de 1 747,50 € |
| Deux revenus éligibles dont la somme dépasse le PASS | Plafond annuel appliqué une seule fois avant revalorisation |
| Année avec chômage seul, année avec salaire AVPF au compte et année avec rachat excluant | Seul le salaire AVPF peut entrer dans le calcul si le seuil est atteint |
| Plusieurs enfants, aucune majoration admissible | Jusqu’à 25 années |
| Une majoration à compter du 1er septembre 2026, puis cas avec deux | Jusqu’à 24, puis 23 années |
| Aucune année admissible | SAM et pension de base indisponibles dans le bilan |

## Périmètre des montants

Le calcul réutilise les tables de PASS et de revalorisation déjà présentes dans le simulateur. La vérification intégrale de ces tables, des pensions particulières et des règles territoriales relève d’un chantier distinct. Lorsque le seuil métropolitain n’est pas disponible pour une année, un trimestre cotisé renseigné sert d’indice d’admissibilité. Les anciens fichiers CSV restent lisibles et la colonne facultative `TraitementSAM` conserve les choix de traitement lors d’un export puis d’un import.
