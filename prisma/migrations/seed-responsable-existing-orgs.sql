-- Seed responsable defaults for existing organizations (idempotent)
INSERT INTO "BudgetCategory" ("id", "organizationId", "name", "allocated", "spent", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, o."id", v.name, v.allocated, 0, NOW(), NOW()
FROM "Organization" o
CROSS JOIN (VALUES
  ('Recrutement', 120000),
  ('Équipement', 40000),
  ('Déplacements', 30000),
  ('Infrastructure', 80000),
  ('Médical', 25000)
) AS v(name, allocated)
WHERE NOT EXISTS (
  SELECT 1 FROM "BudgetCategory" bc WHERE bc."organizationId" = o."id" AND bc."name" = v.name
);

INSERT INTO "ValidationRequest" ("id", "organizationId", "type", "title", "detail", "amount", "priority", "status", "requestedBy", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, o."id", 'RECRUTEMENT', 'Recrutement joueur', 'Prospect jeune — validation scouting requise', NULL, 'HAUTE', 'EN_ATTENTE', 'Scout', NOW(), NOW()
FROM "Organization" o
WHERE NOT EXISTS (SELECT 1 FROM "ValidationRequest" vr WHERE vr."organizationId" = o."id" LIMIT 1);
