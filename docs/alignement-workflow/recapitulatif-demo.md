# Plateforme de télédénonciation ASCE-LC — Récapitulatif pour la démonstration

Suite à la fiche « Description du workflow PGPD_GU V3 » et aux décisions des utilisateurs, l'application a été adaptée. Ce document présente ce qui a changé, comment le voir, et ce qui reste à valider.

## 1. Ce qui a changé

| Sujet | Ce que fait l'application maintenant | Qui |
|---|---|---|
| Courrier | Un champ facultatif « N° d'enregistrement du courrier » à la saisie d'un dossier reçu par courrier postal ou formulaire papier. Il renvoie à l'application de gestion du courrier. | Agent BRPD |
| Canaux de réception | Deux canaux ajoutés à la saisie : « Presse / médias » et « Rapport d'audit » (auto-saisine). | Agent BRPD |
| Convocation du comité | Bouton « Convocation (PDF) » sur une séance planifiée : date, membres convoqués, ordre du jour. | CGEA, CGE |
| Quitus du CGE | Bouton « Quitus du CGE » sur le dossier, une fois la décision du CGE enregistrée. | CGE, CGEA |
| Lettre au plaignant | Bouton « Lettre au plaignant » sur un dossier clos, sans détail d'enquête. | CGE, CGEA, BRPD |
| Transmission à une autorité | Le destinataire se choisit dans une liste : Procureur du Faso, Cour des comptes, institution partenaire, autre. | Équipe d'enquête |
| Délais du circuit | Une carte « Délais du circuit de traitement » sur le dossier : échéance, temps restant ou retard, pour 5 étapes. | Tous les agents |
| Communication (DCP) | Nouveau rôle qui ne voit que les statistiques globales, sans aucun dossier. | DCP |
| Statistiques et rapports | Année en cours par défaut ; année précédente, année en cours et précédente, ou période libre au calendrier. | Agents habilités |

## 2. Parcours de démonstration

1. **Saisie :** créer un dossier avec le canal « Courrier postal » et renseigner le n° de courrier.
2. **Comité :** planifier une séance, y ajouter le dossier, télécharger la convocation.
3. **Décision :** faire déclarer le dossier recevable par le CGE, puis télécharger le quitus.
4. **Délais :** ouvrir la fiche du dossier et regarder la carte des délais.
5. **Clôture :** sur un dossier clos, télécharger la lettre au plaignant.
6. **Statistiques :** changer de période, puis choisir « Période personnalisée » à cheval sur deux années.
7. **DCP :** se connecter avec un compte DCP : seules les statistiques apparaissent.

## 3. Les délais suivis

Les délais sont calculés en **jours ouvrables** (samedis, dimanches et jours fériés exclus), à l'heure près. Ils se modifient dans « Paramètres métier ».

| Étape | Délai | Début → fin |
|---|---|---|
| Analyse du CGEA | 72 h | Dossier reçu → étude d'opportunité démarrée |
| Convocation du comité | 3 jours | Dossier envoyé au comité → inscrit à une séance |
| Quitus du CGE | 15 jours | Séance tenue → décision du CGE |
| Imputation du CGE | 72 h | Dossier retenu → décision d'affectation du CGE |
| Affectation du CGEA | 3 jours | Décision du CGE → imputation par le CGEA |

Ne sont pas suivis, faute de date enregistrée dans l'application : les 48 h du courrier et du secrétariat, les 24 h d'ouverture du dossier par le BRPD, la tenue de la séance, l'envoi de l'accusé et de la lettre de suite.

## 4. À faire valider par les utilisateurs

1. **Modèles Word :** les trois documents (convocation, quitus, lettre au plaignant) ont un texte provisoire. Merci de transmettre les modèles actuels.
2. **Délais :** les cinq étapes suivies et leur point de départ correspondent-ils à leur pratique ?
3. **Alertes :** souhaitent-ils être **prévenus** automatiquement d'un retard (notification ou message au CGEA / CGE), ou la carte sur le dossier leur suffit-elle ?
4. **Page « Dépassements par acteur » :** doit-elle aussi lister ces nouveaux retards ?
5. **Lettre au plaignant :** le texte (clôture sans détail d'enquête) leur convient-il ?

## 5. Ce qui n'a pas été fait, volontairement

- Missions de contrôle (étapes 26 à 29) : autre application.
- Courrier, secrétariat, cahier de transmission : autre application ou papier.
- Communiqués de la DCP : remplacés par l'accès aux statistiques globales.
- Renseignement judiciaire et plan d'enquête : déjà couverts par l'application.
