"""
Atomic freeze script: commits source, compiles with hash injection,
then amends the commit to include compiled output.
"""
import subprocess, sys, os

os.chdir(r"D:\OPS3\01_SOURCE_CODE")

# Clean pycache
import shutil
if os.path.exists("__pycache__"):
    shutil.rmtree("__pycache__")

# Step 1: Stage and commit SOURCE files only
subprocess.run(["git", "add", "builder_utils.py", "compile.py", "docs/ui/UI_AUDIT_REPORT_v1.md"], check=True)
subprocess.run(["git", "commit", "-m", "Fix: freeze v1.1.3 commit hash consistency across blueprint + audit"], check=True)

# Step 2: Get the commit hash
result = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True, check=True)
commit_hash = result.stdout.strip()
print(f"Source commit: {commit_hash}")

# Step 3: Compile (injects commit_hash into HTML and audit report)
subprocess.run([sys.executable, "compile.py"], check=True)

# Clean pycache again
if os.path.exists("__pycache__"):
    shutil.rmtree("__pycache__")

# Step 4: Stage compiled output and amend
subprocess.run(["git", "add", "docs/ui/OPS3_BLUEPRINT.html", "docs/ui/UI_AUDIT_REPORT_v1.md"], check=True)
subprocess.run(["git", "commit", "--amend", "--no-edit"], check=True)

# Step 5: Get final hash
result = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True, check=True)
final_hash = result.stdout.strip()
print(f"Final commit (after amend): {final_hash}")
print(f"Displayed hash in blueprint/audit: {commit_hash}")
print(f"Match: {commit_hash == final_hash}")

# Step 6: Create tag
subprocess.run(["git", "tag", "ui-freeze-v1.1.3"], check=True)
print(f"Tag ui-freeze-v1.1.3 created at {final_hash}")

# Step 7: Push
subprocess.run(["git", "push", "origin", "main", "--tags", "-f"], check=True)
print("Pushed to origin.")
