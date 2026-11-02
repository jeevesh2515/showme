import os
import shutil
import stat
import subprocess
from pathlib import Path

SCRIPT = Path(__file__).parent / "e2e_live.sh"

FAKE_VERCEL = """#!/usr/bin/env bash
S="$STATE"; touch "$S/vars"
case "$1 $2" in
  "env ls")
    n=$(( $(cat "$S/ls_n" 2>/dev/null || echo 0) + 1 )); echo $n > "$S/ls_n"
    [ -n "${FAIL_ENV_LS_AFTER:-}" ] && [ "$n" -gt "$FAIL_ENV_LS_AFTER" ] && exit 1
    cat "$S/vars"; [ -n "${KEEP_VARS:-}" ] && echo "RATE_PER_HOUR Encrypted Production"; exit 0 ;;
  "env add")
    [ "$3" = "${FAIL_ADD:-}" ] && exit 1
    echo "$3 Encrypted Production" >> "$S/vars"; exit 0 ;;
  "env rm")
    [ -n "${FAIL_ENV_RM:-}" ] && exit 1
    grep -v "^$3 " "$S/vars" > "$S/vars.new"; mv "$S/vars.new" "$S/vars"; exit 0 ;;
esac
if [ "$1" = deploy ]; then
  n=$(( $(cat "$S/deploy_n" 2>/dev/null || echo 0) + 1 )); echo $n > "$S/deploy_n"
  [ "$n" = "${FAIL_DEPLOY_N:-}" ] && exit 1
  exit 0
fi
exit 1
"""
FAKE_MAKE = '#!/usr/bin/env bash\nexit "${E2E_EXIT:-0}"\n'


def run(tmp_path, **env):
    repo = tmp_path / "repo"
    (repo / "scripts").mkdir(parents=True)
    (repo / "backend").mkdir()
    shutil.copy(SCRIPT, repo / "scripts" / "e2e_live.sh")
    bindir, state = tmp_path / "bin", tmp_path / "state"
    bindir.mkdir()
    state.mkdir()
    for name, body in (("vercel", FAKE_VERCEL), ("make", FAKE_MAKE)):
        (bindir / name).write_text(body)
        (bindir / name).chmod(stat.S_IRWXU)
    git = ["git", "-C", str(repo), "-c", "user.name=t", "-c", "user.email=t@t"]
    subprocess.run([*git, "init", "-q"], check=True)
    subprocess.run([*git, "add", "-A"], check=True)
    subprocess.run([*git, "commit", "-qm", "x"], check=True)
    full = {**os.environ, "PATH": f"{bindir}:{os.environ['PATH']}", "STATE": str(state), **env}
    r = subprocess.run(["bash", str(repo / "scripts" / "e2e_live.sh")], env=full, capture_output=True, text=True)
    out = r.stdout + r.stderr
    vars_ = (state / "vars").read_text() if (state / "vars").exists() else ""
    deploys = int((state / "deploy_n").read_text()) if (state / "deploy_n").exists() else 0
    return r.returncode, out, vars_, deploys


def test_happy_path_restores(tmp_path):
    rc, out, vars_, deploys = run(tmp_path)
    assert rc == 0 and "restored:" in out
    assert "RATE_PER" not in vars_ and deploys == 2


def test_env_rm_fails(tmp_path):
    rc, out, _, _ = run(tmp_path, FAIL_ENV_RM="1")
    assert rc != 0 and "restored:" not in out and "RESTORE FAILED" in out


def test_restore_redeploy_fails(tmp_path):
    rc, out, _, _ = run(tmp_path, FAIL_DEPLOY_N="2")
    assert rc != 0 and "restored:" not in out and "RESTORE FAILED" in out


def test_verification_listing_fails(tmp_path):
    rc, out, _, _ = run(tmp_path, FAIL_ENV_LS_AFTER="1")
    assert rc != 0 and "restored:" not in out and "RESTORE FAILED" in out


def test_e2e_failure_preserved_when_restore_ok(tmp_path):
    rc, out, _, _ = run(tmp_path, E2E_EXIT="3")
    assert rc == 3 and "restored:" in out


def test_partial_raise_still_restores(tmp_path):
    rc, out, vars_, deploys = run(tmp_path, FAIL_ADD="RATE_PER_DAY")
    assert rc != 0 and "RATE_PER" not in vars_ and deploys == 1  # only the restore deploy


def test_preexisting_vars_refused(tmp_path):
    rc, out, _, deploys = run(tmp_path, KEEP_VARS="1")
    assert rc != 0 and "already set" in out and deploys == 0


def test_sigterm_during_run_still_restores(tmp_path):
    import signal
    import time

    repo = tmp_path / "repo"
    (repo / "scripts").mkdir(parents=True)
    (repo / "backend").mkdir()
    shutil.copy(SCRIPT, repo / "scripts" / "e2e_live.sh")
    bindir, state = tmp_path / "bin", tmp_path / "state"
    bindir.mkdir()
    state.mkdir()
    make = '#!/usr/bin/env bash\ntouch "$STATE/make_started"\nsleep 30\n'
    for name, body in (("vercel", FAKE_VERCEL), ("make", make)):
        (bindir / name).write_text(body)
        (bindir / name).chmod(stat.S_IRWXU)
    git = ["git", "-C", str(repo), "-c", "user.name=t", "-c", "user.email=t@t"]
    subprocess.run([*git, "init", "-q"], check=True)
    subprocess.run([*git, "add", "-A"], check=True)
    subprocess.run([*git, "commit", "-qm", "x"], check=True)
    full = {**os.environ, "PATH": f"{bindir}:{os.environ['PATH']}", "STATE": str(state)}
    log = open(tmp_path / "wrapper.log", "w")  # noqa: SIM115 - file, not PIPE: orphans must not block the test
    proc = subprocess.Popen(
        ["bash", str(repo / "scripts" / "e2e_live.sh")],
        env=full,
        stdout=log,
        stderr=subprocess.STDOUT,
        text=True,
    )
    for _ in range(100):
        if (state / "make_started").exists():
            break
        time.sleep(0.1)
    assert (state / "make_started").exists(), "wrapper never reached the E2E run"
    proc.send_signal(signal.SIGTERM)
    proc.wait(timeout=30)
    out = (tmp_path / "wrapper.log").read_text()
    vars_ = (state / "vars").read_text() if (state / "vars").exists() else ""
    deploys = int((state / "deploy_n").read_text()) if (state / "deploy_n").exists() else 0
    assert "RATE_PER" not in vars_, f"limits left raised after SIGTERM: {out}"
    assert deploys == 2, f"restore redeploy missing after SIGTERM: {out}"
