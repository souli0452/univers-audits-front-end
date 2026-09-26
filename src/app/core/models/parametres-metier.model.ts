// ── Paramètres de délai ──────────────────────────────────────
export interface ParametreDelai {
    id: string;
    code: string;
    libelle: string;
    valeurJours?: number;
    joursOuvrables: boolean;
    actif: boolean;
}

export interface ParametreDelaiRequest {
    libelle: string;
    valeurJours?: number;
    joursOuvrables: boolean;
    actif: boolean;
}

// ── Jours fériés ──────────────────────────────────────────────
export interface JourFerie {
    id: string;
    date: string;
    libelle: string;
    actif: boolean;
}

export interface JourFerieRequest {
    date: string;
    libelle: string;
    actif: boolean;
}

// ── Indices de fraude ─────────────────────────────────────────
export interface IndiceFraude {
    id: string;
    code: string;
    libelle: string;
    categorie?: string;
    description?: string;
    actif: boolean;
    ordre: number;
}

export interface IndiceFraudeRequest {
    code: string;
    libelle: string;
    categorie?: string;
    description?: string;
    actif: boolean;
    ordre?: number;
}

// ── Types d'infraction ────────────────────────────────────────
export interface TypeInfraction {
    id: string;
    code: string;
    libelle: string;
    articleCodePenal?: string;
    articleLoi004?: string;
    impliqueDdip: boolean;
    actif: boolean;
    ordre: number;
}

export interface TypeInfractionRequest {
    code: string;
    libelle: string;
    articleCodePenal?: string;
    articleLoi004?: string;
    impliqueDdip: boolean;
    actif: boolean;
    ordre?: number;
}

// ── Points de check-list du dossier de travail ─────────────────
export interface PointChecklistDossierTravail {
    id: string;
    code: string;
    libelle: string;
    categorie?: string;
    ordre: number;
    actif: boolean;
}

export interface PointChecklistDossierTravailRequest {
    libelle: string;
    categorie?: string;
    ordre: number;
    actif?: boolean;
}
