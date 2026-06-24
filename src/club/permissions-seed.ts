import { ClubMemberRole } from '@prisma/client';

export const PERMISSION_MODULES = [
  'Joueurs',
  'Equipes',
  'Finances',
  'Contrats',
  'Calendrier',
  'Sante',
  'Analytics',
  'Recrutement',
  'Documents',
  'Parametres',
] as const;

type Perm = { canRead: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean };

function perm(r = false, c = false, u = false, d = false): Perm {
  return { canRead: r, canCreate: c, canUpdate: u, canDelete: d };
}

const ROLE_MAP: Record<string, ClubMemberRole> = {
  'Club Admin': 'CLUB_ADMIN',
  Coach: 'COACH',
  Médecin: 'MEDECIN',
  'Responsable Financier': 'RESPONSABLE_FINANCIER',
  Scout: 'SCOUT',
  Analyste: 'ANALYSTE',
};

function defaultMatrixForModule(module: string): Record<ClubMemberRole, Perm> {
  const all = (p: Perm) =>
    Object.fromEntries(
      Object.values(ClubMemberRole).map((r) => [r, { ...p }]),
    ) as Record<ClubMemberRole, Perm>;

  const base: Record<ClubMemberRole, Perm> = {
    CLUB_ADMIN: perm(true, true, true, true),
    COACH:
      ['Joueurs', 'Equipes', 'Calendrier', 'Analytics'].includes(module)
        ? perm(true, true, true, false)
        : perm(true, false, false, false),
    MEDECIN:
      ['Sante', 'Joueurs'].includes(module)
        ? perm(true, true, true, false)
        : perm(true, false, false, false),
    RESPONSABLE_FINANCIER:
      ['Finances', 'Contrats'].includes(module)
        ? perm(true, true, true, true)
        : perm(true, false, false, false),
    SCOUT:
      ['Recrutement', 'Joueurs', 'Analytics'].includes(module)
        ? perm(true, true, true, false)
        : perm(false, false, false, false),
    ANALYSTE:
      ['Analytics', 'Joueurs', 'Equipes'].includes(module)
        ? perm(true, false, false, false)
        : perm(false, false, false, false),
  };
  return base;
}

export function buildDefaultPermissions(organizationId: string) {
  return PERMISSION_MODULES.flatMap((module) =>
    Object.values(ClubMemberRole).map((clubRole) => {
      const p = defaultMatrixForModule(module)[clubRole];
      return {
        organizationId,
        module,
        clubRole,
        canRead: p.canRead,
        canCreate: p.canCreate,
        canUpdate: p.canUpdate,
        canDelete: p.canDelete,
      };
    }),
  );
}

export function clubRoleToLabel(role: ClubMemberRole): string {
  const labels: Record<ClubMemberRole, string> = {
    CLUB_ADMIN: 'Club Admin',
    COACH: 'Coach',
    MEDECIN: 'Médecin',
    RESPONSABLE_FINANCIER: 'Responsable Financier',
    SCOUT: 'Scout',
    ANALYSTE: 'Analyste',
  };
  return labels[role];
}

export function labelToClubRole(label: string): ClubMemberRole {
  const entry = Object.entries({
    'Club Admin': 'CLUB_ADMIN',
    Coach: 'COACH',
    Médecin: 'MEDECIN',
    'Responsable Financier': 'RESPONSABLE_FINANCIER',
    Scout: 'SCOUT',
    Analyste: 'ANALYSTE',
  }).find(([l]) => l === label);
  return (entry?.[1] ?? 'COACH') as ClubMemberRole;
}

export { ROLE_MAP };
