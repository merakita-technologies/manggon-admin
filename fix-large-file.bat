@echo off
REM Script to remove admin.rar from Git history (Windows)

cd /d "%~dp0"

echo === Removing admin.rar from Git History ===
echo.
echo WARNING: This will rewrite Git history!
echo Make sure you have a backup!
echo.
set /p confirm="Continue? (y/N): "

if /i not "%confirm%"=="y" (
    echo Cancelled.
    exit /b 1
)

REM Step 1: Remove from current index
echo Step 1: Removing from Git index...
git rm --cached admin.rar 2>nul

REM Step 2: Add to .gitignore
echo Step 2: Adding to .gitignore...
echo. >> .gitignore
echo # archive files (too large for GitHub) >> .gitignore
echo *.rar >> .gitignore
echo *.zip >> .gitignore
echo admin.rar >> .gitignore

REM Step 3: Remove from Git history
echo Step 3: Removing from Git history...
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch admin.rar" --prune-empty --tag-name-filter cat -- --all

REM Step 4: Clean up
echo Step 4: Cleaning up...
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo.
echo Done! File removed from Git history.
echo.
echo Next steps:
echo 1. Commit the .gitignore changes:
echo    git add .gitignore
echo    git commit -m "chore: remove admin.rar and add to .gitignore"
echo.
echo 2. Force push to remote (WARNING: This rewrites remote history!):
echo    git push origin dev --force
echo.
echo 3. Notify your team to run:
echo    git fetch origin
echo    git reset --hard origin/dev

pause
