# CI/CD du front ASCE-LC — design

Date : 2026-09-26
Statut : en attente de relecture


> **Note du 2026-09-27 — à lire avant de continuer.** Un déploiement continu **existe déjà** : `deploy-rpd/scripts/auto-deploy.sh`
> (sondage toutes les 5 minutes, retour arrière automatique, décrit dans `deploiement-ubuntu.md` §12) surveille `amandement_cge` et
> `feature/workflow-denociation-asce-fix`. Le présent document propose une **alternative** (GitHub Actions + runner auto-hébergé) écrite
> avant que ce sondage ne soit connu. Il n'est à retenir que si vous voulez remplacer le sondage ; sinon il sert de référence.
> Idées à reprendre du sondage actuel dans tous les cas : le garde-fou sur le résultat du build (`tests/build-output.test.mjs`) et les
> nouveaux contrôles de `smoke-test.sh` (icônes, polices, compression, cache).

## 1. Objectif

Remplacer le déploiement manuel du front sur la VM Ubuntu par un pipeline GitHub Actions reproductible, réversible et vérifié. Le pipeline doit aussi versionner la config nginx, aujourd'hui absente du dépôt, ce qui a rendu le bug d'icônes (police PrimeIcons non chargée sur la VM) impossible à diagnostiquer depuis le code.

**Critères de réussite**
- Un push sur `amandement_cge` construit, déploie et vérifie le front sur la VM sans intervention manuelle.
- Un déploiement raté ne casse jamais le site en service (retour automatique à la version précédente).
- La config nginx qui tourne sur la VM est celle du dépôt.
- Aucun secret dans le dépôt.

## 2. Contraintes établies

| Contrainte | Conséquence |
|---|---|
| La VM n'est joignable que sur le réseau local. | Un runner GitHub hébergé ne peut pas s'y connecter. On utilise un **runner auto-hébergé installé sur la VM** : la VM contacte GitHub en HTTPS sortant, aucun port entrant à ouvrir. |
| Le site est servi sur un seul domaine `denoncer.asce-lc.bf`, l'API sous `/api/` et Keycloak sous `/auth/`, proxifiés par nginx. | La config nginx fait partie du déploiement. |
| Branches de travail : front `amandement_cge`, back `feature/workflow-denociation-asce-fix`. | `amandement_cge` déclenche le CD. `main` et `dev` du front sont très en retard et ne déploient pas. |
| Pas de script `lint`, aucun fichier `.spec.ts` dans le front. | Le CI ne fait que compiler. On n'affiche pas de faux contrôles. |
| Build prod : `ng build`, config `production`, sortie `dist/<projet>/browser`. | Le job de build vérifie que ce dossier existe et contient `index.html` et `media/primeicons.woff2`. |

## 3. Architecture

Un workflow `.github/workflows/ci-cd.yml` avec deux jobs.

### Job `build` (runner GitHub, `ubuntu-latest`)
- Déclencheurs : `push` sur toutes les branches, `pull_request`, `workflow_dispatch`.
- Étapes : checkout, Node 22, `npm ci`, `npx ng build --configuration production`, contrôle de la sortie, publication de l'artefact `front-dist`.
- Concurrence : une exécution par branche, les plus anciennes sont annulées.

### Job `deploy` (runner auto-hébergé, étiquette `asce-vm`)
- Dépend de `build`.
- Se lance seulement si : `push` sur `amandement_cge`, ou `workflow_dispatch` (branche choisie à la main).
- Environnement GitHub `production` (approbation manuelle activable sans modifier le workflow).
- Concurrence : un seul déploiement à la fois, jamais annulé en cours de route.
- Étapes : télécharge l'artefact, appelle `deploy/deploy.sh`.

### `deploy/deploy.sh` (toute la logique de déploiement)
Le workflow ne contient pas de logique, il appelle ce script. Il peut aussi être lancé à la main sur la VM si GitHub est indisponible.

1. Décompresse le build dans `$DEPLOY_ROOT/releases/AAAAMMJJ-HHMMSS/`.
2. Mémorise la cible actuelle du lien `current`.
3. Bascule `current` vers la nouvelle version (lien symbolique remplacé de façon atomique).
4. `nginx -t` puis rechargement de nginx.
5. Contrôle HTTP local : `/` et `/media/primeicons.woff2` doivent répondre 200, et la police doit avoir un type `font/woff2` (pas `text/html`).
6. Si une étape 4 ou 5 échoue : retour du lien vers la version mémorisée, rechargement, sortie en erreur.
7. Sinon : suppression des versions au-delà des 5 dernières.

