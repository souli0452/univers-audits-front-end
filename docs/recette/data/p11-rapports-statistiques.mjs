export default {
  id: 'P11',
  title: 'Rapports, statistiques, leçons et registre',
  access: 'Rapports, statistiques et leçons : agents connectés ; dépassements par acteur : ADMIN_DDIC, CGE, CGEA ; registre des auditions : CGEA, ADMIN_DDIC',
  intro: 'Consultation et exports (PDF, Excel). Les pages Rapports, Statistiques et Leçons à partager n’ont pas de garde par rôle dans le front : tout agent connecté peut les ouvrir.',
  cases: [
    {
      id: 'P11-01',
      title: 'Rapport d’état : période, filtres et exports',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Plusieurs dossiers de statuts, types et canaux variés', 'Session ouverte avec le compte CGE'],
      steps: [
        'Menu « Dossiers » puis « Rapports »',
        'Renseigner « Début » et « Fin » puis cliquer sur « Charger »',
        'Choisir « Tous les statuts », « Tous les types » ou « Tous les canaux » puis cliquer sur « Appliquer », ensuite « Réinitialiser »',
        'Cliquer sur « PDF », puis « Excel », puis « Rapport annuel officiel »',
        'Ouvrir chaque fichier'
      ],
      data: ['Période : le mois en cours'],
      expected: [
        'Les chiffres du rapport correspondent à la liste des dossiers sur la même période',
        'Les filtres réduisent les résultats et « Réinitialiser » rétablit la vue complète',
        'Les trois exports se téléchargent en fichiers lisibles avec la période et les mêmes totaux'
      ],
      ui: ['Charger', 'Appliquer', 'Réinitialiser', 'PDF', 'Excel', 'Rapport annuel officiel']
    },
    {
      id: 'P11-02',
      title: 'Rapport d’état des investigations',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Plusieurs investigations de statuts variés'],
      steps: [
        'Ouvrir /#/app/rapports/investigations (entrée « Rapport investigations » du menu)',
        'Renseigner la période puis cliquer sur « Charger »',
        'Appliquer un filtre puis cliquer sur « Appliquer »',
        'Cliquer sur « PDF » puis « Excel »'
      ],
      data: [],
      expected: [
        'La liste correspond aux investigations de la période',
        'Les exports PDF et Excel se téléchargent et reprennent la liste filtrée',
        'La notification « PDF exporté » précise le nom du fichier'
      ],
      ui: ['Charger', 'Appliquer', 'PDF', 'Excel']
    },
    {
      id: 'P11-03',
      title: 'Tableau de bord des statistiques',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Dossiers et investigations existants'],
      steps: [
        'Menu « Navigation » puis « Statistiques »',
        'Changer la période : « Cette année », « Ce trimestre », « Ce mois », « 30 derniers jours »',
        'Lire les indicateurs et les graphiques'
      ],
      data: [],
      expected: [
        'Les indicateurs et les graphiques se mettent à jour à chaque période',
        'Les totaux sont cohérents avec les rapports du cas P11-01',
        'Le compteur « Dépassements légaux » est renseigné'
      ],
      ui: ['Statistiques', 'Cette année', 'Ce trimestre', 'Ce mois', '30 derniers jours', 'Dépassements légaux']
    },
    {
      id: 'P11-04',
      title: 'Dépassements par acteur',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGEA',
      preconditions: ['Au moins un dossier en dépassement de délai', 'Session ouverte avec le compte CGEA'],
      steps: [
        'Menu « Administration » puis « Dépassements par acteur »',
        'Lire « Acteurs concernés » et le tableau',
        'Cliquer sur l’icône d’actualisation'
      ],
      data: [],
      expected: [
        'Les dossiers en dépassement sont regroupés par agent en charge',
        'Le nombre « Acteurs concernés » est égal au nombre de lignes',
        'L’actualisation recharge les données sans erreur'
      ],
      ui: ['Dépassements par acteur', 'Acteurs concernés']
    },
    {
      id: 'P11-05',
      title: 'Leçons à partager',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGE',
      preconditions: ['Une fiche RETEX publiée comme leçon à partager (bloc « Fiche RETEX » d’une investigation)'],
      steps: [
        'Menu « Leçons à partager »',
        'Lire les leçons listées',
        'Cliquer sur « Voir l\'investigation » sur une leçon'
      ],
      data: [],
      expected: [
        'La leçon publiée apparaît avec son contenu',
        'Le lien ouvre l’investigation d’origine',
        'Une fiche RETEX non publiée n’apparaît pas dans la liste'
      ],
      ui: ['Leçons à partager', 'Voir l\'investigation']
    },
    {
      id: 'P11-06',
      title: 'Registre des auditions',
      priority: 'Majeur',
      type: 'nominal',
      role: 'CGEA',
      preconditions: ['Auditions créées dans plusieurs investigations (voir P08-07)'],
      steps: [
        'Menu « Administration » puis « Registre des auditions »',
        'Lire le compteur et les colonnes',
        'Comparer avec les auditions saisies dans les investigations'
      ],
      data: [],
      expected: [
        'Le compteur « x audition(s) » correspond au nombre de lignes',
        'Les colonnes « Dossier », « Personne entendue », « Date prévue » et « Statut » sont renseignées',
        'Les auditions de toutes les investigations apparaissent'
      ],
      ui: ['Registre des auditions', 'Personne entendue', 'Date prévue'],
      aConfirmer: 'Aucun export n’existe dans le code de cet écran : besoin d’export (Excel, PDF) à confirmer'
    },
    {
      id: 'P11-07',
      title: 'Export Excel : une valeur commençant par « = » n’est pas interprétée comme formule',
      priority: 'Majeur',
      type: 'securite',
      role: 'CGE',
      preconditions: ['Un dossier dont l’objet commence par « =1+1 » (créé en P06-01)', 'Microsoft Excel disponible'],
      steps: [
        'Ouvrir « Rapports » avec la période qui contient ce dossier',
        'Cliquer sur « Excel »',
        'Ouvrir le fichier dans Excel et repérer la ligne du dossier',
        'Répéter avec un objet commençant par « + », « - » puis « @ »'
      ],
      data: ['Objets : =1+1, +1+1, -1+1, @SUM(1)'],
      expected: [
        'La cellule affiche le texte saisi (précédé d’une apostrophe) et non le résultat d’un calcul',
        'Aucun message d’avertissement de sécurité Excel ne s’affiche à l’ouverture'
      ],
      ui: ['Excel']
    },
    {
      id: 'P11-08',
      title: 'Période invalide ou sans donnée',
      priority: 'Majeur',
      type: 'negatif',
      role: 'CGE',
      preconditions: ['Page « Rapports » ouverte'],
      steps: [
        'Renseigner « Fin » avant « Début » puis cliquer sur « Charger »',
        'Renseigner une période sans aucun dossier puis cliquer sur « Charger »'
      ],
      data: ['Période sans donnée : une année ancienne, par exemple 2010'],
      expected: [
        'Le message « Période invalide » (La date de fin doit être après la date de début) s’affiche et aucune requête n’est envoyée',
        'Pour la période vide, la page affiche des totaux à zéro et un état vide, sans erreur ni écran blanc',
        'Les boutons d’export restent utilisables ou sont désactivés de façon cohérente'
      ],
      ui: ['Charger', 'Période invalide']
    },
    {
      id: 'P11-09',
      title: 'Rapports et statistiques accessibles à un rôle opérationnel',
      priority: 'Majeur',
      type: 'securite',
      role: 'CONTROLEUR_ETAT',
      preconditions: ['Session ouverte avec le compte CONTROLEUR_ETAT'],
      steps: [
        'Ouvrir « Rapports » puis « Statistiques » par le menu',
        'Lire les totaux affichés et tenter les exports',
        'Comparer aux données visibles par CGE'
      ],
      data: [],
      expected: [
        'Le périmètre des chiffres et des exports d’un CONTROLEUR_ETAT est celui autorisé pour son rôle',
        'Aucun dossier confidentiel ni donnée d’identité de lanceur d’alerte n’apparaît dans les exports'
      ],
      ui: ['Rapports'],
      aConfirmer: 'Le front ne restreint ni l’accès ni le périmètre des rapports et statistiques par rôle : règle de visibilité attendue à confirmer avec le métier et le back'
    }
  ]
};
