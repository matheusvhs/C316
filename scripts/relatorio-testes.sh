#!/usr/bin/env bash
set -uo pipefail

SUITES=("Backend (Pytest):test-backend" "Frontend (Vitest):test-frontend" "E2E (Playwright):test-e2e")
LOG_DIR=$(mktemp -d)
trap 'rm -rf "$LOG_DIR"' EXIT

resumir() {
  local log="$1"
  sed -E 's/\x1b\[[0-9;]*m//g' "$log" | {
    case "$2" in
      test-backend) grep -E '^=+ .*(passed|failed|error).* =+$' | tail -1 | sed -E 's/^=+ (.*) in [0-9.]+s.*$/\1/' ;;
      test-frontend) grep -E '^ +Tests +' | tail -1 | sed -E 's/^ +Tests +//; s/ \([0-9]+\)$//' ;;
      test-e2e) grep -E '^ +[0-9]+ (passed|failed|flaky|skipped)' | sed -E 's/^ +//; s/ \(.*\)$//' | paste -sd ',' - | sed 's/,/, /g' ;;
    esac
  }
}

linhas=()
falhou=0
for suite in "${SUITES[@]}"; do
  nome="${suite%%:*}"
  alvo="${suite##*:}"
  log="$LOG_DIR/$alvo.log"
  printf '\n\033[1m=== %s ===\033[0m\n' "$nome"
  inicio=$(date +%s)
  if make --no-print-directory "$alvo" 2>&1 | tee "$log"; then
    status="\033[32mOK\033[0m    "
  else
    status="\033[31mFALHOU\033[0m"
    falhou=1
  fi
  duracao=$(($(date +%s) - inicio))
  resumo=$(resumir "$log" "$alvo")
  linhas+=("$(printf '%b  %-20s %5ss   %s' "$status" "$nome" "$duracao" "${resumo:-sem resumo}")")
done

printf '\n\033[1m=== Relatório dos testes ===\033[0m\n'
printf '%s\n' "${linhas[@]}"
if [ "$falhou" -eq 0 ]; then
  printf '\n\033[32mTodas as suítes passaram.\033[0m\n'
else
  printf '\n\033[31mPelo menos uma suíte falhou. Veja a saída acima.\033[0m\n'
fi
exit "$falhou"
