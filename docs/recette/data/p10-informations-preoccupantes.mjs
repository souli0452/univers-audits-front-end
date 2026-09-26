export default {
  id: 'P10',
  title: 'Informations préoccupantes',
  access: 'AGENT_BRPD et ADMIN_DDIC (entrée « Informations préoccupantes » du menu « Bureau des plaintes »)',
  intro: 'Signalements reçus hors dépôt de plainte (presse, audit, dénonciation interne…). Statuts : NOUVELLE, RATTACHEE, AUTO_SAISINE_DECLENCHEE, CLASSEE_SANS_SUITE. Depuis une information NOUVELLE ou RATTACHEE on peut déclencher une auto-saisine ou classer sans suite.',
  cases: [
    {
      id: 'P10-01',
      title: 'Création d’une information préoccupante',
      priority: 'Critique',
      type: 'nominal',
      role: 'AGENT_BRPD',
      preconditions: ['Session ouverte avec le compte AGENT_BRPD'],
      steps: [
        'Menu « Bureau des plaintes » puis « Informations préoccupantes »',
        'Cliquer sur « Nouvelle information »',
        'Dans « Nouvelle information préoccupante », renseigner l’objet, la description, la source (« Presse écrite »), la date de réception et la référence de la source',
        'Cliquer sur « Créer »'
      ],
      data: [
        'Objet : Article de presse de test sur des malversations',
        'Description : Faits fictifs de recette',
        'Source : Presse écrite ; référence : Journal de test, édition du jour'
      ],
      expected: [
        'L’écran de détail de la nouvelle information s’ouvre avec l’objet saisi',
        'Le statut est « Nouvelle » et aucun dossier n’est rattaché',
        'L’information apparaît en tête de la liste avec sa date de réception et sa source'
      ],
      ui: ['Informations préoccupantes', 'Nouvelle information', 'Nouvelle information préoccupante', 'Presse écrite', 'Créer']
    },
    {
      id: 'P10-02',
      title: 'Rattachement à un dossier existant',
      priority: 'Majeur',
      type: 'nominal',
      role: 'AGENT_BRPD',
      preconditions: ['Une information au statut NOUVELLE', 'Un dossier existant identifiable par son numéro'],
      steps: [
        'Ouvrir l’information et cliquer sur « Rattacher un dossier »',
        'Saisir le numéro ou l’objet du dossier dans « Numéro ou objet du dossier... » puis appuyer sur Entrée',
        'Sélectionner le dossier dans les résultats, saisir un commentaire',
        'Cliquer sur « Rattacher »'
      ],
      data: ['Commentaire : Rattachement de test'],
      expected: [
        'La notification « Dossier rattaché » s’affiche',
        'Le statut passe à « Rattachée » et le dossier apparaît dans la liste des dossiers rattachés avec la date',
        'Dans la liste, la colonne « Dossiers » indique 1'
      ],
      ui: ['Rattacher un dossier', 'Numéro ou objet du dossier...', 'Rattacher', 'Dossier rattaché']
    },
    {
      id: 'P10-03',
      title: 'Déclenchement d’une auto-saisine',
      priority: 'Majeur',
      type: 'nominal',
      role: 'AGENT_BRPD',
      preconditions: ['Une information au statut NOUVELLE ou RATTACHEE'],
      steps: [
        'Dans le bloc « Actions », cliquer sur « Déclencher une auto-saisine »',
        'Lire la fenêtre puis cliquer sur « Confirmer l\'auto-saisine »',
        'Ouvrir le dossier créé depuis « Tous les dossiers »'
      ],
      data: [],
      expected: [
        'La notification « Auto-saisine déclenchée » avec « Nouveau dossier créé » s’affiche',
        'Le statut de l’information devient « Auto-saisine déclenchée » et le message « Une auto-saisine a déjà été déclenchée pour cette information. » remplace les boutons d’action',
        'Un nouveau dossier de type « Auto-saisine » existe au statut Soumis et il est rattaché à l’information'
      ],
      ui: ['Déclencher une auto-saisine', 'Confirmer l\'auto-saisine', 'Auto-saisine déclenchée', 'Une auto-saisine a déjà été déclenchée pour cette information.']
    },
    {
      id: 'P10-04',
      title: 'Classement sans suite',
      priority: 'Majeur',
      type: 'nominal',
      role: 'AGENT_BRPD',
      preconditions: ['Une information au statut NOUVELLE'],
      steps: [
        'Dans le bloc « Actions », cliquer sur « Classer sans suite »',
        'Relire le statut et les actions restantes'
      ],
      data: [],
      expected: [
        'La notification « Classée sans suite » s’affiche',
        'Le statut devient « Classée sans suite » et le message « Cette information a été classée sans suite. » s’affiche',
        'Les boutons « Déclencher une auto-saisine » et « Classer sans suite » disparaissent'
      ],
      ui: ['Classer sans suite', 'Classée sans suite', 'Cette information a été classée sans suite.'],
      aConfirmer: 'Le classement est immédiat, sans confirmation ni motif dans le code : demande de confirmation et motif obligatoire à confirmer avec le métier'
    },
    {
      id: 'P10-05',
      title: 'Création avec champs obligatoires vides',
      priority: 'Majeur',
      type: 'negatif',
      role: 'AGENT_BRPD',
      preconditions: ['Fenêtre « Nouvelle information préoccupante » ouverte'],
      steps: [
        'Laisser l’objet, la description et la source vides et cliquer sur « Créer »',
        'Renseigner l’objet seul et recliquer',
        'Renseigner tous les champs marqués d’un astérisque et recliquer'
      ],
      data: [],
      expected: [
        'Aucune information n’est créée tant qu’un champ marqué d’un astérisque est vide',
        'Un message explique quel champ est manquant, ou le champ est signalé en erreur',
        'Avec tous les champs renseignés, la création aboutit'
      ],
      ui: ['Créer'],
      aConfirmer: 'Dans le code, un clic sur « Créer » avec des champs manquants ne produit aucune réaction visible (ni message ni champ signalé) : comportement attendu à confirmer'
    },
    {
      id: 'P10-06',
      title: 'Rattachement impossible : aucun dossier trouvé ou aucun dossier choisi',
      priority: 'Majeur',
      type: 'negatif',
      role: 'AGENT_BRPD',
      preconditions: ['Fenêtre « Rattacher un dossier » ouverte'],
      steps: [
        'Rechercher un numéro inexistant, par exemple ZZZ-000',
        'Lire le résultat de la recherche',
        'Observer le bouton « Rattacher » sans sélectionner de dossier'
      ],
      data: ['Recherche : ZZZ-000'],
      expected: [
        'Un message indique qu’aucun dossier ne correspond',
        'Le bouton « Rattacher » reste inactif tant qu’aucun dossier n’est sélectionné',
        'Aucun rattachement n’est créé'
      ],
      ui: ['Rattacher'],
      aConfirmer: 'La recherche du front ne porte que sur les 200 premiers dossiers : un dossier plus ancien peut ne pas être trouvé. Comportement attendu à confirmer'
    },
    {
      id: 'P10-07',
      title: 'Liste des informations : colonnes, compteur et accès au détail',
      priority: 'Mineur',
      type: 'nominal',
      role: 'AGENT_BRPD',
      preconditions: ['Au moins trois informations de statuts différents'],
      steps: [
        'Ouvrir « Informations préoccupantes »',
        'Lire le compteur et les colonnes du tableau',
        'Cliquer sur une ligne puis sur l’icône œil'
      ],
      data: [],
      expected: [
        'Le compteur « x information(s) » correspond au nombre de lignes',
        'Les colonnes « Réception », « Objet », « Source », « Statut » et « Dossiers » sont renseignées',
        'La ligne et l’icône ouvrent le détail de la bonne information'
      ],
      ui: ['Réception', 'Source', 'Statut'],
      aConfirmer: 'La liste n’offre aucun filtre par statut ni par source : besoin métier à confirmer'
    },
    {
      id: 'P10-08',
      title: 'Traçabilité dans le journal d’audit',
      priority: 'Majeur',
      type: 'nominal',
      role: 'ADMIN_DDIC',
      preconditions: ['Cas P10-01 à P10-04 exécutés'],
      steps: [
        'Menu « Administration » puis « Journal d\'audit »',
        'Chercher les actions de création, de rattachement, d’auto-saisine et de classement',
        'Lire l’auteur, l’heure et l’objet de chaque ligne'
      ],
      data: [],
      expected: [
        'Chaque action des cas précédents figure dans le journal avec l’agent AGENT_BRPD et l’heure',
        'Aucune donnée personnelle superflue n’apparaît dans le détail des lignes'
      ],
      ui: ['Journal d\'audit'],
      aConfirmer: 'La liste des actions filtrables du journal (Créer dossier, Modifier dossier, Clôturer dossier, Déclarer recevable, Soumettre CTADP, Ouvrir investigation, Soumettre rapport, Créer agent, etc.) ne contient aucune action « information préoccupante » : la traçabilité de ces actions est à confirmer, et le résultat attendu ci-dessus peut être en échec'
    }
  ]
};
