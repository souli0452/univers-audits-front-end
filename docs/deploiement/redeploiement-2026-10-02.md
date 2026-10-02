# Redéploiement du 2026-10-02 — alignement sur le workflow PGPD_GU V3

Ce guide suit celui du 2026-09-27 (`redeploiement-2026-09-27.md`) : mêmes chemins (`/opt/asce/deploy`), même `.env`,
mêmes scripts. Il ne remplace pas `deploiement-ubuntu.md`.

> **Préparé sans accès au serveur.** Les étapes sont à exécuter par vous sur `rpd`. Les sorties attendues sont
> indiquées pour que vous puissiez dire « OK » ou « écart » à chaque étape.
> **L'interface de cette version n'a pas été vue à l'écran avant ce guide** : passez d'abord les contrôles du §5
> sur un environnement de test si vous en avez un.

---

## 0. Ce qui change

| Où | Quoi | Effet visible |
|---|---|---|
| **Back** (`feature/alignement-workflow-pgpd`, dépôt back) | Migrations **020** (n° de courrier), **021** (rôle DCP), **022** (5 délais d'étapes), **023** (alerte de délai : colonne, type de notification, 2 modèles de message) ; convocation, quitus et lettre en PDF ; délais d'étapes par dossier ; alerte horaire ; retards d'étapes par acteur ; DCP autorisé sur les statistiques agrégées | Voir le front |
| **Front** (`feature/alignement-workflow-pgpd`, dépôt front) | N° de courrier à la saisie ; canaux « Presse / médias » et « Rapport d'audit » ; liste de destinataires de transmission ; boutons Convocation, Quitus, Lettre au plaignant ; carte « Délais du circuit de traitement » ; section « Étapes du circuit en retard » ; statistiques avec année précédente et période libre ; espace réduit aux statistiques pour le rôle DCP | Nouvelles fonctions |
| **Keycloak** | Rôle de royaume `DCP` à créer **à la main** (l'écran « Rôles & Permissions » de l'application ne le crée pas dans Keycloak) | Un agent DCP ne voit que les statistiques |

Rien à changer dans les fichiers de déploiement (`/opt/asce/deploy`) ni dans le `.env`.

---

## 1. Avant de commencer (sur `rpd`)

```bash
cd /opt/asce/deploy
```

**1.1 Suspendre le sondage automatique** (il redéploierait à chaque fusion) :
```bash
crontab -l | grep auto-deploy.sh ; cat build/state/last-deployed-front 2>/dev/null
crontab -l | grep -v auto-deploy.sh | crontab -
```

**1.2 Sauvegarder la base :**
```bash
bash scripts/backup.sh
```

**1.3 Vérifier l'historique des migrations** (ne pas sauter) :
```bash
docker compose exec -T postgres psql -U postgres -d bd_univers_audit -c "select count(*) as nb, max(filename) as derniere from databasechangelog"
```
Attendu : `nb = 19`, dernière = `…/019-portal-config-hotline-numero-vert.sql`.
**Autre résultat : arrêtez-vous** et envoyez-moi `select filename from databasechangelog order by orderexecuted;`.

**1.4 Place disque :** `df -h /` — au moins 5 Go libres.

---

## 2. Étape 1 — back : fusionner la pull request, puis déployer

1. GitHub → ouvrir la pull request depuis la branche `feature/alignement-workflow-pgpd` du dépôt back vers
   `feature/workflow-denociation-asce-fix` :
   <https://github.com/souli0452/univers-audits-back-end/pull/new/feature/alignement-workflow-pgpd>.
   Relire, puis **Merge**.
2. Sur `rpd` :
   ```bash
   cd /opt/asce/deploy && bash scripts/deploy.sh
   ```
   À ce moment le front déployé est l'ancien : il reste compatible avec le nouveau back.
3. Contrôles :
   ```bash
   docker compose logs backend | grep -i -E "changeset|Liquibase" | tail -8
   docker compose exec -T postgres psql -U postgres -d bd_univers_audit -tAc "select filename from databasechangelog order by orderexecuted desc limit 5"
   docker compose exec -T proxy wget -qO- http://backend:8081/actuator/health
   ```
   Attendu : 023, 022, 021, 020, 019 dans cet ordre ; `{"status":"UP"}` ; `smoke-test.sh` termine par
   `TOUS LES CONTROLES PASSENT`.

---

## 3. Étape 2 — Keycloak : créer le rôle `DCP`

Console d'administration Keycloak, royaume `asce-lc` :
1. **Realm roles → Create role** : nom exact `DCP` (majuscules), description « Direction de la Communication et de la Presse ».
2. Créer l'agent de la communication depuis l'écran **Agents** de l'application (le rôle `DCP` apparaît dans la liste
   des rôles une fois créé dans Keycloak), ou attribuer le rôle à un compte existant : **Users → compte → Role mapping → Assign role → DCP**.

---

