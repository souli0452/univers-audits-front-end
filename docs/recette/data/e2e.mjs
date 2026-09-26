export default {
  id: 'E2E',
  title: 'Scénario de bout en bout',
  access: 'Tous les rôles, dans l’ordre du cycle de vie du dossier',
  intro: 'Deux dossiers suivis du dépôt public à la clôture, en enchaînant les rôles. À dérouler en dernier, avec des comptes distincts pour chaque rôle. Le rôle qui agit est nommé au début de chaque étape.',
  cases: [
    {
      id: 'E2E-01',
      title: 'Cycle complet d’un dossier nominatif : dépôt public jusqu’à CLOS et suivi',
      priority: 'Critique',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: [
        'Comptes disponibles : AGENT_BRPD, CONSEILLER_JURIDIQUE, CGEA, CGE, CONTROLEUR_ETAT, TEAM_LEADER',
        'Un second navigateur en navigation privée pour le citoyen',
        'Tous les cas P01 à P06 exécutés sans anomalie Critique'
      ],
      steps: [
        'PUBLIC : déposer une plainte nominative sur /#/portail/deposer et noter le code de suivi (dossier SOUMIS)',
        'AGENT_BRPD : ouvrir le dossier et cliquer sur « Enregistrer » (statut Reçu)',
        'CONSEILLER_JURIDIQUE : cliquer sur « Démarrer étude » et remplir « Analyse première » (statut En étude opportunité)',
        'CONSEILLER_JURIDIQUE : cliquer sur « Demander complément » avec un motif (statut En attente complément) ; PUBLIC : vérifier « Complément requis » sur le suivi',
        'AGENT_BRPD : cliquer sur « Complément reçu » (retour En étude opportunité)',
        'CONSEILLER_JURIDIQUE : cliquer sur « Soumettre au CTADP » (statut En revue CTADP)',
        'CGEA : créer une séance CTADP, y ajouter le dossier, saisir la recommandation et « Tenir la séance »',
        'CGE : cliquer sur « Déclarer recevable » (statut Recevable)',
        'CGEA : cliquer sur « Ouvrir l\'investigation » puis « Démarrer » ; ajouter TEAM_LEADER et CONTROLEUR_ETAT à l’équipe ; CGE : « Délivrer le mandat » (statut En investigation)',
        'CONTROLEUR_ETAT : planifier et tenir une audition avec procès-verbal finalisé, cocher toute la check-list, compléter « Rapport d\'enquête officiel » et « Note de recommandations »',
        'CONTROLEUR_ETAT : cliquer sur « Soumettre rapport » avec l’issue « Sanctions administratives » (statut Rapport produit)',
        'CGEA : « Approuver DEI » ; CONSEILLER_JURIDIQUE : « Approuver Juridique » ; CGE : « Décision CGE » puis confirmer (statut Décision rendue)',
        'CGE : « Transmettre à l\'autorité » puis « Clôturer le dossier » avec un motif (statut Dossier clôturé)',
        'PUBLIC : rechercher le code de suivi et télécharger « Mon récépissé »'
      ],
      data: [
        'Un seul dossier de bout en bout, objet : Recette E2E nominative',
        'Fichiers : document.pdf, photo.jpg'
      ],
      expected: [
        'À chaque étape, le statut du dossier est celui indiqué entre parenthèses, côté agent et côté suivi public',
        'Chaque action n’est proposée qu’au rôle prévu et aucune action ne reste sans message',
        'Le dossier final est clôturé et non modifiable, seule l’exportation PDF reste',
        'Le suivi public affiche « Dossier clôturé » et le récépissé se télécharge',
        'Le journal d’audit (administration) contient une trace de chaque transition avec l’auteur et l’heure'
      ],
      ui: ['Enregistrer', 'Démarrer étude', 'Analyse première', 'Demander complément', 'Complément reçu', 'Soumettre au CTADP', 'Tenir la séance', 'Déclarer recevable', 'Ouvrir l\'investigation', 'Démarrer', 'Délivrer le mandat', 'Soumettre rapport', 'Approuver DEI', 'Approuver Juridique', 'Décision CGE', 'Clôturer le dossier', 'Mon récépissé'],
      aConfirmer: 'Exigences intermédiaires côté back (délais, pièces obligatoires avant recevabilité, mandat requis avant les auditions) à confirmer : elles peuvent bloquer l’enchaînement'
    },
    {
      id: 'E2E-02',
      title: 'Cycle complet d’un dossier anonyme : aucune fuite d’identité',
      priority: 'Critique',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: [
        'Comptes disponibles : AGENT_BRPD, CONSEILLER_JURIDIQUE, CGEA, CGE, CONTROLEUR_ETAT',
        'Cas E2E-01 réussi (les étapes de traitement sont les mêmes)'
      ],
      steps: [
        'PUBLIC : déposer une plainte anonyme sur /#/portail/deposer avec « Je reste anonyme » et noter le code de suivi',
        'AGENT_BRPD : ouvrir le dossier et vérifier la mention « Anonyme » et l’absence de coordonnées',
        'Dérouler les étapes 2 à 13 de E2E-01 avec les rôles indiqués',
        'À chaque étape, ouvrir le dossier et relire le bloc déclarant, les notifications, l’historique et la file des notifications',
        'CGE : télécharger « Récépissé », « Accusé de réception » et « Résumé de clôture »',
        'PUBLIC : suivre le dossier avec le code, sans coordonnées de contact'
      ],
      data: ['Objet : Recette E2E anonyme', 'Aucune donnée d’identité saisie'],
      expected: [
        'Le dossier est anonyme à toutes les étapes : aucun nom, e-mail ni téléphone n’apparaît dans le dossier, l’historique, les notifications ni les PDF',
        'Le cycle aboutit au statut clôturé comme pour E2E-01',
        'Le suivi anonyme fonctionne avec le seul code d’accès',
        'Aucune notification n’est envoyée à un contact inexistant'
      ],
      ui: ['Je reste anonyme', 'Récépissé', 'Accusé de réception', 'Résumé de clôture']
    }
  ]
};
