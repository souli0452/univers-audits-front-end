export default {
  id: 'P14',
  title: 'Transverse : erreurs, 404 et robustesse',
  access: 'Tous',
  intro: 'Comportement de l’application face aux erreurs et aux conditions dégradées. Le code ne gère pas globalement les erreurs 401 et 403 : chaque écran affiche son propre message.',
  cases: [
    {
      id: 'P14-01',
      title: 'Page 404 et pages d’erreur du gabarit',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Navigateur ouvert'],
      steps: [
        'Ouvrir https://denoncer.asce-lc.bf/#/notfound',
        'Cliquer sur « Retour à l’accueil »',
        'Ouvrir /#/auth/access puis /#/auth/error puis /#/auth/login'
      ],
      data: [],
      expected: [
        'La page 404 s’intitule « Page introuvable », le texte est en français, sans aucun texte factice (Frequently Asked Questions, Solution Center, Permission Manager) et le bouton « Retour à l’accueil » ramène à l’accueil du portail',
        '/#/auth/access affiche « Accès refusé » et /#/auth/error affiche « Une erreur est survenue », en français',
        '/#/auth/login n’affiche aucun formulaire : il redirige vers la connexion Keycloak (/#/app)'
      ]
    },
    {
      id: 'P14-02',
      title: 'Back arrêté : erreur claire côté agent et côté public',
      priority: 'Majeur',
      type: 'negatif',
      role: 'ADMIN_DDIC',
      preconditions: ['Session ouverte', 'Possibilité d’arrêter le service du back sur la VM (technicien)'],
      steps: [
        'Arrêter le service du back (nginx renverra une erreur 502)',
        'Ouvrir « Tous les dossiers » dans le menu',
        'Ouvrir /#/portail/suivi et lancer une recherche',
        'Redémarrer le back'
      ],
      data: [],
      expected: [
        'Aucun écran blanc : un message d’erreur s’affiche sur la liste et sur la recherche de suivi',
        'Après redémarrage du back, un rechargement rétablit les données'
      ],
      ui: ['Tous les dossiers']
    },
    {
      id: 'P14-03',
      title: 'Perte de réseau pendant l’usage',
      priority: 'Majeur',
      type: 'negatif',
      role: 'ADMIN_DDIC',
      preconditions: ['Session ouverte sur /#/app/dossiers', 'Onglet Réseau (F12) ouvert'],
      steps: [
        'Passer l’onglet Réseau en « Hors connexion »',
        'Cliquer sur « Nouveau dossier » puis tenter d’enregistrer',
        'Repasser en « En ligne » et refaire l’action'
      ],
      data: [],
      expected: [
        'Un message d’erreur s’affiche à l’enregistrement, la saisie est conservée',
        'Après retour du réseau, l’action aboutit et un seul dossier est créé'
      ],
      ui: ['Nouveau dossier']
    },
    {
      id: 'P14-04',
      title: 'Jeton expiré ou refusé (401)',
      priority: 'Majeur',
      type: 'negatif',
      role: 'ADMIN_DDIC',
      preconditions: ['Session ouverte'],
      steps: [
        'Dans Keycloak (administrateur), mettre fin à la session de l’agent',
        'Sur l’application, cliquer sur « Tous les dossiers »',
        'Observer la page'
      ],
      data: [],
      expected: [
        'L’agent est renvoyé à la connexion Keycloak ou reçoit un message clair',
        'Aucune donnée obsolète ne reste affichée comme si la session était valide'
      ],
      ui: ['Tous les dossiers'],
      aConfirmer: 'Le code n’a pas de traitement global de l’erreur 401 : seul l’échec de renouvellement du jeton déclenche la reconnexion. Comportement attendu à confirmer'
    },
    {
      id: 'P14-05',
      title: 'Action refusée par l’API (403)',
      priority: 'Majeur',
      type: 'securite',
      role: 'CONTROLEUR_ETAT',
      preconditions: ['Session ouverte avec le compte CONTROLEUR_ETAT', 'Dossier D-A (SOUMIS) existant'],
      steps: [
        'Ouvrir le dossier D-A depuis « Tous les dossiers »',
        'Tenter une action de traitement réservée à un autre rôle (par exemple une transition de statut) si un bouton est visible',
        'Si aucun bouton n’est visible, relever le comportement et le noter'
      ],
      data: [],
      expected: [
        'Si l’action est tentée, un message explique le refus et le statut du dossier ne change pas',
        'Aucune modification n’apparaît dans le journal d’audit'
      ],
      ui: ['Tous les dossiers'],
      aConfirmer: 'Le front ne gère pas globalement les 403 : message et rôles autorisés par action à confirmer avec le back'
    },
    {
      id: 'P14-06',
      title: 'Aucune violation de la CSP et appels /api/ et /auth/ en succès',
      priority: 'Critique',
      type: 'nominal',
      role: 'PUBLIC',
      regression: true,
      preconditions: ['Console et onglet Réseau (F12) ouverts', 'Cache vidé'],
      steps: [
        'Charger https://denoncer.asce-lc.bf/ et lire la console',
        'Charger /#/portail/deposer et /#/portail/vocal, lire la console',
        'Se connecter, charger /#/app et /#/app/dossiers, lire la console',
        'Dans l’onglet Réseau, filtrer « api » puis « auth » et lire les codes'
      ],
      data: [],
      expected: [
        'Aucun message « Refused to … because it violates the following Content Security Policy » en console',
        'Les requêtes vers https://denoncer.asce-lc.bf/api/v1 répondent 200 ou 201 (jamais bloquées ni en 404)',
        'Les requêtes vers https://denoncer.asce-lc.bf/auth répondent sans erreur'
      ],
      aConfirmer: 'La police Lato est chargée depuis https://fonts.cdnfonts.com (accès Internet requis) : si le réseau local n’y accède pas, l’application s’affiche avec une police par défaut. À décider : héberger la police sur la VM ou l’accepter'
    },
    {
      id: 'P14-07',
      title: 'Affichage sur téléphone (largeur 375 px)',
      priority: 'Mineur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Outils de développement en mode appareil mobile (375 px) ou téléphone réel'],
      steps: [
        'Ouvrir l’accueil et faire défiler toute la page',
        'Ouvrir /#/portail/deposer et parcourir les 3 étapes',
        'Ouvrir /#/portail/suivi et lancer une recherche'
      ],
      data: [],
      expected: [
        'Aucun défilement horizontal de la page',
        'Les boutons et champs sont utilisables au doigt et aucun texte n’est coupé',
        'Les icônes restent visibles'
      ]
    }
  ]
};
