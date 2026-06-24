# Déploiement Render — ODIN ERP Backend

NestJS + PostgreSQL hébergés sur [Render](https://render.com).

---

## Architecture Render

| Service | Type | Rôle |
|---------|------|------|
| `erp_club` (ou similaire) | **PostgreSQL** | Base de données |
| `erp-club-backend` | **Web Service** | API NestJS |

---

## 1. PostgreSQL (déjà créé)

Dashboard Render → **PostgreSQL** → onglet **Info** :

- **Database** : `erp_club`
- **User** : `erp_admin`
- **External URL** → développement local (ton PC)
- **Internal URL** → Web Service NestJS sur Render (même région)

### Connexion depuis ton PC (`.env` local)

Utilise l’**External Database URL** et ajoute **`?sslmode=require`** à la fin :

```env
PORT=3000
MICROSERVICE_HOST=0.0.0.0
MICROSERVICE_PORT=8877

DATABASE_URL="postgresql://erp_admin:PASSWORD@dpg-XXXX.oregon-postgres.render.com/erp_club?sslmode=require"

FRONTEND_URL=http://localhost:5173
IMGBB_API_KEY=ta_cle_imgbb
VALID_INVITATION_CODES=
```

> ⚠️ Ne commit **jamais** `.env` sur GitHub. Les credentials restent dans Render Dashboard + fichier local.

---

## 2. Web Service NestJS (Render)

### Créer le service

1. Render → **New** → **Web Service**
2. Connecter le repo `erp-club-backend`
3. **Runtime** : Node
4. **Build Command** :
   ```bash
   npm install && npm run render:build
   ```
5. **Start Command** :
   ```bash
   npm run render:start
   ```
6. **Instance** : Free ou Starter

### Variables d'environnement (Render Dashboard)

| Variable | Valeur |
|----------|--------|
| `PORT` | *(auto par Render — ne pas forcer 3000)* |
| `DATABASE_URL` | **Internal Database URL** (copier depuis Postgres) |
| `FRONTEND_URL` | `http://localhost:5173,https://ton-frontend.onrender.com` |
| `IMGBB_API_KEY` | Clé ImgBB |
| `VALID_INVITATION_CODES` | Vide ou `ODIN-FCC-2026` |
| `MICROSERVICE_HOST` | `0.0.0.0` |
| `MICROSERVICE_PORT` | `8877` |

> Sur Render Web Service, `PORT` est injecté automatiquement (souvent `10000`). Le code utilise `process.env.PORT` — **ne mets pas PORT=3000** en dur sur Render.

---

## 3. Appliquer le schéma Prisma

### Depuis ton PC (première fois)

```bash
cd erp-club-backend
npm install
npm run prisma:generate
npm run prisma:push
```

Si erreur SSL :
```bash
# Vérifie que DATABASE_URL finit par ?sslmode=require
```

### Sur Render (automatique)

Le script `render:start` exécute `prisma db push` avant de lancer l'API.

---

## 4. Tester l'API

### Local → DB Render

```bash
npm run start:dev
curl http://localhost:3000
```

### Production Render

```bash
curl https://TON-SERVICE.onrender.com/auth/register
```

Exemple register :

```bash
curl -X POST https://TON-SERVICE.onrender.com/auth/register \
  -F "fullName=Ahmed Ben Salah" \
  -F "clubName=FC Carthage" \
  -F "country=Tunisie" \
  -F "league=Ligue 1" \
  -F "email=test@fccarthage.tn" \
  -F "phone=+21620000000" \
  -F "password=Secret123!" \
  -F "confirmPassword=Secret123!" \
  -F "acceptTerms=true" \
  -F "acceptPrivacy=true"
```

---

## 5. Frontend (Vite) → API Render

Fichier `erp-club-frontend-Web/.env` :

```env
# Local backend
# VITE_API_URL=http://localhost:3000

# Backend sur Render
VITE_API_URL=https://TON-SERVICE.onrender.com
```

Redémarrer Vite après changement :
```bash
npm run dev
```

---

## 6. CORS

`src/main.ts` autorise les origines listées dans `FRONTEND_URL` (séparées par virgule).

Exemple production :
```env
FRONTEND_URL=http://localhost:5173,https://erp-club-frontend.onrender.com
```

---

## 7. Checklist déploiement

- [ ] PostgreSQL Render actif (status **Available**)
- [ ] `prisma db push` OK en local
- [ ] Web Service build OK sur Render
- [ ] `DATABASE_URL` = **Internal URL** sur Render
- [ ] `IMGBB_API_KEY` configurée
- [ ] `FRONTEND_URL` contient l'URL du frontend
- [ ] Frontend `VITE_API_URL` pointe vers l'URL Render
- [ ] Test `POST /auth/register` OK

---

## 8. Dépannage

| Problème | Solution |
|----------|----------|
| `Can't reach database` | Vérifier Internal URL sur Render, External + `?sslmode=require` en local |
| CORS error | Ajouter l'URL frontend dans `FRONTEND_URL` |
| 502 Bad Gateway | Voir logs Render → souvent `prisma db push` ou PORT |
| ImgBB fail | Vérifier `IMGBB_API_KEY` |
| Service sleep (free) | Premier appel ~30s (cold start) |

---

## 9. Sécurité

- Rotate le mot de passe DB si exposé dans un chat / commit
- Utiliser **Environment Groups** Render pour partager `DATABASE_URL` entre services
- Activer **IP allowlist** sur Postgres si besoin (plan payant)

---

## 10. URLs utiles

- [Render PostgreSQL](https://render.com/docs/databases)
- [Render Web Services](https://render.com/docs/web-services)
- [Prisma + Render](https://www.prisma.io/docs/orm/overview/databases/postgresql)