## 4. Étape 3 — front : fusionner, puis déployer

**À faire seulement quand l'étape 1 est validée** (le front appelle les nouvelles routes du back).

1. GitHub → pull request depuis `feature/alignement-workflow-pgpd` vers `amandement_cge` (dépôt front) :
   <https://github.com/souli0452/univers-audits-front-end/pull/new/feature/alignement-workflow-pgpd>. **Merge.**
2. Sur `rpd` : `cd /opt/asce/deploy && bash scripts/deploy.sh`.

---

## 5. Contrôles finaux (20 minutes)

| # | Contrôle | Comment | Attendu |
|---|---|---|---|
| 1 | Rôle DCP | Se connecter avec un compte DCP | Menu : Statistiques, Profil, Notifications seulement, sans traits de séparation en trop ; aucun dossier accessible |
| 2 | N° de courrier | Nouveau dossier, canal « Courrier postal » | Champ « N° d'enregistrement du courrier » ; il apparaît sur la fiche |
| 3 | Canaux | Nouveau dossier | « Presse / médias » et « Rapport d'audit » proposés |
| 4 | Convocation | Séance planifiée contenant un dossier | Bouton « Convocation (PDF) » ; le PDF s'ouvre (date, membres, ordre du jour) |
| 5 | Quitus | Dossier avec décision du CGE | Bouton « Quitus du CGE » ; le PDF s'ouvre |
| 6 | Lettre | Dossier clos | Bouton « Lettre au plaignant » ; pas de nom pour un dépôt anonyme |
| 7 | Délais | Fiche d'un dossier en cours | Carte « Délais du circuit de traitement » avec échéance et temps restant |
| 8 | Paramètres | Paramètres métier | Cinq délais `ETAPE_*` modifiables |
| 9 | Dépassements | Page « Dépassements par acteur » | Section « Étapes du circuit en retard » par acteur (CGEA, CGE) |
| 10 | Statistiques | Page Statistiques | « Cette année » par défaut ; année précédente ; période personnalisée sur deux années |
| 11 | Transmission | Investigation → transmettre à l'autorité | Liste : Procureur du Faso, Cour des comptes, institution partenaire, autre |
| 12 | Alerte | Après une heure ouvrée suivant un retard réel | Notification « Délai d'étape dépassé » chez le CGEA et le CGE (un seul exemplaire par dossier et par étape) |

---

## 6. Retour arrière

**Automatique** : si le sondage est actif, il remet les images `:good` quand le test de fumée échoue.
**Manuel** (sondage suspendu) :
```bash
docker tag asce-lc-backend:good asce-lc-backend:latest && docker tag asce-lc-proxy:good asce-lc-proxy:latest
docker compose up -d --force-recreate backend proxy
```
**Base de données :** les migrations 020 à 023 ne cassent pas l'ancien back (colonnes facultatives, contrainte élargie),
**à une condition** : s'il existe déjà des notifications de type `ALERTE_DELAI_ETAPE`, l'ancien back ne sait pas les lire
(type inconnu). Avant un retour arrière du back, supprimez-les :
```bash
docker compose exec -T postgres psql -U postgres -d bd_univers_audit -c "delete from notification where type = 'ALERTE_DELAI_ETAPE'"
```
La sauvegarde du §1.2 reste le dernier recours.

## 7. Réactiver le sondage automatique
```bash
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/asce/deploy/scripts/auto-deploy.sh") | crontab -
```

---

## 8. Points de vigilance (honnêtes)

- **Premier passage de l'alerte :** dans l'heure qui suit le déploiement, le CGEA et le CGE recevront une alerte pour
  chaque étape dont l'échéance a été dépassée **depuis moins de 7 jours** (les retards plus anciens n'alertent pas, mais
  apparaissent sur la carte du dossier et sur la page des dépassements). Prévenez-les.
- **Alerte = notification dans l'application**, pas de courriel : l'envoi de courriels du back n'envoie rien aujourd'hui
  (journal seulement), pour toutes les alertes.
- **Textes des trois PDF provisoires** (convocation, quitus, lettre) : à remplacer par les modèles Word des utilisateurs.
- **Testé :** back 650 tests, 0 échec sur une base PostgreSQL jetable (les 23 migrations s'appliquent, le schéma est validé
  par Hibernate, les nouvelles requêtes s'exécutent) ; front 137 tests et compilation. Les PDF ont été relus en texte.
- **Non testé :** la connexion Keycloak réelle et les routes protégées avec un vrai jeton ; l'alerte horaire sur de vrais
  dossiers ; la montée de version sur la base réelle (d'où le §1.3) ; **le rendu à l'écran de toutes les nouvelles pages**.
- **Charge :** l'alerte et la page des dépassements relisent les dossiers ouverts à chaque passage (quelques requêtes par
  dossier). Sans problème au volume prévu (environ 500 dossiers par an) ; à surveiller si le volume augmente.
