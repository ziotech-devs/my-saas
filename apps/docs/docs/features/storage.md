---
id: storage
title: Storage
---

# Storage

File storage via MinIO (local) or AWS S3 (production).

## Environment Variables

```env
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=uploads
```

## Key Files

- `apps/server/src/storage/` — Storage module