Paramètres (variables d'environnement, valeurs par défaut marquées) :
- `DEPLOY_ROOT` — défaut `/var/www/denoncer` **(à confirmer)**
- `HEALTH_URL` — défaut `http://127.0.0.1` avec en-tête `Host: denoncer.asce-lc.bf`
- `KEEP_RELEASES` — défaut `5`

### `deploy/nginx/denoncer.conf` (versionné)
- `root $DEPLOY_ROOT/current`, fallback SPA `try_files $uri $uri/ /index.html`.
- Types MIME explicites pour `woff2`, `woff`, `ttf`, `svg`, `eot`.
- Cache long et `immutable` pour les `.js`, `.css` et polices hachés ; `index.html` en `no-cache`.
- `location /api/` → back, `location /auth/` → Keycloak, avec `proxy_set_header Host`, `X-Forwarded-*`.
- Ports amont par défaut : back `127.0.0.1:8081`, Keycloak `127.0.0.1:8080` **(à confirmer)**.
- Cette config s'installe une fois à la main (voir section 5), puis évolue via le dépôt.

## 4. Sécurité

- Aucun secret dans le dépôt. Le runner s'authentifie auprès de GitHub avec un jeton d'enregistrement à usage unique, généré dans Settings → Actions → Runners.
- Le runner tourne sous un utilisateur dédié `deploy`, non administrateur, propriétaire de `$DEPLOY_ROOT`.
- Droits `sudo` limités à deux commandes exactes : `nginx -t` et `systemctl reload nginx`.
- Le dépôt est **public** : un runner auto-hébergé sur un dépôt public exécuterait le code de n'importe quelle PR venant d'un fork. Deux garde-fous obligatoires : `Settings → Actions → General → Fork pull request workflows → Require approval`, et le job `deploy` ne se lance jamais sur l'événement `pull_request`.
- `permissions: contents: read` au niveau du workflow, rien de plus.

## 5. Actions manuelles, faites par vous

Je ne peux pas les faire à distance. Le plan fournira les commandes exactes.
1. Créer l'utilisateur `deploy`, le dossier `$DEPLOY_ROOT`, la règle `sudoers`.
2. Installer le runner GitHub sur la VM avec l'étiquette `asce-vm`.
3. Copier une première fois `denoncer.conf` dans nginx, l'activer, tester.
4. Créer l'environnement `production` dans GitHub et activer l'approbation des PR de forks.

## 6. Hors périmètre

- **CI/CD du back** (`feature/workflow-denociation-asce-fix`) : dépôt séparé, stack différente. C'est un sous-projet à part, à traiter avec son propre spec.
- Tests unitaires et lint dans le pipeline : ajoutables quand ils existeront.
- Fusion des branches vers `main`, décision de votre côté.
- HTTPS et certificats.

## 7. Risques et points ouverts

1. **Compatibilité front/back** : le front `amandement_cge` peut appeler des endpoints présents seulement dans le back `-fix` (13 commits d'avance sur son `amandement_cge`). L'ordre de déploiement est : back d'abord, front ensuite.
2. **Valeurs à confirmer** : `DEPLOY_ROOT`, ports du back et de Keycloak, nom du fichier nginx réel sur la VM.
3. **Config nginx actuelle de la VM inconnue** : avant de remplacer, la comparer avec `denoncer.conf` pour ne pas perdre un réglage existant (`sudo nginx -T`).
4. **Aucune validation possible en local** du job `deploy` : le premier run réel sur la VM est le vrai test. Le script est écrit pour pouvoir être lancé et testé à la main avant d'activer le déclencheur.
5. **Bug d'icônes** : le contrôle de l'étape 5 du script vérifie exactement ce symptôme (`media/primeicons.woff2` doit sortir en `font/woff2`).

## 8. Vérification

- Local : `ng build --configuration production` réussit, la sortie contient `index.html` et `media/primeicons.woff2`.
- Le script `deploy.sh` est relu avec `shellcheck` si disponible, et testé sur un dossier temporaire avec un faux `nginx` pour valider la bascule et le retour en arrière.
- Sur GitHub : premier run en `workflow_dispatch` avant d'activer le déclenchement sur push.
