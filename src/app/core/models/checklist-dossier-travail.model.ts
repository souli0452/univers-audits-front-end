export interface ChecklistDossierTravailItemResponse {
    pointId: string;
    code: string;
    libelle: string;
    categorie?: string;
    ordre: number;
    coche: boolean;
    cocheParNom?: string;
    cocheAt?: string;
    commentaire?: string;
}

export interface ChecklistCocheRequest {
    coche: boolean;
    commentaire?: string;
}
