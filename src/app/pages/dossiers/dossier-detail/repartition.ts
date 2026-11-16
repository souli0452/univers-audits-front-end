/** Agents entre lesquels le chef d'un département répartit un dossier : ceux de son département. */
export function agentsDuDepartement<T extends { departementId?: string }>(agents: T[], departementId?: string): T[] {
    return departementId ? agents.filter(a => a.departementId === departementId) : [];
}
