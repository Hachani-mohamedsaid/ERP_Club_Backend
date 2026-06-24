# ODIN ERP — Backend Register (NestJS + PostgreSQL + ImgBB)

Documentation copy-paste pour le projet **`erp-club-backend`**.

---

## 1. Stack

| Couche | Techno |
|--------|--------|
| API | NestJS 11 |
| ORM | Prisma |
| DB | PostgreSQL |
| Upload logo | [ImgBB API](https://api.imgbb.com/) |
| Mot de passe | bcrypt (12 rounds) |
| Validation | class-validator |

**Pas de vérification email** — le compte est actif immédiatement (`isActive: true`).

---

## 2. Installation (une seule fois)

```bash
cd erp-club-backend

npm install bcrypt class-validator class-transformer
npm install -D @types/bcrypt @types/multer

npm run prisma:generate
npm run prisma:push
```

---

## 3. Configuration `.env`

Copier `.env.example` → `.env` :

```env
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/odin_erp"

FRONTEND_URL=http://localhost:5173

# Clé ImgBB (logo club)
IMGBB_API_KEY=9c78dd4d38eeed795d1ef908540d73e4

# Vide = inscription ouverte sans code
# Rempli = codes obligatoires (séparés par virgule)
VALID_INVITATION_CODES=ODIN-FCC-2026
```

---

## 4. Schéma PostgreSQL (Prisma)

Fichier : `prisma/schema.prisma`

| Table | Rôle |
|-------|------|
| **User** | Owner (Admin Club) — email, passwordHash, fullName, phone |
| **Organization** | Club — clubName, country, league, logoUrl |
| **InvitationCode** | Codes optionnels en base (seed) |

Appliquer :

```bash
npm run prisma:push
```

### Seed invitation (optionnel)

```bash
npx prisma studio
```

Ou SQL :

```sql
INSERT INTO "InvitationCode" (id, code, "isActive", "maxUses", "usedCount", "createdAt")
VALUES (gen_random_uuid(), 'ODIN-FCC-2026', true, 100, 0, NOW());
```

---

## 5. Endpoint Register

### `POST /auth/register`

**Content-Type:** `multipart/form-data`

| Champ | Type | Requis |
|-------|------|--------|
| fullName | string | ✅ Nom du responsable |
| clubName | string | ✅ |
| country | string | ✅ |
| league | string | ✅ Championnat |
| email | string | ✅ Email pro |
| phone | string | ✅ |
| password | string | ✅ min 8 |
| confirmPassword | string | ✅ |
| invitationCode | string | optionnel |
| acceptTerms | boolean | ✅ `true` |
| acceptPrivacy | boolean | ✅ `true` |
| clubLogo | file | optionnel (max 5 Mo) |

### Réponse `201`

```json
{
  "message": "Organisation créée avec succès",
  "user": {
    "id": "uuid",
    "email": "directeur@fccarthage.tn",
    "fullName": "Ahmed Ben Salah",
    "role": "ADMIN_CLUB"
  },
  "organization": {
    "id": "uuid",
    "clubName": "FC Carthage",
    "country": "Tunisie",
    "league": "Ligue Professionnelle 1",
    "logoUrl": "https://i.ibb.co/..."
  }
}
```

### Erreurs

| Code | Cas |
|------|-----|
| 400 | Validation, mots de passe différents |
| 401 | Code invitation invalide |
| 409 | Email déjà utilisé |

---

## 6. Test avec cURL

```bash
curl -X POST http://localhost:3000/auth/register \
  -F "fullName=Ahmed Ben Salah" \
  -F "clubName=FC Carthage" \
  -F "country=Tunisie" \
  -F "league=Ligue Professionnelle 1" \
  -F "email=directeur@fccarthage.tn" \
  -F "phone=+21620000000" \
  -F "password=Secret123!" \
  -F "confirmPassword=Secret123!" \
  -F "acceptTerms=true" \
  -F "acceptPrivacy=true" \
  -F "invitationCode=ODIN-FCC-2026" \
  -F "clubLogo=@./logo.png"
```

---

## 7. Structure des fichiers ajoutés

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── dto/register-organization.dto.ts
├── imgbb/
│   ├── imgbb.module.ts
│   └── imgbb.service.ts
└── main.ts          ← CORS + ValidationPipe
```

---

## 8. Lancer le backend

```bash
npm run start:dev
```

API : `http://localhost:3000`  
Register : `POST http://localhost:3000/auth/register`

---

## 9. Frontend (Vite)

Fichier `.env` à la racine du frontend :

```env
VITE_API_URL=http://localhost:3000
```

Le frontend envoie un `FormData` vers `${VITE_API_URL}/auth/register`.

Après succès → redirection `/login` (sans écran vérification email).

---

## 10. Flow métier

```
Register Form
    ↓
POST /auth/register
    ↓
Validate DTO + invitation code
    ↓
Upload logo → ImgBB (si fichier)
    ↓
Hash password (bcrypt)
    ↓
Transaction Prisma:
  - Create User (ADMIN_CLUB, isActive=true)
  - Create Organization
    ↓
Return JSON → Frontend → /login
```

---

## 11. Sécurité production

- Ne jamais committer `.env` avec la clé ImgBB
- Utiliser variables d'environnement Render/Railway
- Ajouter rate-limit sur `/auth/register`
- JWT login (prochaine étape)

---

## 12. Prochaines étapes suggérées

1. `POST /auth/login` (JWT)
2. Middleware guard roles
3. Super Admin panel pour gérer InvitationCode
4. Webhook ImgBB delete (optionnel)
