export default {
  title: 'Cahier de recette — Plateforme de dénonciation ASCE-LC',
  environment: {
    url: 'https://denoncer.asce-lc.bf',
    front: 'Branche amandement_cge',
    back: 'Branche feature/workflow-denociation-asce-fix',
    commit: 'À renseigner (git rev-parse --short HEAD)',
    date: 'À renseigner',
    testeur: 'À renseigner'
  },
  accounts: [
    { role: 'ADMIN_DDIC', login: 'À renseigner', usage: 'Administration, accès à toutes les entrées de menu' },
    { role: 'CGE', login: 'À renseigner', usage: 'Décisions, recevabilité, administration' },
    { role: 'CGEA', login: 'À renseigner', usage: 'Affectations, registre des auditions, administration' },
    { role: 'CONTROLEUR_ETAT', login: 'À renseigner', usage: 'Investigations, auditions' },
    { role: 'TEAM_LEADER', login: 'À renseigner', usage: 'Chef d’équipe d’investigation' },
    { role: 'CONSEILLER_JURIDIQUE', login: 'À renseigner', usage: 'Avis juridiques, suites judiciaires' },
    { role: 'AGENT_CJ', login: 'À renseigner', usage: 'Agent du conseil juridique' },
    { role: 'AGENT_BRPD', login: 'À renseigner', usage: 'Informations préoccupantes' }
  ],
  datasets: [
    { name: 'document.pdf', usage: 'Pièce jointe valide, moins de 5 Mo' },
    { name: 'photo.jpg', usage: 'Image valide pour pièce jointe et photo du dépôt vocal' },
    { name: 'audio.webm ou audio.mp3', usage: 'Enregistrement audio de test' },
    { name: 'gros-fichier.pdf', usage: 'Fichier de plus de 25 Mo, au-dessus de la limite du formulaire (cas négatif)' },
    { name: 'script.html', usage: 'Fichier de type interdit (cas négatif)' }
  ],
  startDossiers: [
    { ref: 'D-A', statut: 'SOUMIS', usage: 'Dossier neuf pour le traitement (P07)' },
    { ref: 'D-B', statut: 'EN_INVESTIGATION', usage: 'Dossier pour l’investigation (P08)' },
    { ref: 'D-C', statut: 'DECISION_RENDUE', usage: 'Dossier pour la clôture (P09)' }
  ]
};
