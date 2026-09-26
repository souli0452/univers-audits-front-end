# Complément du citoyen sur le portail — design

Date : 2026-09-26
Statut : en attente de relecture
Dépôts concernés : `univers-audits-back-end` (branche de départ `feature/workflow-denociation-asce-fix`) et `univers-audits-front-end` (branche `amandement_cge`)

## 1. Objectif

Permettre à un citoyen dont le dossier est « Complément requis » de répondre depuis le portail, avec le seul code de suivi : lire ce qu'on lui demande, envoyer un message et des pièces, et faire repasser le dossier en étude sans intervention manuelle d'un agent.

Aujourd'hui le bouton « Soumettre mon complément » du suivi public mène à `/portail/complement`, une page qui n'existe pas (cas P04-04 du cahier de recette). Le citoyen ne voit pas non plus le motif de la demande : il ne le reçoit que par notification, et un dossier anonyme sans contact ne le reçoit jamais.

**Critères de réussite**
- Depuis « Complément requis », le citoyen arrive sur une page qui affiche le motif et l'échéance.
- Il envoie un message et/ou des fichiers ; le dossier passe de `EN_ATTENTE_COMPLEMENT` à `EN_ETUDE_OPPORTUNITE` et l'agent en charge est prévenu.
- Un dossier anonyme (sans coordonnées) peut répondre avec son seul code.
- Une réponse après l'échéance est acceptée et signalée « reçue en retard » à l'agent.
- Le bouton « Complément reçu » côté agent reste disponible pour les compléments reçus hors portail (courrier, guichet, téléphone).

## 2. Constats qui fondent le design

Lus dans le code du back le 2026-09-26 :

| Constat | Conséquence |
|---|---|
| `POST /api/v1/attachments/dossier/{id}` est public (`permitAll`) et accepte un `accessCode`. `DossierAccessGuard.checkAttachmentUploadAccess` exige ce code tant que le dossier est `SOUMIS` **ou `EN_ATTENTE_COMPLEMENT`**. | Le dépôt de fichiers protégé par le code existe. Il n'y a pas d'upload à réinventer, seulement à réutiliser en interne. |
| `requestComplement` enregistre le motif comme observation `COMPLEMENT_REQUEST` et fixe `additionalInfoDeadline`. | Le motif et l'échéance sont déjà en base. |
| Le suivi public (`GET /dossiers/public/track/{code}`) ne renvoie pas le motif. | Il faut un point d'entrée dédié pour l'exposer. |
| `validateTransition` autorise `EN_ETUDE_OPPORTUNITE` depuis `EN_ATTENTE_COMPLEMENT`. | Le changement de statut automatique réutilise une transition existante. |
| Défaut d'upload corrigé le même jour côté front (commit `1e34a08` sur `amandement_cge`) : le front n'envoyait pas l'`accessCode`. | Le complément s'appuie sur cette correction. |

## 3. Approche retenue

**Un dépôt atomique côté back** : un seul endpoint public reçoit le message et les fichiers ; le back enregistre tout, change le statut et prévient l'agent dans une seule opération. Alternative écartée : réutiliser l'upload existant puis faire un second appel pour le message et le statut, ce qui laisse des fichiers déposés sans changement de statut si le second appel échoue.

## 4. Back

Les deux routes sont ajoutées à `SecurityConfig` en `permitAll` ; le code de suivi sert de preuve, comme pour le suivi public.

### 4.1 `GET /api/v1/dossiers/public/complement/{accessCode}`

Réponse 200 :

```json
{
  "status": "EN_ATTENTE_COMPLEMENT",
  "motif": "Veuillez fournir les justificatifs de paiement",
  "requestedAt": "2026-09-20T09:12:00Z",
  "deadline": "2026-09-30T23:59:59Z",
  "overdue": false
}
```

- `motif` : contenu de la dernière observation `COMPLEMENT_REQUEST`.
- `deadline` : `additionalInfoDeadline`, peut être `null`. `overdue` : `deadline` non nul et dépassée.
- 404 : code inconnu (même message que le suivi : « Dossier introuvable avec ce code d'accès »).
- 409 : le dossier n'est pas `EN_ATTENTE_COMPLEMENT` (« Aucun complément n'est attendu pour ce dossier »).
- Aucune donnée d'identité ni aucun autre champ du dossier n'est renvoyé.

### 4.2 `POST /api/v1/dossiers/public/complement/{accessCode}`

Corps `multipart/form-data` :
- `message` : texte, 2 000 caractères maximum.
- `files` : 0 à 5 fichiers, 25 Mo maximum chacun, mêmes types autorisés que `AttachmentStorageService` (`ALLOWED_MIME_TYPES`).

Règles :
- Le message **ou** au moins un fichier est obligatoire (le front exige en plus un message de 10 caractères minimum).
- Le dossier doit être `EN_ATTENTE_COMPLEMENT`, sinon 409.

