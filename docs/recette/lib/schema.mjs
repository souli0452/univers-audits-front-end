export const PRIORITIES = ['Critique', 'Majeur', 'Mineur'];
export const TYPES = ['nominal', 'negatif', 'securite'];
export const ROLES = [
  'PUBLIC', 'ADMIN_DDIC', 'CGE', 'CGEA', 'CONTROLEUR_ETAT',
  'TEAM_LEADER', 'CONSEILLER_JURIDIQUE', 'AGENT_CJ', 'AGENT_BRPD'
];
const VAGUE = ['fonctionne correctement', 'comme prévu', 's’affiche bien', "s'affiche bien", 'tout est ok', 'sans problème'];
const CASE_ID = /^(P\d{2}|E2E)-\d{2}$/;
const PROCESS_ID = /^(P\d{2}|E2E)$/;

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

export function validateCase(c, processId) {
  const errs = [];
  const at = c.id ?? '(sans id)';
  if (!CASE_ID.test(c.id ?? '')) errs.push(`${at}: id invalide (attendu P07-03 ou E2E-01)`);
  else if (!c.id.startsWith(`${processId}-`)) errs.push(`${at}: l'id doit commencer par ${processId}-`);
  if (!c.title?.trim()) errs.push(`${at}: title manquant`);
  if (!PRIORITIES.includes(c.priority)) errs.push(`${at}: priority invalide (${c.priority})`);
  if (!TYPES.includes(c.type)) errs.push(`${at}: type invalide (${c.type})`);
  if (!ROLES.includes(c.role)) errs.push(`${at}: role inconnu (${c.role})`);
  if (asList(c.preconditions).length === 0) errs.push(`${at}: preconditions manquantes`);
  const steps = asList(c.steps);
  if (steps.length < 2) errs.push(`${at}: au moins 2 étapes`);
  if (steps.some((s) => !String(s).trim())) errs.push(`${at}: étape vide`);
  const expected = asList(c.expected);
  if (expected.length === 0) errs.push(`${at}: expected manquant`);
  for (const e of expected) {
    const bad = VAGUE.find((v) => String(e).toLowerCase().includes(v));
    if (bad) errs.push(`${at}: résultat attendu vague ("${bad}")`);
  }
  if (c.regression && c.priority !== 'Critique') errs.push(`${at}: un cas regression doit être Critique`);
  return errs;
}

export function validateProcess(p) {
  const errs = [];
  if (!PROCESS_ID.test(p.id ?? '')) errs.push(`${p.id ?? '(sans id)'}: id de processus invalide`);
  if (!p.title?.trim()) errs.push(`${p.id}: title manquant`);
  if (!Array.isArray(p.cases) || p.cases.length === 0) {
    errs.push(`${p.id}: aucun cas`);
    return errs;
  }
  const seen = new Set();
  for (const c of p.cases) {
    if (seen.has(c.id)) errs.push(`${c.id}: id dupliqué`);
    seen.add(c.id);
    errs.push(...validateCase(c, p.id));
  }
  if (p.id !== 'E2E') {
    if (!p.cases.some((c) => c.type === 'nominal')) errs.push(`${p.id}: au moins un cas nominal`);
    if (!p.cases.some((c) => c.type === 'negatif' || c.type === 'securite'))
      errs.push(`${p.id}: au moins un cas négatif ou sécurité`);
  }
  return errs;
}
