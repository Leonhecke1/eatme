#!/bin/sh
# Taegliches pg_dump nach /backups, alte Sicherungen werden nach BACKUP_KEEP_DAYS geloescht.
set -eu

while true; do
  file="/backups/eatme-$(date +%Y-%m-%d_%H%M).sql.gz"
  if pg_dump --no-owner | gzip > "$file.tmp"; then
    mv "$file.tmp" "$file"
    echo "Backup erstellt: $file"
  else
    rm -f "$file.tmp"
    echo "Backup fehlgeschlagen" >&2
  fi
  find /backups -name 'eatme-*.sql.gz' -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete
  sleep 86400
done
