export interface NotificationItem {
    id:             string;
    type:           string;
    subject:        string;
    content?:       string;
    createdAt:      string;
    readAt?:        string;
    status:         string;
    dossierId?:     string;
    dossierNumber?: string;
}

export interface NotificationPage {
    content:       NotificationItem[];
    totalElements: number;
    totalPages:    number;
    size:          number;
    number:        number;
}
