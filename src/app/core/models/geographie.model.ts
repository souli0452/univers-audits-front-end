/** Référentiel Pays → Région → Province → Commune (Burkina Faso), tel que le serveur le publie. */
export interface GeoCommune {
    id: string;
    libelle: string;
    /** PLEIN, MOYEN ou STATUT_PARTICULIER (Ouagadougou, Bobo-Dioulasso). */
    categorie: string;
}

export interface GeoProvince {
    id: string;
    libelle: string;
    communes: GeoCommune[];
}

export interface GeoRegion {
    id: string;
    libelle: string;
    /** Zone publiée : KADIOGO, GUIRIKO ou AUTRES_REGIONS. */
    zone: string;
    provinces: GeoProvince[];
}

export interface Geographie {
    code: string;
    libelle: string;
    regions: GeoRegion[];
}

/** Origine géographique choisie dans le formulaire, telle que la demande de création la porte. */
export interface OrigineSaisie {
    /** Pays étranger (diaspora) : exclut la géographie du Burkina. */
    paysOrigine?: string;
    origineRegionId?: string;
    origineProvinceId?: string;
    origineCommuneId?: string;
}
