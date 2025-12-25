#!/bin/bash
# Script to remove admin.rar from Git history

cd "$(dirname "$0")"

echo "=== Removing admin.rar from Git History ==="
echo ""
echo "⚠️  WARNING: This will rewrite Git history!"
echo "⚠️  Make sure you have a backup!"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Step 1: Remove from current index (already done)
echo "Step 1: Removing from Git index..."
git rm --cached admin.rar 2>/dev/null || echo "File already removed from index"

# Step 2: Add to .gitignore (already done)
echo "Step 2: Adding to .gitignore..."
echo "" >> .gitignore
echo "# archive files (too large for GitHub)" >> .gitignore
echo "*.rar" >> .gitignore
echo "*.zip" >> .gitignore
echo "admin.rar" >> .gitignore

# Step 3: Remove from Git history
echo "Step 3: Removing from Git history..."
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch admin.rar" \
  --prune-empty --tag-name-filter cat -- --all

# Step 4: Clean up
echo "Step 4: Cleaning up..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Done! File removed from Git history."
echo ""
echo "Next steps:"
echo "1. Commit the .gitignore changes:"
echo "   git add .gitignore"
echo "   git commit -m 'chore: remove admin.rar and add to .gitignore'"
echo ""
echo "2. Force push to remote (⚠️  WARNING: This rewrites remote history!):"
echo "   git push origin dev --force"
echo ""
echo "3. Notify your team to run:"
echo "   git fetch origin"
echo "   git reset --hard origin/dev"
