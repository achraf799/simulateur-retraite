# simulateur-retraite

## Recette dans Chrome

Avec Node.js 22 ou 24 et Google Chrome installé, lancez `npm ci`, puis `npm run test:recette`.
La commande démarre le simulateur localement et vérifie les 25 cas de la campagne 2025.
Le tableau affiche les montants attendus et obtenus. La commande échoue si un montant, une décision de départ, une durée ou une règle de cumul diffère.

Pour rejouer une sélection, utilisez `npm run test:recette -- T10 T16 T21`.
Pour tester un autre serveur ou un déploiement, définissez `RECETTE_URL` avant de lancer la commande.

Les profils de test, les résultats attendus et les trois relevés détaillés sont dans `scripts/recette/fixtures/`.
T16 utilise les montants de la [circulaire CNAV 2025/08](https://legislation.lassuranceretraite.fr/Pdf/circulaire_cnav_2025_08_05032025.pdf).
