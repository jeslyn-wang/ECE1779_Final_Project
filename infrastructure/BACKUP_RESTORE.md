# Postgres backup and restore

## What runs
`infrastructure/kubernetes/backup.yaml` creates a CronJob (`postgres-backup`) that runs
`pg_dump --format=custom` every night at 07:00 UTC and stores the dump on its own
5 Gi volume (`postgres-backup-pvc`), separate from the database volume. It keeps 7 days.
CD applies this file with the rest of `infrastructure/kubernetes/`.

## Take a backup right now
```bash
kubectl -n ece1779 create job --from=cronjob/postgres-backup backup-manual-$(date +%s)
kubectl -n ece1779 logs job/<the job name printed above>
```

## List backups
```bash
kubectl -n ece1779 run backup-ls --rm -it --restart=Never --image=postgres:16-alpine \
  --overrides='{"spec":{"containers":[{"name":"backup-ls","image":"postgres:16-alpine","command":["ls","-lh","/backups"],"volumeMounts":[{"name":"b","mountPath":"/backups"}]}],"volumes":[{"name":"b","persistentVolumeClaim":{"claimName":"postgres-backup-pvc"}}]}}'
```

## Restore
Restoring replaces the data in the database, so do it deliberately.

1. Pick the dump file name from the listing above.
2. Run a one-off pod that mounts the backup volume and restores into Postgres:
```bash
kubectl -n ece1779 apply -f - <<'YAML'
apiVersion: batch/v1
kind: Job
metadata:
  name: postgres-restore
  namespace: ece1779
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: restore
          image: postgres:16-alpine
          env:
            - { name: PGHOST, value: postgres }
            - name: PGDATABASE
              valueFrom: { configMapKeyRef: { name: app-config, key: POSTGRES_DB } }
            - name: PGUSER
              valueFrom: { configMapKeyRef: { name: app-config, key: POSTGRES_USER } }
            - name: PGPASSWORD
              valueFrom: { secretKeyRef: { name: app-secrets, key: POSTGRES_PASSWORD } }
          command: ["sh", "-ec", "pg_restore --clean --if-exists --no-owner --dbname=\"$PGDATABASE\" /backups/<DUMP FILE NAME>"]
          volumeMounts:
            - { name: backups, mountPath: /backups, readOnly: true }
      volumes:
        - name: backups
          persistentVolumeClaim: { claimName: postgres-backup-pvc }
YAML
kubectl -n ece1779 logs job/postgres-restore
kubectl -n ece1779 delete job postgres-restore
```
3. Check the data: `kubectl -n ece1779 exec deploy/postgres -- sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select count(*) from restaurants"'`

## Limits (be honest in the report)
- Backups live in the same cluster and region as the database. They protect against bad
  data and a lost data volume, not against losing the whole cluster or DigitalOcean account.
  For that, copy dumps off-cluster (e.g. DigitalOcean Spaces).
- Dumps are nightly, so up to a day of changes can be lost.
