export interface AuditLog {
  id:          string;
  agentId:     string;
  agentName:   string;
  agentRole:   string;
  action:      string;
  entityType:  string;
  entityId:    string;
  description: string;
  ipAddress:   string;
  status:      string;
  createdAt:   string;
}

export interface LoginLog {
  id:            string;
  agentId:       string;
  agentName:     string;
  success:       boolean;
  ipAddress:     string;
  failureReason: string;
  createdAt:     string;
}

/** Pagination imbriquée sous `page`, distincte du PageResponse<T> plat utilisé ailleurs. */
export interface AuditPageResponse<T> {
  content: T[];
  page: {
    totalElements: number;
    totalPages:    number;
    number:        number;
    size:          number;
  };
}

export interface AuditStats {
  actionsToday:     number;
  actionsWeek:      number;
  loginsSuccess30d: number;
  loginsFailed30d:  number;
  totalActions:     number;
  totalLogins:      number;
  topActions:       Record<string, number>;
  topAgents:        Record<string, number>;
}
