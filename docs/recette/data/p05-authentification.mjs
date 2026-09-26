export default {
  id: 'P05',
  title: 'Authentification et contrôle d’accès',
  access: 'Tous les rôles (connexion Keycloak, realm asce-lc)',
  intro: 'Le portail public est libre. Tout ce qui est sous /app exige une session Keycloak. Les gardes par rôle (roleGuard) redirigent vers la page /notfound (il n’existe pas de page « accès refusé » utilisée) et le menu masque les entrées non autorisées.',
  cases: [
    {
      id: 'P05-01',
      title: 'Connexion Keycloak d’un agent et arrivée sur le tableau de bord',
      priority: 'Critique',
      type: 'nominal',
      role: 'ADMIN_DDIC',
      preconditions: ['Compte ADMIN_DDIC actif sur Keycloak', 'Aucune session ouverte (navigation privée)'],
      steps: [
        'Ouvrir https://denoncer.asce-lc.bf/#/app',
        'Sur la page de connexion Keycloak, saisir l’identifiant et le mot de passe du compte',
        'Valider et attendre la redirection'
      ],
      data: ['Compte : ADMIN_DDIC de la recette'],
      expected: [
        'La page de connexion Keycloak au thème ASCE-LC s’affiche (adresse sous /auth/)',
        'Après validation, retour sur /#/app avec le tableau de bord et le menu latéral',
        'Le nom de l’agent apparaît dans la barre du haut ou dans le profil'
      ],
      ui: ['Tableau de bord']
    },
    {
      id: 'P05-02',
      title: 'Déconnexion',
      priority: 'Majeur',
      type: 'nominal',
      role: 'ADMIN_DDIC',
      preconditions: ['Session ouverte sur /#/app'],
      steps: [
        'Dans le menu latéral, groupe « Compte », cliquer sur « Se déconnecter »',
        'Observer la page affichée',
        'Ouvrir de nouveau https://denoncer.asce-lc.bf/#/app'
      ],
      data: [],
      expected: [
        'Retour sur le portail public (/#/portail)',
        'L’ouverture de /#/app redemande l’identifiant et le mot de passe : la session est bien fermée'
      ],
      ui: ['Se déconnecter']
    },
    {
      id: 'P05-03',
      title: 'Accès à /#/app sans session : redirection vers la connexion',
      priority: 'Critique',
      type: 'securite',
      role: 'PUBLIC',
      preconditions: ['Navigation privée, aucune session'],
      steps: [
        'Ouvrir directement https://denoncer.asce-lc.bf/#/app/dossiers',
        'Ouvrir ensuite /#/app/administration/agents',
        'Ouvrir ensuite /#/app/profil'
      ],
      data: [],
      expected: [
        'Chaque adresse redirige vers la page de connexion Keycloak',
        'Aucune donnée de dossier n’est affichée avant la connexion'
      ]
    },
    {
      id: 'P05-04',
      title: 'Administration interdite à un rôle non autorisé',
      priority: 'Critique',
      type: 'securite',
      role: 'AGENT_BRPD',
      preconditions: ['Session ouverte avec le compte AGENT_BRPD (seul rôle attribué)'],
      steps: [
        'Vérifier l’absence du groupe « Administration » dans le menu',
        'Saisir directement l’adresse https://denoncer.asce-lc.bf/#/app/administration/agents',
        'Saisir ensuite /#/app/administration/roles'
      ],
      data: [],
      expected: [
        'Le groupe « Administration » n’est pas visible dans le menu',
        'Chaque adresse redirige vers /#/notfound et aucune liste d’agents ni de rôles n’est affichée'
      ],
      ui: ['Administration']
    },
    {
      id: 'P05-05',
      title: 'Informations préoccupantes interdites hors AGENT_BRPD et ADMIN_DDIC',
      priority: 'Critique',
      type: 'securite',
      role: 'CGE',
      preconditions: ['Session ouverte avec le compte CGE (sans rôle AGENT_BRPD ni ADMIN_DDIC)'],
      steps: [
        'Chercher « Informations préoccupantes » dans le menu « Bureau des plaintes »',
        'Saisir directement l’adresse https://denoncer.asce-lc.bf/#/app/informations-preoccupantes'
      ],
      data: [],
      expected: [
        'L’entrée « Informations préoccupantes » n’est pas visible dans le menu',
        'L’adresse directe redirige vers /#/notfound'
      ],
      ui: ['Informations préoccupantes']
    },
    {
      id: 'P05-06',
      title: 'Registre des auditions interdit hors CGEA et ADMIN_DDIC',
      priority: 'Majeur',
      type: 'securite',
      role: 'CONTROLEUR_ETAT',
      preconditions: ['Session ouverte avec le compte CONTROLEUR_ETAT'],
      steps: [
        'Chercher « Registre des auditions » dans le menu',
        'Saisir directement l’adresse https://denoncer.asce-lc.bf/#/app/registre-auditions',
        'Se reconnecter avec le compte CGE et chercher l’entrée dans le groupe « Administration »'
      ],
      data: [],
      expected: [
        'CONTROLEUR_ETAT : entrée absente du menu et adresse directe redirigée vers /#/notfound',
        'CGE : l’entrée « Registre des auditions » est absente du groupe « Administration » et l’adresse directe redirige aussi vers /#/notfound'
      ],
      ui: ['Registre des auditions', 'Administration']
    },
    {
      id: 'P05-07',
      title: 'Dépassements par acteur interdit hors ADMIN_DDIC, CGE, CGEA',
      priority: 'Majeur',
      type: 'securite',
      role: 'CONTROLEUR_ETAT',
      preconditions: ['Session ouverte avec le compte CONTROLEUR_ETAT'],
      steps: [
        'Saisir directement l’adresse https://denoncer.asce-lc.bf/#/app/statistiques/depassements-par-acteur',
        'Ouvrir la page des statistiques /#/app/statistiques par le menu'
      ],
      data: [],
      expected: [
        'L’adresse « depassements-par-acteur » redirige vers /#/notfound',
        'La page « Statistiques » générale reste accessible'
      ],
      ui: ['Dépassements par acteur']
    },
    {
      id: 'P05-08',
      title: 'Mot de passe erroné',
      priority: 'Majeur',
      type: 'negatif',
      role: 'ADMIN_DDIC',
      preconditions: ['Page de connexion Keycloak affichée'],
      steps: [
        'Saisir l’identifiant de l’agent et un mot de passe faux',
        'Valider',
        'Répéter avec un identifiant inexistant'
      ],
      data: ['Mot de passe : Faux-Mot-De-Passe-1'],
      expected: [
        'Un message d’erreur s’affiche sur la page Keycloak et aucune session n’est ouverte',
        'Le message ne révèle pas si c’est l’identifiant ou le mot de passe qui est faux'
      ],
      aConfirmer: 'Libellé exact du message et blocage du compte après N échecs : dépendent de la configuration et du thème Keycloak asce-lc'
    },
    {
      id: 'P05-09',
      title: 'Session expirée en cours d’usage',
      priority: 'Majeur',
      type: 'negatif',
      role: 'ADMIN_DDIC',
      preconditions: ['Session ouverte', 'Durée de vie du jeton d’accès connue (paramètre Keycloak)'],
      steps: [
        'Rester inactif au-delà de la durée de session Keycloak',
        'Cliquer sur « Tous les dossiers » dans le menu',
        'Observer la page'
      ],
      data: [],
      expected: [
        'L’agent est redirigé vers la connexion Keycloak, sans écran blanc ni boucle de redirection',
        'Après reconnexion, il retrouve l’application sur /#/app'
      ],
      ui: ['Tous les dossiers'],
      aConfirmer: 'Durée de session et de rafraîchissement du jeton à préciser (le front renouvelle le jeton 30 secondes avant expiration). Une saisie en cours est perdue à la reconnexion'
    },
    {
      id: 'P05-10',
      title: 'Le menu n’affiche que les entrées autorisées pour le rôle',
      priority: 'Majeur',
      type: 'nominal',
      role: 'AGENT_BRPD',
      preconditions: ['Session ouverte avec le compte AGENT_BRPD'],
      steps: [
        'Lire tous les groupes du menu latéral',
        'Se reconnecter avec ADMIN_DDIC et comparer',
        'Se reconnecter avec CGE et comparer'
      ],
      data: [],
      expected: [
        'AGENT_BRPD voit « Informations préoccupantes » et ne voit pas le groupe « Administration »',
        'ADMIN_DDIC voit toutes les entrées dont « Registre des auditions » et « File des notifications »',
        'CGE voit le groupe « Administration » sans « Registre des auditions » ni « File des notifications » et sans « Informations préoccupantes »'
      ],
      ui: ['Informations préoccupantes', 'Administration', 'File des notifications'],
      aConfirmer: 'Comportement d’un compte Keycloak sans aucun des 8 rôles métier : l’accès à /#/app et au tableau de bord n’est protégé que par la connexion'
    }
  ]
};
