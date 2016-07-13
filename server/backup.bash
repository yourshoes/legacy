#!/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
_now=$(date +"%d_%m_%Y")
_zipfile="/var/www/kalzate/client/app/db_backup/kalzate_$_now.zip"
#_zipfile="/home/zuri/Escritorio/angular/kalzate/client/app/db_backup/kalzate_$_now.zip"
_basefolder="/var/www/kalzate/server/"
#_basefolder="/home/zuri/Escritorio/angular/kalzate/server/"
_database="kalzate"
#echo "Moving to server"
cd "$_basefolder"
mongodump --db "$_database"
#echo "dumping made, now zipping ... " "$_basefolder"dump/"$_database"
cd ./dump/
zip -r "$_zipfile" "$_database"
#find "$_basefolder"dump/"$_database" -path '*/.*' -prune -o -type f -print | zip "$_zipfile" -@
#send to pendrive or email
node "$_basefolder"emit_db.js "$_zipfile"
#echo "exiting..."
