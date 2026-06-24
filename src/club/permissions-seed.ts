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

const LABEL_TO_ROLE: Record<string, ClubMemberRole> = {
  'Club Admin': 'CLUB_ADMIN',
  Responsable: 'RESPONSABLE',
  'Préparateur Physique': 'PREPARATEUR',
  'Analyste Performance': 'ANALYSTE',
  Recruteur: 'RECRUTEUR',
  Coach: 'COACH',
  Médecin: 'MEDECIN',
  Scout: 'SCOUT',
  Finance: 'RESPONSABLE_FINANCIER',
  'Responsable Financier': 'RESPONSABLE_FINANCIER',
  Analyste: 'ANALYSTE',
  Joueur: 'JOUEUR',
};

function defaultMatrixForModule(module: string): Record<ClubMemberRole, Perm> {
  const base: Record<ClubMemberRole, Perm> = {
    CLUB_ADMIN: perm(true, true, true, true),
    RESPONSABLE:
      ['Joueurs', 'Equipes', 'Finances', 'Contrats', 'Calendrier', 'Analytics', 'Recrutement', 'Documents'].includes(module)
        ? perm(true, true, true, module !== 'Parametres')
        : perm(true, false, false, false),
    PREPARATEUR:
      ['Sante', 'Joueurs', 'Calendrier', 'Analytics'].includes(module)
        ? perm(true, true, true, false)
        : perm(true, false, false, false),
    COACH:
      ['Joueurs', 'Equipes', 'Calendrier', 'Analytics'].includes(module)
        ? perm(true, true, true, false)
        : perm(true, false, false, false),
    MEDECIN:
      ['Sante', 'Joueurs'].includes(module)
        ? perm(true, true, true, false)
        : perm(true, false, false, false),
    SCOUT:
      ['Recrutement', 'Joueurs', 'Analytics'].includes(module)
        ? perm(true, true, true, false)
        : perm(false, false, false, false),
    ANALYSTE:
      ['Analytics', 'Joueurs', 'Equipes'].includes(module)
        ? perm(true, false, false, false)
        : perm(false, false, false, false),
    RECRUTEUR:
      ['Recrutement', 'Joueurs', 'Analytics'].includes(module)
        ? perm(true, true, true, false)
        : perm(false, false, false, false),
    RESPONSABLE_FINANCIER:
      ['Finances', 'Contrats'].includes(module)
        ? perm(true, true, true, true)
        : perm(true, false, false, false),
    JOUEUR:
      ['Calendrier', 'Joueurs'].includes(module)
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
    RESPONSABLE: 'Responsable',
    PREPARATEUR: 'Préparateur Physique',
    COACH: 'Coach',
    MEDECIN: 'Médecin',
    SCOUT: 'Scout',
    ANALYSTE: 'Analyste Performance',
    RECRUTEUR: 'Recruteur',
    RESPONSABLE_FINANCIER: 'Finance',
    JOUEUR: 'Joueur',
  };
  return labels[role];
}

export function labelToClubRole(label: string): ClubMemberRole {
  return LABEL_TO_ROLE[label] ?? 'COACH';
}

export { LABEL_TO_ROLE as ROLE_MAP };
