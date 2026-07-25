import { HttpContextToken } from '@angular/common/http';

/**
 * Marque explicitement une requête comme ne nécessitant pas de token
 * (endpoints publics : soumission anonyme, suivi par code d'accès, stats
 * publiques). À déclarer au niveau de l'appel HttpClient concerné plutôt
 * que de deviner via un pattern d'URL codé en dur dans l'intercepteur.
 */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);
