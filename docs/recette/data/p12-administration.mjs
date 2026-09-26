export default {
  id: 'P12',
  title: 'Administration',
  access: 'ADMIN_DDIC, CGE et CGEA (groupe « Administration » du menu) ; « File des notifications » : ADMIN_DDIC et CGEA ; « Registre des auditions » : CGEA et ADMIN_DDIC',
  intro: 'Gestion des agents (comptes Keycloak), des rôles et permissions, des paramètres du portail, des paramètres métier, du journal d’audit et de la file des notifications. Les rôles attribués à un agent sont créés directement dans Keycloak, et un e-mail permet à l’agent de définir son mot de passe.',
  cases: [
    {
      id: 'P12-01',
      title: 'Création d’un agent avec ses rôles',
      priority: 'Critique',
      type: 'nominal',
      role: 'ADMIN_DDIC',
      preconditions: ['Session ouverte avec le compte ADMIN_DDIC', 'Une adresse e-mail de test lisible par le testeur'],
      steps: [
        'Menu « Administration » puis « Agents », cliquer sur « Nouvel Agent »',
        'Renseigner le matricule, le prénom, le nom, l’e-mail, le téléphone et le grade',
        'Dans « Gérer les Permissions », cocher le rôle AGENT_BRPD',
        'Enregistrer puis lire la notification',
        'Ouvrir l’e-mail reçu, définir le mot de passe puis se connecter avec ce compte'
      ],
      data: ['Matricule : ASCE-901', 'Prénom : Agent ; nom : Recette', 'E-mail : adresse de test du testeur'],
      expected: [
        'La notification « Agent ASCE-901 créé — email envoyé » s’affiche, puis la liste des agents s’ouvre',
        'L’agent figure dans la liste avec le statut actif',
        'L’e-mail permet de définir le mot de passe et la connexion réussit',
        'Le menu de l’agent est celui du rôle AGENT_BRPD (voir P05-10)'
      ],
      ui: ['Agents', 'Nouvel Agent', 'Gérer les Permissions']
    },
    {
      id: 'P12-02',
      title: 'Modification, changement de rôle, désactivation et réactivation d’un agent',
      priority: 'Majeur',
      type: 'nominal',
      role: 'ADMIN_DDIC',
      preconditions: ['Agent créé en P12-01'],
      steps: [
        'Dans la liste des agents, ouvrir l’agent créé (« Modifier l\'agent »)',
        'Changer le téléphone et remplacer le rôle AGENT_BRPD par CONSEILLER_JURIDIQUE puis enregistrer',
        'Désactiver l’agent depuis la liste et confirmer « Voulez-vous désactiver l\'agent … ? »',
        'Tenter de se connecter avec ce compte',
        'Réactiver l’agent et confirmer'
      ],
      data: ['Nouveau téléphone : +226 70 00 00 09'],
      expected: [
        'La notification « Agent mis à jour » s’affiche et le nouveau rôle est actif à la prochaine connexion',
        'Après désactivation, la notification « Agent désactivé » s’affiche et la connexion est refusée',
        'Après réactivation, la connexion est de nouveau possible',
        'Le journal d’audit contient « Modifier agent », « Désactiver agent » et « Activer agent »'
      ],
      ui: ['Modifier l\'agent', 'Confirmation']
    },
    {
      id: 'P12-03',
      title: 'Rôles et permissions : consultation et modification',
      priority: 'Majeur',
      type: 'nominal',
      role: 'ADMIN_DDIC',
      preconditions: ['Session ouverte avec le compte ADMIN_DDIC'],
      steps: [
        'Menu « Administration » puis « Rôles & Permissions »',
        'Lire la liste des rôles avec leurs permissions',
        'Cliquer sur « Modifier » sur un rôle non protégé, changer une permission et enregistrer'
      ],
      data: [],
      expected: [
        'Les 8 rôles métier sont listés avec leur libellé et leurs permissions',
        'La modification est enregistrée et visible après rechargement',
        'Le journal d’audit contient « Modifier rôle »'
      ],
      ui: ['Rôles & Permissions', 'Modifier']
    },
    {
      id: 'P12-04',
      title: 'Création d’un rôle personnalisé',
      priority: 'Majeur',
      type: 'nominal',
      role: 'ADMIN_DDIC',
      preconditions: ['Session ouverte avec le compte ADMIN_DDIC'],
      steps: [
        'Cliquer sur « Nouveau rôle »',
        'Saisir le code, le libellé, la description, l’icône et la couleur, cocher des permissions',
        'Enregistrer',
        'Ouvrir « Nouvel Agent » et chercher le nouveau rôle dans « Gérer les Permissions »'
      ],
      data: ['Code : INSPECTEUR_TEST', 'Libellé : Inspecteur de test', 'Description : Rôle de recette'],
      expected: [
        'Le rôle apparaît dans la liste avec son libellé',
        'Le rôle est proposé lors de la création d’un agent (rôle disponible côté Keycloak)',
        'Le journal d’audit contient « Créer rôle »'
      ],
      ui: ['Nouveau rôle'],
      aConfirmer: 'Le nouveau rôle n’a d’effet métier que si le code du front et du back le reconnaît (gardes et menus sont écrits pour les 8 rôles connus) : portée réelle d’un rôle personnalisé à confirmer'
    },
    {
      id: 'P12-05',
      title: 'Un rôle protégé ne peut pas être supprimé',
      priority: 'Majeur',
      type: 'nominal',
      role: 'ADMIN_DDIC',
      preconditions: ['Un rôle protégé (cadenas) et un rôle personnalisé'],
      steps: [
        'Repérer le cadenas sur un rôle protégé, par exemple ADMIN_DDIC',
        'Survoler le bouton de suppression de ce rôle',
        'Supprimer le rôle personnalisé et lire la confirmation'
      ],
      data: [],
      expected: [
        'Le bouton de suppression d’un rôle protégé est désactivé avec l’infobulle « Rôle protégé »',
        'La suppression du rôle personnalisé demande confirmation (« Le rôle … sera désactivé. ») puis le retire de la liste',
        'Le journal d’audit contient « Supprimer rôle »'
      ],
      ui: ['Rôle protégé']
    },
    {
      id: 'P12-06',
      title: 'Paramètres du portail : contacts et réseaux repris sur l’accueil',
      priority: 'Majeur',
      type: 'nominal',
      role: 'ADMIN_DDIC',
      preconditions: ['Session ouverte avec le compte ADMIN_DDIC', 'Image de test photo.jpg de moins de 5 Mo'],
      steps: [
        'Menu « Administration » puis « Paramètres du portail »',
        'Modifier le numéro vert, l’e-mail, le site web, l’adresse et un lien de réseau social',
        'Cliquer sur « Choisir une image » et charger photo.jpg si un champ image est proposé',
        'Cliquer sur « Enregistrer tout »',
        'Cliquer sur « Aperçu portail » et lire le pied de page de l’accueil'
      ],
      data: ['Numéro vert : 80 00 11 12', 'E-mail : contact-recette@asce-lc.bf'],
      expected: [
        'La notification « Enregistré » indique le nombre de paramètres mis à jour',
        'Le pied de page de l’accueil affiche les nouvelles valeurs (voir P01-08)',
        'Sans modification, « Enregistrer tout » affiche « Aucune modification à enregistrer »',
        'Une image de plus de 5 Mo est refusée avec « Fichier trop grand »'
      ],
      ui: ['Paramètres du portail', 'Enregistrer tout', 'Aperçu portail', 'Choisir une image']
    },
    {
      id: 'P12-07',
      title: 'Paramètres métier : délais, jours fériés, indices, types, check-list',
      priority: 'Majeur',
      type: 'nominal',
      role: 'ADMIN_DDIC',
      preconditions: ['Session ouverte avec le compte ADMIN_DDIC'],
      steps: [
        'Menu « Administration » puis « Paramètres métier »',
        'Onglet « Délais » : modifier un délai dans « Modifier le paramètre de délai » et enregistrer',
        'Onglet « Jours fériés » : « Ajouter un jour férié » puis enregistrer',
        'Onglets « Indices de fraude », « Types d\'infraction » et « Check-list dossier » : ajouter un élément dans chacun'
      ],
      data: ['Jour férié : date de test avec libellé « Jour férié de recette »'],
      expected: [
        'Chaque enregistrement affiche sa notification (« Paramètre enregistré », « Jour férié enregistré », « Indice de fraude enregistré », « Type d\'infraction enregistré »)',
        'Les valeurs modifiées restent après rechargement',
        'Le nouveau point de check-list apparaît dans la check-list du dossier de travail d’une investigation (voir P08-08)'
      ],
      ui: ['Paramètres métier', 'Délais', 'Jours fériés', 'Indices de fraude', 'Types d\'infraction', 'Check-list dossier', 'Ajouter un jour férié'],
      aConfirmer: 'Un délai modifié s’applique-t-il aux dossiers déjà ouverts ou seulement aux nouveaux ? À confirmer avec le métier'
    },
    {
      id: 'P12-08',
      title: 'Journal d’audit : consultation et filtres',
      priority: 'Majeur',
      type: 'nominal',
      role: 'ADMIN_DDIC',
      preconditions: ['Des actions ont été réalisées lors des cas précédents'],
      steps: [
        'Menu « Administration » puis « Journal d\'audit »',
        'Filtrer avec « Toutes les actions » sur « Créer dossier » puis cliquer sur « Filtrer »',
        'Saisir « Nom ou matricule agent » puis « Filtrer »',
        'Cliquer sur « Réinitialiser » puis « Actualiser »',
        'Consulter le journal des connexions et le filtrer'
      ],
      data: ['Agent : le matricule de l’agent de test'],
      expected: [
        'Chaque filtre réduit la liste aux actions correspondantes et « Réinitialiser » rétablit la liste complète',
        'Chaque ligne montre l’action, l’agent et l’heure',
        'Les connexions et déconnexions des cas P05 figurent dans le journal des connexions'
      ],
      ui: ['Journal d\'audit', 'Nom ou matricule agent', 'Toutes les actions', 'Filtrer', 'Actualiser']
    },
    {
      id: 'P12-09',
      title: 'File des notifications : envoi, nouvelle tentative, annulation',
      priority: 'Majeur',
      type: 'nominal',
      role: 'ADMIN_DDIC',
      preconditions: ['Des notifications en file (créées par P07-03 et P02-01)', 'Session ouverte avec le compte ADMIN_DDIC'],
      steps: [
        'Menu « Administration » puis « File des notifications »',
        'Envoyer une notification en attente',
        'Sur une notification en échec, lancer une nouvelle tentative',
        'Ouvrir « Annuler la notification » sur une notification en attente et confirmer'
      ],
      data: [],
      expected: [
        'La notification « Notification envoyée » s’affiche à un envoi réussi, ou « Échec de l\'envoi » avec le statut restant dans la file',
        'La nouvelle tentative affiche « Nouvelle tentative lancée » et le nombre de tentatives augmente',
        'L’annulation affiche « Notification annulée » et la retire de la file active'
      ],
      ui: ['File d\'attente des notifications', 'Annuler la notification', 'Nouvelle tentative lancée']
    },
    {
      id: 'P12-10',
      title: 'Agent en doublon : matricule ou e-mail déjà utilisé',
      priority: 'Majeur',
      type: 'negatif',
      role: 'ADMIN_DDIC',
      preconditions: ['Agent ASCE-901 existant (voir P12-01)'],
      steps: [
        'Cliquer sur « Nouvel Agent »',
        'Saisir le matricule ASCE-901 et un e-mail nouveau puis enregistrer',
        'Saisir un nouveau matricule et l’e-mail de l’agent existant puis enregistrer'
      ],
      data: ['Matricule en doublon : ASCE-901'],
      expected: [
        'Un message d’erreur explicite s’affiche pour le matricule en doublon, puis pour l’e-mail en doublon',
        'Aucun second agent n’est créé dans la liste ni dans Keycloak'
      ],
      ui: ['Nouvel Agent'],
      aConfirmer: 'Le message affiché est celui du back (par défaut « Action impossible ») : libellé attendu à confirmer'
    },
    {
      id: 'P12-11',
      title: 'Champs obligatoires de l’agent',
      priority: 'Majeur',
      type: 'negatif',
      role: 'ADMIN_DDIC',
      preconditions: ['Formulaire « Nouvel Agent » ouvert'],
      steps: [
        'Laisser le matricule, le prénom, le nom et l’e-mail vides et tenter d’enregistrer',
        'Saisir « pas-un-email » dans l’e-mail et tenter d’enregistrer',
        'Saisir tous les champs obligatoires et enregistrer sans aucun rôle'
      ],
      data: ['E-mail invalide : pas-un-email'],
      expected: [
        'Les champs Matricule, Prénom, Nom et Email (marqués d’un astérisque) sont signalés et l’enregistrement est impossible',
        'Une adresse invalide est refusée',
        'Sans rôle, l’agent est soit refusé avec un message, soit créé sans accès métier (comportement à noter)'
      ]
    },
    {
      id: 'P12-12',
      title: 'Administration inaccessible par adresse directe à un rôle non autorisé',
      priority: 'Critique',
      type: 'securite',
      role: 'CONTROLEUR_ETAT',
      preconditions: ['Session ouverte avec le compte CONTROLEUR_ETAT', 'Comptes CGE et ADMIN_DDIC pour comparaison'],
      steps: [
        'Saisir /#/app/administration/roles',
        'Saisir /#/app/administration/agents puis /#/app/administration/audit',
        'Avec CGE, saisir /#/app/administration/notifications-queue (entrée absente du menu de ce rôle)'
      ],
      data: [],
      expected: [
        'CONTROLEUR_ETAT est redirigé vers /#/notfound pour chaque adresse, sans données affichées',
        'CGE ne doit pas pouvoir agir sur la file des notifications : redirection ou accès refusé attendu'
      ],
      aConfirmer: 'Seule l’entrée de menu « File des notifications » est masquée pour CGE ; la route elle-même n’a pas de garde dédiée (le parent « Administration » admet CGE) : CGE peut ouvrir la page par adresse directe. Comportement attendu à confirmer'
    }
  ]
};
