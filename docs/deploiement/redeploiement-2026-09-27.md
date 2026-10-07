# Redéploiement du 2026-09-27 — guide pas à pas

Ce guide complète `deploiement-ubuntu.md` (§8 « Mise à jour » et §12 « CI/CD »). Il regroupe **toutes** les
modifications et corrections faites depuis le dernier déploiement. Il ne remplace pas ce guide : les chemins
(`/opt/asce/deploy`), le `.env` et les scripts sont ceux qui existent déjà sur `rpd`.

> **Ce guide a été préparé sans accès au serveur.** Les étapes sont à exécuter par vous sur `rpd` ; les sorties
> attendues sont indiquées pour que vous puissiez dire « OK » ou « écart » à chaque étape.

---

## 0. Ce qui change

| Où | Quoi | Effet visible |
|---|---|---|
| **Front** (`amandement_cge`, déjà poussée) | Icônes visibles (la feuille de style n'est plus chargée par `media="print"` + `onload`, bloqué par la CSP) ; polices Lato hébergées (184 Ko au lieu de ~700 Ko chargés depuis un CDN tiers) ; API et Keycloak adressés sur l'origine de la page | Icônes affichées, chiffres de l'accueil réels, page plus rapide à charger |
| Front | Accueil : plus de cercle ni de radar, armoiries dans le pied de page, un seul bouton par action, numéro vert en haut, garanties sous le bouton | Nouvelle apparence de l'accueil |
| Front | Mobile : barre agent (bouton d'actions visible), boîte de dépôt, paramètres du portail, audio, zones de toucher ; logo ASCE-LC dans la barre agent | Utilisable sur téléphone |
| Front | Numéro vert **80 00 11 02** partout | Cohérence accueil / suivi / documents |
| **Front** (`release/2026-09-27`, à fusionner à l'étape 3) | Réponse du citoyen à une demande de complément (`/portail/complement`) | Nouvelle fonction |
| **Back** (PR n°2) | Endpoint public du complément ; migrations **018** (type d'observation) et **019** (numéro vert 80 00 11 02, sans écraser une saisie de l'administration) ; limiteur de débit par **vraie adresse du visiteur** derrière nginx | Limiteur juste : plus de quota partagé par tout le pays |
| **Overlay** (`deploy-rpd`, cette livraison) | nginx : `X-Forwarded-For` remplacé (pas allongé), compression gzip, cache long des fichiers à empreinte, `index.html` toujours revalidé. Dockerfile du proxy : vérifie la configuration de production au lieu de l'écraser, puis exécute des garde-fous sur le build. Test de fumée : nouveaux contrôles (icônes, polices, complément) | Chargement plus rapide, retours arrière plus sûrs |

**Fichiers de l'overlay modifiés** (les originaux sont dans `backup-avant-redeploiement-2026-09-27/`) :
`nginx/asce.conf.template`, `build/proxy.Dockerfile`, `scripts/smoke-test.sh`, `docs/redeploiement-2026-09-27.md`.
Le `.env` n'est **pas** touché et n'est **pas** dans l'archive.

---

## 1. Avant de commencer (5 minutes, sur `rpd`)

```bash
cd /opt/asce/deploy
```

**1.1 Le sondage automatique est-il actif ?** Le push de `amandement_cge` du 2026-09-26 (`c7ae7c7`) a pu être déployé tout seul.
```bash
crontab -l | grep auto-deploy.sh ; tail -20 /var/log/asce-deploy.log ; cat build/state/last-deployed-front 2>/dev/null
```
Si `last-deployed-front` vaut `c7ae7c7…`, l'accueil actuel est déjà déployé (rien à faire pour cette partie).

**1.2 Suspendre le sondage** pendant toute l'opération (il redéploierait à chaque fusion) :
```bash
crontab -l | grep -v auto-deploy.sh | crontab -
```

**1.3 Sauvegarder la base :**
```bash
bash scripts/backup.sh
```

**1.4 Vérifier l'historique des migrations** (à ne pas sauter) :
```bash
docker compose exec -T postgres psql -U postgres -d bd_univers_audit -c "select count(*) as nb, max(filename) as derniere from databasechangelog"
```
Attendu : `nb = 17`, `derniere = db/changelog/migrations/017-seed-notification-templates-affectation.sql`.
**Si l'écart est autre (moins de 17, ou une autre liste), arrêtez-vous** et envoyez-moi la sortie de
`select filename from databasechangelog order by orderexecuted;` : la baseline pourrait avoir été appliquée autrement
et Liquibase tenterait de rejouer des migrations déjà passées.

**1.5 Place disque** (les builds Docker en consomment) : `df -h /` — prévoir au moins 5 Go libres.

---

## 2. Étape 1 — copier les fichiers de déploiement modifiés

Depuis votre poste :
```bash
scp deploy-rpd-redeploiement-2026-09-27.tar.gz <utilisateur>@rpd:/tmp/
```
Sur `rpd` :
```bash
cd /opt/asce/deploy
tar tzf /tmp/deploy-rpd-redeploiement-2026-09-27.tar.gz            # doit lister 4 fichiers, aucun .env
tar xzf /tmp/deploy-rpd-redeploiement-2026-09-27.tar.gz -C /opt/asce/deploy
grep -c "remplacé\|REMPLACE" nginx/asce.conf.template              # attendu : au moins 1
bash -n scripts/smoke-test.sh && echo "syntaxe OK"
```

---

## 3. Étape 2 — back : fusionner la PR n°2, puis déployer

1. GitHub → <https://github.com/souli0452/univers-audits-back-end/pull/2> (base `feature/workflow-denociation-asce-fix`, tête `ebb6cf8`).
   Relire, puis **Merge**. La base n'a pas bougé depuis la création de la PR : aucun conflit attendu.
2. Sur `rpd` :
   ```bash
   cd /opt/asce/deploy && bash scripts/deploy.sh
   ```
   (À ce moment le front déployé est `amandement_cge` sans le complément : il est compatible avec le nouveau back.)
3. Contrôles :
   ```bash
   docker compose logs backend | grep -i -E "changeset|Liquibase" | tail -8
   docker compose exec -T postgres psql -U postgres -d bd_univers_audit -tAc "select filename from databasechangelog order by orderexecuted desc limit 3"
   docker compose exec -T proxy wget -qO- http://backend:8081/actuator/health
   ```
   Attendu : 019, 018, 017 dans cet ordre ; `{"status":"UP"}` ; `smoke-test.sh` termine par `TOUS LES CONTROLES PASSENT`
   (des lignes `WARN` sont possibles : elles n'échouent pas le test).

**Si une étape échoue** : voir §6.

---

## 4. Étape 3 — front : ajouter le complément citoyen

**À faire seulement quand l'étape 2 est validée** (le complément appelle l'endpoint ajouté par la PR n°2).

Sur mon poste (ou demandez-le-moi) :
```bash
git checkout amandement_cge && git merge --ff-only release/2026-09-27 && git push origin amandement_cge
```
Puis sur `rpd` : `cd /opt/asce/deploy && bash scripts/deploy.sh`.
Le nouveau contrôle du test de fumée « Complément citoyen présent dans le back » (code inconnu → 404) protège cet ordre :
si le front partait avant le back, il échouerait et le retour arrière automatique se déclencherait.

---

## 5. Étape 4 — contrôles finaux (10 minutes)

| # | Contrôle | Comment | Attendu |
|---|---|---|---|
| 1 | Icônes | Ouvrir `https://denoncer.asce-lc.bf/` (Ctrl+F5) | Loupes dans le titre, mégaphone, flèche, micro |
| 2 | Chiffres | Bas de l'accueil | Vrais chiffres (plus « 0+ / 0 / 0 ») |
| 3 | Numéro vert | En-tête, pied de page, page de suivi | 80 00 11 02. Si l'ancien s'affiche encore : le cache Redis le garde jusqu'à 10 min |
| 4 | Compression et cache | `curl -sI -H 'Accept-Encoding: gzip' https://denoncer.asce-lc.bf/main-*.js` (mettre le vrai nom) | `content-encoding: gzip`, `cache-control: public, immutable` |
| 5 | Limiteur par visiteur | Depuis **un** poste : `for i in $(seq 1 22); do curl -s -o /dev/null -w '%{http_code} ' https://denoncer.asce-lc.bf/api/v1/dossiers/public/track/ZZZZZZZZ; done` | environ 20 réponses 404 puis 429 ; **un autre poste** obtient encore 404 (le quota n'est plus partagé) |
| 6 | Connexion agent | Se connecter, ouvrir un dossier, cloche de notifications | Fonctionne ; sur téléphone le bouton « ⋮ » de la barre est visible |
| 7 | Complément (optionnel) | Agent : « Demander un complément » sur un dossier de test ; ouvrir `/#/portail/complement?code=<code>` ; répondre | « Réponse envoyée » ; observation « Réponse au complément » côté agent |

---

## 6. Retour arrière

**Automatique** : si le sondage est actif, il remet les images `:good` quand le test de fumée échoue.
**Manuel** (sondage suspendu) :
```bash
docker tag asce-lc-backend:good asce-lc-backend:latest && docker tag asce-lc-proxy:good asce-lc-proxy:latest
docker compose up -d --force-recreate backend proxy
```
**Base de données** : rien à défaire. La migration 018 *élargit* une contrainte et 019 change une valeur de configuration :
l'ancien back fonctionne avec la base migrée. Si nécessaire, la sauvegarde du §1.3 est là.
**Fichiers de déploiement** : recopier `backup-avant-redeploiement-2026-09-27/*` sur `/opt/asce/deploy/`.

## 7. Réactiver le sondage automatique
```bash
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/asce/deploy/scripts/auto-deploy.sh") | crontab -
```

---

## 8. Points de vigilance (honnêtes)

- **Non testé, faute d'accès à `rpd`** : la connexion Keycloak réelle, l'envoi d'e-mails/SMS, et la montée de version **sur votre base réelle**.
  Ce qui a été testé à la place : base **vide** → les 19 migrations s'appliquent et le numéro vert vaut 80 00 11 02 ; le SQL de la 019 a aussi été exécuté
  (puis annulé) sur la base de développement, qui contenait déjà la 018. Le §1.4 sert à détecter un écart sur la base du serveur.
- **Testé (2026-09-27)** :
  - back : 606 tests, 0 échec (les 11 tests dépendant du profil complet passent sur une base jetable) ;
  - front : 100 tests, build de production, 6 contrôles du build ;
  - **image du proxy construite avec vos Dockerfile et modèle nginx, à partir d'un clone frais de `release/2026-09-27`** (les garde-fous du build passent dans Docker) ;
  - nginx 1.27 : syntaxe validée ; HTTP/2 négocié ; gzip, cache d'un an, `index.html` en no-cache, en-têtes de sécurité conservés ;
  - **limiteur de débit derrière ce nginx, avec le back en `forward-headers-strategy=native`** : un visiteur bloqué après 20 requêtes, un en-tête
    `X-Forwarded-For` falsifié ne contourne pas le blocage, un autre visiteur n'est pas affecté ;
  - test de fumée (nouveaux contrôles) : 0 échec bloquant contre cette chaîne proxy → back.
  Non reproduit : Keycloak derrière ce proxy (le contrôle « émetteur public » et les jetons du test de fumée d'origine restent à passer sur `rpd`).
- **`ged.asce-lc.bf`** : les pages publiques fonctionnent maintenant sous n'importe quel nom qui atteint le proxy. En revanche la **connexion des
  agents** n'est prévue que sous `denoncer.asce-lc.bf` (Keycloak est fixé sur ce nom). Le certificat doit couvrir le nom utilisé.
- **`denoncer.asce-lc.bf` n'existe pas dans le DNS public** (vérifié le 2026-09-26 auprès de 8.8.8.8) : il doit être créé pour que les citoyens
  l'atteignent depuis Internet.
- Certificat à renouveler avant le **2027-03-08** (voir `deploiement-ubuntu.md` §13).