Effets, dans une seule transaction :
1. Les fichiers sont enregistrés par `AttachmentStorageService` (source `INITIAL_SUBMISSION`, mode d'obtention `VOLONTAIRE`, comme un dépôt public).
2. Une observation `COMPLEMENT_RESPONSE` (nouveau type) porte le message, non confidentielle. Si `deadline` est dépassée, le texte commence par « Reçu en retard (échéance du JJ/MM/AAAA) — ».
3. Le dossier passe à `EN_ETUDE_OPPORTUNITE` (transition validée par `validateTransition`, version incrémentée).
4. Une notification interne `COMPLEMENT_RECEIVED` (nouveau type) est envoyée à l'agent en charge par `NotificationDispatcher`.
5. Une action d'audit `RECEVOIR_COMPLEMENT` est journalisée (avec la mention « en retard » le cas échéant).

Réponse 200 :

```json
{ "status": "EN_ETUDE_OPPORTUNITE", "late": false, "filesUploaded": 2 }
```

Erreurs : 400 (ni message ni fichier, fichier trop gros, type refusé, plus de 5 fichiers), 404 (code inconnu), 409 (statut incorrect, y compris une seconde réponse simultanée).

Si l'enregistrement d'un fichier échoue, rien n'est enregistré (rollback) : le citoyen peut réessayer.

## 5. Front

### 5.1 Page `PortailComplement` — route `/portail/complement?code=…`

- La route est ajoutée à `portail.routes.ts`. Le lien existant du suivi (`[routerLink]="['/portail/complement']" [queryParams]="{code}"`) n'est pas modifié.
- Au chargement, appel du `GET` : affichage du motif, de l'échéance et, si `overdue`, d'un bandeau « L'échéance est dépassée, votre réponse sera tout de même transmise ».
- Formulaire : message (obligatoire, 10 caractères minimum), pièces jointes (5 fichiers, 25 Mo, mêmes extensions que le dépôt), bouton d'envoi.
- Envoi : un seul `POST` multipart, bouton désactivé pendant l'envoi (pas de double envoi).
- Succès : écran de confirmation avec « Suivre mon dossier » (retour vers `/portail/suivi?code=…`) et « Accueil ».
- Erreurs :
  - code manquant ou inconnu : « Code introuvable », lien vers le suivi ;
  - 409 au chargement : « Aucun complément n'est attendu pour ce dossier », lien vers le suivi ;
  - échec d'envoi : message, saisie et fichiers conservés ;
  - 409 à l'envoi : « Ce dossier a déjà reçu une réponse ».
- Le code de suivi et le message ne sont pas conservés dans le navigateur.

### 5.2 Service

`DossierService` reçoit `getComplementRequest(accessCode)` et `submitComplement(accessCode, message, files)`. Les deux appels utilisent `SKIP_AUTH` (aucun jeton n'est joint).

### 5.3 Côté agent

- Le type d'observation `COMPLEMENT_RESPONSE` est libellé « Réponse au complément » dans le détail du dossier (avec la liste des types d'observation existante) et s'affiche dans l'onglet « Observations ».
- Le type de notification `COMPLEMENT_RECEIVED` est libellé « Complément reçu » dans `notifications.component.ts`.
- L'action d'audit `RECEVOIR_COMPLEMENT` est ajoutée à la liste de filtre du journal d'audit.
- Le bouton « Complément reçu » n'est pas modifié.

## 6. Sécurité

- Le code de suivi (8 caractères) est la seule preuve. Aucune donnée d'identité n'est renvoyée : un dossier anonyme fonctionne.
- Le motif est visible de toute personne détenant le code ; la fenêtre de demande côté agent prévient déjà que « ce motif sera transmis au déclarant ».
- **Aucune limitation des essais n'existe côté back** (déjà relevé au cas P04-08). Elle est hors de ce lot mais devient plus importante avec une route publique qui écrit. À traiter juste après.
- Les fichiers reçus suivent les contrôles existants du dépôt (types autorisés, taille). Aucun fichier n'est exécuté ni servi sans authentification.

## 7. Déploiement et compatibilité

- **Ordre** : back d'abord, front ensuite. Un front déployé sans son endpoint affichera l'erreur « Code introuvable » sur la page.
- **Configuration serveur à vérifier** : la limite de taille d'envoi de nginx (`client_max_body_size`, 1 Mo par défaut) doit permettre au moins 5 × 25 Mo, et la limite multipart de Spring (`spring.servlet.multipart.max-file-size` et `max-request-size`) aussi. Sans cela, tout dépôt avec pièces jointes échoue aussi, complément ou non. À intégrer au spec du CI/CD (`deploy/nginx/denoncer.conf`).

## 8. Tests

**Back** (à adapter à l'outillage du dépôt, à vérifier avant le plan) : tests d'intégration des deux routes couvrant le succès avec message seul, avec fichiers seuls, avec les deux, en retard, code inconnu, statut incorrect, seconde réponse, ni message ni fichier, fichier trop gros ou de type refusé, et le rollback si un fichier échoue.

**Front** (Karma, `npm run test:ci`) : tests du service (SKIP_AUTH, champs du multipart), de la page (affichage du motif, bandeau de retard, message trop court refusé, envoi unique, succès, chaque erreur) et des libellés côté agent.

**Recette** : mise à jour de P04-04 et P07-04, ajout de cas (réponse dans les délais, en retard, dossier anonyme, code invalide, seconde réponse, fichier refusé, message seul, fichier seul).

## 9. Hors périmètre

- Limitation du nombre d'essais sur les routes publiques.
- Modifier ce que renvoie le suivi public (`enrichAndMaskDetail` renvoie encore beaucoup de champs : à examiner séparément).
- Envoi de SMS ou d'e-mail de confirmation au citoyen.
- Réponse à un complément par un agent pour le compte du citoyen (le bouton « Complément reçu » couvre ce cas).

## 10. Points à confirmer avant le plan

1. Outillage de test du dépôt back (JUnit/MockMvc, base de test) : à lire avant d'écrire le plan back.
2. Qui reçoit la notification `COMPLEMENT_RECEIVED` : l'agent en charge seulement, ou aussi les conseillers juridiques ? Le plan retient l'agent en charge, comme les autres notifications de dossier.
3. Limites de taille de nginx et de Spring sur la VM (section 7).
