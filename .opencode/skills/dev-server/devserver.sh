#!/usr/bin/env bash
# Dev server control for the Rk-source project.
# Usage: devserver.sh {start|stop|restart|status} [backend|frontend|all]
#
# Why this exists: backgrounding a dev server from the bash tool is easy to get
# wrong on Windows/git-bash. $! does NOT report the real node PID, so servers
# survive as orphans and hold their port. This script always resolves PIDs by
# port, and always reports the final state so nothing is left running.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LOG_DIR="$ROOT/.devlogs"
BACKEND_PORT=4000
FRONTEND_PORT=5173

mkdir -p "$LOG_DIR"

port_pid() {
  netstat -ano | grep ":$1 " | grep LISTENING | awk '{print $5}' | sort -u
}

kill_port() {
  local pid
  for pid in $(port_pid "$1"); do
    taskkill //F //PID "$pid" >/dev/null 2>&1
  done
}

wait_for_port() {
  local i=0
  while [ "$i" -lt $(( $2 * 2 )) ]; do
    [ -n "$(port_pid "$1")" ] && return 0
    sleep 0.5
    i=$(( i + 1 ))
  done
  return 1
}

start_backend() {
  kill_port "$BACKEND_PORT"
  ( cd "$ROOT/backend" && nohup node src/server.js >"$LOG_DIR/backend.log" 2>&1 </dev/null & disown )
  if wait_for_port "$BACKEND_PORT" 15; then
    echo "backend:  UP   http://localhost:$BACKEND_PORT   (.devlogs/backend.log)"
  else
    echo "backend:  FAILED to start"
    tail -20 "$LOG_DIR/backend.log"
    return 1
  fi
}

start_frontend() {
  kill_port "$FRONTEND_PORT"
  ( cd "$ROOT/frontend" && nohup npm run dev >"$LOG_DIR/frontend.log" 2>&1 </dev/null & disown )
  if wait_for_port "$FRONTEND_PORT" 30; then
    echo "frontend: UP   http://localhost:$FRONTEND_PORT   (.devlogs/frontend.log)"
  else
    echo "frontend: FAILED to start"
    tail -20 "$LOG_DIR/frontend.log"
    return 1
  fi
}

stop_backend() {
  kill_port "$BACKEND_PORT"
  sleep 1
  if [ -n "$(port_pid "$BACKEND_PORT")" ]; then
    echo "backend:  STILL RUNNING on $BACKEND_PORT"
    return 1
  fi
  echo "backend:  stopped (port $BACKEND_PORT free)"
}

stop_frontend() {
  kill_port "$FRONTEND_PORT"
  sleep 1
  if [ -n "$(port_pid "$FRONTEND_PORT")" ]; then
    echo "frontend: STILL RUNNING on $FRONTEND_PORT"
    return 1
  fi
  echo "frontend: stopped (port $FRONTEND_PORT free)"
}

status() {
  local be fe
  be="$(port_pid "$BACKEND_PORT")"
  fe="$(port_pid "$FRONTEND_PORT")"
  [ -n "$be" ] && echo "backend:  RUNNING (pid $be)" || echo "backend:  not running"
  [ -n "$fe" ] && echo "frontend: RUNNING (pid $fe)" || echo "frontend: not running"
}

case "${1:-status}" in
  start)
    case "${2:-all}" in
      backend) start_backend ;;
      frontend) start_frontend ;;
      all) start_backend && start_frontend ;;
      *) echo "usage: devserver.sh start [backend|frontend|all]"; exit 2 ;;
    esac
    ;;
  stop)
    case "${2:-all}" in
      backend) stop_backend ;;
      frontend) stop_frontend ;;
      all) stop_frontend; stop_backend ;;
      *) echo "usage: devserver.sh stop [backend|frontend|all]"; exit 2 ;;
    esac
    ;;
  restart)
    "$0" stop "${2:-all}"
    "$0" start "${2:-all}"
    status
    ;;
  verify)
    # Default action. Starts, probes, stops, and confirms the ports are free —
    # all inside this one call, so no server ever outlives it.
    "$0" stop all >/dev/null 2>&1
    "$0" start all || exit 1
    echo ""
    echo "--- probing ---"
    curl -s -m 5 -o /dev/null -w "backend  /api/health -> HTTP %{http_code}\n" "http://localhost:$BACKEND_PORT/api/health"
    curl -s -m 5 -o /dev/null -w "frontend /            -> HTTP %{http_code}\n" "http://localhost:$FRONTEND_PORT/"
    echo ""
    echo "--- stopping ---"
    "$0" stop all
    status
    ;;
  status) status ;;
  *)
    echo "usage: devserver.sh {start|stop|restart|status} [backend|frontend|all]"
    exit 2
    ;;
esac
