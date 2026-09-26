export default {
  id: 'P13',
  title: 'Notifications et profil',
  access: 'Tous les agents connectés (cloche de la barre du haut, /#/app/notifications, /#/app/profil)',
  intro: 'Notifications internes (changements de statut, alertes, escalades) et page de profil (informations, mot de passe, rôles). Types reconnus par l’écran : alertes « J-3 » (délai, complément, investigation, demande de documents) et escalades (AR, complément, investigation, demande de documents).',
  cases: [
    {
      id: 'P13-01',
      title: 'Notification reçue lors d’un changement de statut',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Session ouverte avec le compte CGE dans un navigateur', 'Un autre agent va faire avancer un dossier concernant CGE (par exemple P07-05)'],
      steps: [
        'Noter le compteur de la cloche de la barre du haut',
        'Depuis un autre compte, soumettre un dossier au CTADP',
        'Attendre le rafraîchissement ou recharger la page',
        'Cliquer sur la cloche et lire la liste'
      ],
      data: [],
      expected: [
        'Le compteur de la cloche augmente d’une unité (affiché 99+ au-delà de 99)',
        'La notification du dossier apparaît en tête de la liste avec un texte lisible',
        'Le panneau affiche « Aucune notification » quand la liste est vide'
      ],
      ui: ['Voir toutes mes notifications', 'Aucune notification'],
      aConfirmer: 'Qui reçoit quelle notification (destinataires par événement) et fréquence de rafraîchissement du compteur à confirmer'
    },
    {
      id: 'P13-02',
      title: 'Page « Mes notifications » : filtres et marquage comme lu',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Plusieurs notifications non lues de types variés'],
      steps: [
        'Cliquer sur « Voir toutes mes notifications »',
        'Lire le compteur « x notification(s) · y non lue(s) »',
        'Utiliser les onglets « Toutes », « Non lues », « Investigations », « Alertes », « Mises à jour »',
        'Cliquer sur une notification puis sur « Tout marquer comme lu »'
      ],
      data: [],
      expected: [
        'Chaque onglet n’affiche que les notifications de sa catégorie, avec « Aucune notification dans cette catégorie » si vide',
        'Ouvrir une notification la marque comme lue et le compteur diminue',
        '« Tout marquer comme lu » affiche « Notifications lues » et remet le compteur à zéro'
      ],
      ui: ['Mes notifications', 'Toutes', 'Non lues', 'Investigations', 'Alertes', 'Mises à jour', 'Tout marquer comme lu', 'Aucune notification dans cette catégorie']
    },
    {
      id: 'P13-03',
      title: 'Notifications d’alerte J-3 et d’escalade : libellés corrects',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Notifications d’alerte J-3 et d’escalade générées (voir P08-14 et la file des notifications)'],
      steps: [
        'Ouvrir « Mes notifications » et l’onglet « Alertes »',
        'Repérer une alerte J-3 et une escalade',
        'Comparer leur libellé à la liste attendue'
      ],
      data: ['Libellés attendus : Alerte délai J-3, Alerte complément J-3, Alerte investigation J-3, Alerte demande de documents J-3, Escalade — AR, Escalade — Complément, Escalade — Investigation, Escalade — Demande de documents'],
      expected: [
        'Chaque alerte J-3 porte le libellé de son type et chaque escalade est affichée en violet avec « Escalade — » suivi de son objet',
        'Aucun code technique (par exemple ESCALADE_AR) n’est affiché à l’utilisateur'
      ],
      ui: ['Alerte délai J-3', 'Alerte investigation J-3', 'Escalade — AR', 'Escalade — Investigation']
    },
    {
      id: 'P13-04',
      title: 'Profil : consultation des informations et des rôles',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Session ouverte avec le compte CGE'],
      steps: [
        'Cliquer sur « Mon profil » dans le menu',
        'Lire les informations personnelles et les rôles',
        'Lire la liste des capacités et lesquelles sont accordées'
      ],
      data: [],
      expected: [
        'Le prénom, le nom et l’e-mail affichés sont ceux du compte',
        'Le rôle CGE est affiché avec son libellé et la capacité « Décision CGE » est marquée accordée',
        'Les capacités des autres rôles apparaissent non accordées, et « Statistiques » est accordée à tous'
      ],
      ui: ['Mon profil', 'Décision CGE']
    },
    {
      id: 'P13-05',
      title: 'Profil : modification des informations et du mot de passe',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Session ouverte avec le compte CGE'],
      steps: [
        'Cliquer sur « Modifier » dans les informations, changer le prénom et enregistrer dans « Modifier mon profil »',
        'Cliquer sur « Changer » dans la sécurité, saisir un nouveau mot de passe de 8 caractères ou plus et sa confirmation dans « Changer mon mot de passe »',
        'Se déconnecter puis se reconnecter avec le nouveau mot de passe'
      ],
      data: ['Nouveau mot de passe : Recette-2026-Test'],
      expected: [
        'La notification « Profil mis à jour » puis « Mot de passe modifié » s’affichent',
        'Le nouveau prénom est affiché et le nouveau mot de passe est accepté à la reconnexion',
        'L’ancien mot de passe est refusé'
      ],
      ui: ['Modifier mon profil', 'Changer mon mot de passe', 'Se déconnecter'],
      aConfirmer: 'La modification du mot de passe passe par l’API du back et non par Keycloak : politique de mot de passe attendue (longueur, complexité, historique) à confirmer'
    },
    {
      id: 'P13-06',
      title: 'Profil : e-mail invalide et mots de passe différents',
      priority: 'Majeur',
      type: 'negatif',
      role: 'CGE',
      preconditions: ['Fenêtres « Modifier mon profil » et « Changer mon mot de passe » accessibles'],
      steps: [
        'Saisir « pas-un-email » dans l’e-mail puis tenter d’enregistrer',
        'Vider le prénom puis tenter d’enregistrer',
        'Saisir un mot de passe de 5 caractères puis tenter de changer',
        'Saisir deux mots de passe de confirmation différents puis tenter de changer'
      ],
      data: ['E-mail : pas-un-email', 'Mot de passe court : abc12'],
      expected: [
        'L’e-mail invalide et le prénom vide sont refusés et signalés, sans modification du profil',
        'Un mot de passe de moins de 8 caractères est refusé',
        'Des mots de passe qui ne correspondent pas ne sont pas acceptés : le message « Les mots de passe ne correspondent pas. » s’affiche'
      ],
      ui: ['Enregistrer', 'Changer', 'Les mots de passe ne correspondent pas.']
    }
  ]
};
