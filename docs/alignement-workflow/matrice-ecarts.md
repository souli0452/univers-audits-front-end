# Matrice d'écarts — workflow PGPD_GU V3 / application

Mise à jour du 2026-10-01, après les réponses des utilisateurs (Word « Décisions à valider »).
Taille : S = moins d'une journée, M = 1 à 3 jours, L = plus de 3 jours.
Le PDF de l'accusé de réception est produit par le back (`/pdf/accuse-reception/{id}`) ; les nouveaux documents suivent le même modèle.

## Décisions

| # | Sujet | Décision |
|---|---|---|
| 1 | Point d'entrée | L'application démarre au BRPD. Le courrier est géré par une autre application. Un seul champ optionnel : numéro d'enregistrement courrier. |
| 2 | Délais 48 h / 72 h / 3 j | Suivis avec alerte, uniquement les délais mesurables (8). Calcul en jours ouvrables, à l'heure près. **À confirmer par les utilisateurs : week-ends et fériés exclus ?** |
| 3 | Documents | Convocation, quitus, lettre d'information générés. Modèle provisoire, les modèles Word des utilisateurs viendront ensuite. |
| 4 | Destinataires de transmission | Liste (Procureur du Faso, Cour des comptes, institution partenaire). Pris par défaut, non confirmé. |
| 5 | DCP | Pas de communiqués. Accès aux statistiques globales, sans données personnelles. |
| 6 | Secrétariat (étapes 13-15) | Reste sur papier. La date d'imputation et la date de retour existent déjà. |
| 7 | Renseignement judiciaire, plan d'enquête | Rien à ajouter : plan d'investigation, mandat, requête au parquet et suivi pénal existent. À vérifier en démonstration. |

## Écarts à traiter

| # | Écart | Étapes | Front | Back | Taille | Décision |
|---|---|---|---|---|---|---|
| F | Destinataire de transmission en liste (`investigation-detail`, champ texte libre aujourd'hui) | 33 | Liste déroulante | Liste de valeurs, ou garder le texte libre | S | 4 |
| H | Rapport circonstancié rattaché à une saisine par rapport d'audit (canal `AUDIT_REPORT` existe) | 30 | À vérifier | À vérifier | S | acté |
| A | Numéro d'enregistrement courrier à la saisie | 1 | Un champ | Colonne + migration Liquibase + DTO | S | 1 |
| K | Accès de la DCP aux statistiques globales, sans dossiers ni données personnelles | 34 | Menu et garde de route | Rôle, permissions | S-M | 5 |
| C | Convocation du comité (PDF) | 7 | Bouton dans la séance CTADP | Endpoint PDF + modèle provisoire | M | 3 |
| D | Quitus du CGE (action + PDF) | 9 | Action « Donner quitus » | Horodatage + PDF | M | 3 |
| E | Lettre d'information du plaignant (PDF) | 16 | Bouton dans le dossier | Endpoint PDF + modèle provisoire | M | 3 |
| B | Suivi des 8 délais mesurables, avec alerte et escalade | 4, 5, 7-13 | Échéances et dépassements affichés | Paramètres de délai, calcul ouvrable à l'heure, escalade | L | 2 |

Délais mesurables (B) : 24 h BRPD (4), 72 h CGEA (5), 3 j convocation (7), 3 j séance (8), 15 j quitus (9), 3 j ouvrables accusé et lettre de suite (10-11), 72 h imputation CGE (12), 3 j affectation CGEA (13).
Non suivis, car hors application : 48 h courrier (1), 72 h CGE à la réception (2), 48 h secrétariat (14).

## Points à vérifier avant de coder B

- Le moteur d'escalade du back compte-t-il en jours entiers ou à l'heure près ?
- Le délai de grâce est de 3 jours : trop long pour un délai de 72 h. Prévoir une grâce plus courte ou nulle pour ces étapes.
- La table des jours fériés (`JourFerie`) existe et sert au calcul des jours ouvrables.

## Hors périmètre ou non traité

- Étapes 26 à 29 : missions de contrôle, autre application.
- Étapes 1-2 et 14-15 : courrier et secrétariat, autre application ou papier.
- Étape 34 : communiqués de la DCP, remplacés par l'accès aux statistiques (K).
- Back : A à E, K et B demandent une évolution du dépôt `souli0452/univers-audits-back-end`. Ordre de déploiement : back puis front.

## Ordre de réalisation

1. F, H.
2. A, K.
3. C, D, E (même mécanisme PDF).
4. B.

## État au 2026-10-02

| # | Écart | État |
|---|---|---|
| F | Destinataires de transmission en liste | Fait (front) |
| H | Canaux presse et rapport d'audit à la saisie | Fait (front) |
| A | N° d'enregistrement du courrier | Fait (back migration 020 + front) |
| K | Rôle DCP, espace restreint aux statistiques | Fait (back migration 021 + front) ; rôle Keycloak `DCP` à créer à la main |
| C | Convocation du comité (PDF) | Fait (back + front), modèle provisoire |
| D | Quitus du CGE (PDF) | Fait (back + front) : formalise la décision du CGE existante, pas de nouvel état |
| E | Lettre d'information du plaignant (PDF) | Fait (back + front), dossiers clos ou à décision rendue |
| B | Délais des étapes | **Faits** (back migrations 022 et 023 + front) : 5 étapes calculées par dossier avec carte « Délais du circuit de traitement » ; alerte automatique au CGEA et au CGE au dépassement (notification dans l'application, une par dossier et par étape, vérification horaire). |
| — | Statistiques et rapports | Année en cours par défaut, année précédente, période libre (front) |

### Délais suivis (phase 1)
Analyse du CGEA (72 h), convocation du comité (3 j), quitus du CGE (15 j), imputation du CGE (72 h), affectation du CGEA (3 j), en jours ouvrables, modifiables dans « Paramètres métier » (codes `ETAPE_*`).
Non suivis, faute de date enregistrée : 24 h BRPD (étape 4), tenue de la séance (étape 8), accusé et lettre de suite (étapes 10-11).

### Reste à faire
- Intégration des 5 étapes à la page « Dépassements par acteur ».
- Modèles Word des utilisateurs pour les trois documents.
- Pousser les branches, ouvrir les pull requests, déployer le back puis le front.
