#!/bin/bash
# Exportar base de datos SQLite a SQL dump
sqlite3 .data/sqlite.db .dump > database-backup.sql
echo "Base de datos exportada a database-backup.sql"
ls -lh database-backup.sql
