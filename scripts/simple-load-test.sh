#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://sugang.drg/}"
REQUESTS="${2:-100}"
CONCURRENCY="${3:-10}"

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

echo "Target: $URL"
echo "Requests: $REQUESTS"
echo "Concurrency: $CONCURRENCY"
echo

seq "$REQUESTS" | xargs -P "$CONCURRENCY" -I {} \
  curl -sS -o /dev/null -w "%{http_code} %{time_total}\n" "$URL" > "$TMP_FILE"

echo "Status count"
awk '{ count[$1]++ } END { for (code in count) print code, count[code] }' "$TMP_FILE" | sort

echo
echo "Latency seconds"
awk '
  NR == 1 { min = $2; max = $2 }
  { total += $2; if ($2 < min) min = $2; if ($2 > max) max = $2 }
  END {
    if (NR == 0) exit 1;
    printf "avg %.4f\nmin %.4f\nmax %.4f\n", total / NR, min, max
  }
' "$TMP_FILE"
