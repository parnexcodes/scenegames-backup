#!/bin/bash
set -e
cd "$(dirname "$0")"
COMMAND=$1
COMPOSE_PROJECT_NAME="sg"

show_help() {
  echo "Usage: app COMMAND"
  echo "Commands:"
  echo "  build:    Build SG"
  echo "  start:    Start SG"
  echo "  stop:     Stop SG"
  echo "  restart:  Restart SG"
  echo "  update:   Update the SG codebase. Backup/Restore will run automatically."
  echo "  backup:   Backup database to the 'mongo_backup' directory"
  echo "  restore:  Restore database from the 'mongo_backup' directory"
  echo "  "
  echo "  clean:    Clean up images, containers"
  echo "  destroy:  Stop and remove the SG image. BACKUP FIRST!"
  echo "  rebuild:  Rebuild SG (stop, destroy, start new). BACKUP FIRST!"
  exit 1
}

remove_container_old() {
  local OLD_CONTAINER=$(docker image ls -f 'reference=sg' --format '{{.ID}}')
  if [ -n "$OLD_CONTAINER" ] ; then
    stop
    echo "Removing old container"
    docker image rm $OLD_CONTAINER
  else
    echo "Could not find old container to remove."
  fi
}

build() {
  docker build --rm -t sg .
  docker-compose up --build -d
}

clean() {
  docker container prune -f
  docker image prune --all -f
}

stop() {
  docker-compose stop
}

start() {
  docker-compose start
}

restart() {
  docker-compose restart
}

_del_backup_in_container() {
  docker exec -w /data sg-db rm -rf mongo_backup
}

backup() {
  # Delete local backup
  rm -rf mongo_backup
  # Create a backup in mongo container
  docker exec -w /data sg-db mongodump -o mongo_backup
  # Copy it to local directory
  docker cp sg-db:/data/mongo_backup .
  # Delete backup from mongo container
  _del_backup_in_container
}

restore() {
  if [ -d "mongo_backup/sg/" ] ; then
    # Delete possible leftover backup from mongo container
    _del_backup_in_container
    # Copy local backup to container
    docker cp mongo_backup sg-db:/data/
    # Restore from backup
    docker exec -w /data sg-db mongorestore --drop mongo_backup
    # Delete backup in container
    _del_backup_in_container
  else
    echo "Backup not found in $PWD/mongo_backup/"
  fi
}

update() {
  local FOUND_REPO=0
  if [ -d "./.git/config" ] && [ grep -q '\[remote "origin"\]' "./.git/config" ]; then
    FOUND_REPO=1
  fi

  backup
  docker-compose down

  if [ $FOUND_REPO -eq 1 ]; then
    git pull
  fi

  build
  restore

  if [ $FOUND_REPO -eq 0 ]; then
    echo "Could not find a git repo to pull from, code was not updated."
  fi
}

case ${COMMAND} in
  'start')
    start
    ;;

  'stop')
    stop
    ;;

  'restart')
    restart
    ;;

  'destroy')
    remove_container_old
    ;;

  'build')
    build
    ;;

  'rebuild')
    remove_container_old
    build
    ;;

  'clean')
    clean
    ;;

  'backup')
    backup
    ;;

  'restore')
    restore
    ;;

  'update')
    update
    ;;

  *)
    show_help
    ;;
esac
