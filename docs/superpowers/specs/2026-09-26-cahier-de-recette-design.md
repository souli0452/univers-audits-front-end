# Cahier de recette ASCE-LC — design

Date : 2026-09-26
Statut : en attente de relecture
Livrable : un fichier Word `.docx` (cahier de recette manuel)

## 1. Objectif

Fournir un cahier de recette avec des cas pratiques manuels, à dérouler sur la VM avant la mise en production, couvrant tous les processus de l'application. Il sert de base à un PV de recette signé (validé / validé avec réserves / refusé).

**Critères de réussite**
- Chaque processus de l'application est couvert par des cas nominaux, négatifs et de sécurité.
- Un testeur peut dérouler un cas sans lire le code : étapes précises, données à saisir, résultat attendu.
- Les libellés d'écran, boutons et statuts cités correspondent au code réel.
- Les anomalies se consignent dans le document, avec leur gravité.

## 2. Périmètre

Environnement testé : front `amandement_cge` sur la VM Ubuntu, avec le back `feature/workflow-denociation-asce-fix`. Test manuel uniquement.

Rôles couverts : `ADMIN_DDIC`, `CGE`, `CGEA`, `CONTROLEUR_ETAT`, `TEAM_LEADER`, `CONSEILLER_JURIDIQUE`, `AGENT_CJ`, `AGENT_BRPD`, et le citoyen anonyme du portail.

| # | Processus | Accès |
|---|---|---|
| P01 | Accueil du portail (icônes, liens, footer) | public |
| P02 | Dépôt de plainte public, nominatif et anonyme | public |
| P03 | Dépôt vocal | public |
| P04 | Suivi de dossier par code d'accès | public |
| P05 | Authentification et contrôle d'accès (Keycloak, guards par rôle) | tous |
| P06 | Création interne d'un dossier (formulaire, audio) | agents |
| P07 | Traitement : étude d'opportunité, complément, recevabilité, CTADP, transfert | agents |
| P08 | Investigation : cadrage, auditions, rapport final | agents |
| P09 | Décision et clôture | agents |
| P10 | Informations préoccupantes | `AGENT_BRPD`, `ADMIN_DDIC` |
| P11 | Rapports, statistiques, leçons à partager, registre des auditions | selon rôle |
| P12 | Administration : agents, rôles, paramètres, audit | `ADMIN_DDIC`, `CGE`, `CGEA` |
| P13 | Notifications et profil | connectés |
| P14 | Transverse : erreurs, page 404, session expirée | tous |

Cycle de vie d'un dossier à couvrir : `SOUMIS` → `RECU` → `EN_ETUDE_OPPORTUNITE` → (`EN_ATTENTE_COMPLEMENT` / `EN_REVUE_CTADP`) → `RECEVABLE` / `IRRECEVABLE` / `TRANSFERE` → `EN_INVESTIGATION` → `RAPPORT_PRODUIT` → `DECISION_RENDUE` → `CLOS` / `CLASSE`.

## 3. Structure du document

1. Page de garde : objet, URL de la VM, version (commit) testée, date.
2. Mode d'emploi : statuts (OK / KO / Bloqué / Non testé) et gravité des anomalies (Critique / Majeur / Mineur).
3. Comptes et données de test : un compte Keycloak par rôle, jeux de pièces jointes (PDF, image, audio), 3 dossiers de départ.
4. Chapitres P01 à P14.
5. Scénario de bout en bout : un dossier suivi du dépôt public jusqu'à `CLOS`.
6. Registre des anomalies et PV de recette (signatures, décision).

## 4. Format d'un cas

Tableau Word : **ID** (`P07-03`), **priorité**, **rôle**, **préconditions**, **étapes** numérotées, **données saisies**, **résultat attendu**, puis colonnes vides **Statut**, **Date**, **Testeur**, **Observation**.

Chaque processus contient trois types de cas :
- **Nominal** : le parcours qui doit fonctionner.
- **Négatif** : champ obligatoire vide, fichier refusé, transition de statut interdite, conflit de version (409).
- **Sécurité** : un rôle non autorisé tape directement l'URL, avec redirection ou refus attendu.

## 5. Priorités

Les cas suivants sont tous **Critique**, car ce sont les zones qui ont cassé récemment (historique git) :
- dépôt public de plainte et flag `anonymous` ;
- les 4 points d'entrée de création de dossier (`NatureSaisineResolver`) ;
- soumission du rapport final d'investigation ;
- appels API et CSP en production (URL `denoncer.asce-lc.bf`, `/api/`, `/auth/`).

Le cas **P01** inclut la vérification des icônes : les cercles « Faire un signalement » et « Suivre mon dossier » et les 4 boutons sociaux du footer doivent afficher leur icône. Le cas contrôle aussi que la police PrimeIcons se charge (onglet Réseau, `primeicons.woff2` en 200).

## 6. Volume et sources

144 cas (15 fichiers : P01 à P14 et un scénario de bout en bout). Les libellés, boutons, statuts et règles de rôle sont lus dans le code du front. Quand une règle métier n'est pas lisible côté front (par exemple un délai calculé par l'API), le cas est marqué **« à confirmer »**. Je ne l'invente pas.

## 7. Hors périmètre

- Tests automatisés (E2E, unitaires) : éventuelle phase ultérieure.
- CI/CD : spec séparé, `2026-09-26-ci-cd-front-design.md`, en pause.
- Tests de charge, de performance et d'accessibilité.
- Recette du back seul (API sans le front).

## 8. Risques

- **Accès aux comptes** : il faut des comptes Keycloak par rôle sur la VM. Sans eux, les cas des processus P06 à P12 ne peuvent pas être déroulés. Les comptes sont créés par vous ; le cahier liste ceux qui sont nécessaires.
- **Règles métier côté API** invisibles depuis le front, d'où la mention « à confirmer ».
- **Bug d'icônes** en cours sur la VM : P01 échouera tant que la config nginx n'est pas corrigée.
