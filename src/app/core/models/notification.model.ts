export interface NotificationItem {
    id:             string;
    type:           string;
    channel?:       string;
    subject:        string;
    content?:       string;
    createdAt:      string;
    readAt?:        string;
    status:         string;
    dossierId?:     string;
    dossierNumber?: string;
    formReference?: string;
    scheduledAt?:   string;
    sentAt?:        string;
    overdue?:       boolean;
    retryCount?:    number;
}

export interface NotificationPage {
    content:       NotificationItem[];
    totalElements: number;
    totalPages:    number;
    size:          number;
    number:        number;
}
