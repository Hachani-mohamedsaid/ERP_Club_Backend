# Module Analyste — API NestJS

21 endpoints sous `/analyste/*` pour le dashboard Analyste ODIN ERP.

## Structure

```
src/analyste/
├── analyste.module.ts
├── analyste.controller.ts   # JWT requis
├── analyste.service.ts
├── dto/predict-match.dto.ts
└── data/                    # données mock (sync depuis frontend)
    ├── analysteData.ts
    ├── analysteExtendedData.ts
    └── whoopData.ts
```

## Routes

| Méthode | Route |
|---------|-------|
| GET | `/analyste/dashboard` |
| GET | `/analyste/executive` |
| GET | `/analyste/live-match` |
| GET | `/analyste/prediction/teams` |
| POST | `/analyste/prediction` |
| GET | `/analyste/ppi` |
| GET | `/analyste/chemistry` |
| GET | `/analyste/patterns` |
| GET | `/analyste/tactical` |
| GET | `/analyste/video-analysis` |
| GET | `/analyste/opponent` |
| GET | `/analyste/fatigue` |
| GET | `/analyste/whoop` |
| GET | `/analyste/injuries` |
| GET | `/analyste/injury-forecast` |
| GET | `/analyste/transfer` |
| GET | `/analyste/market-value` |
| GET | `/analyste/scouting` |
| GET | `/analyste/evolution` |
| GET | `/analyste/training` |

## Dev local

```bash
npm run start:dev
# http://localhost:3000/analyste/dashboard  (Bearer token requis)
```

## Sync données depuis le frontend

Depuis `erp-club-frontend-Web` :

```bash
./scripts/sync-analyste-to-backend.sh
```

## Déploiement Render

Le service `erp-club-backend` sur Render redéploie automatiquement au `git push` sur `main`.
