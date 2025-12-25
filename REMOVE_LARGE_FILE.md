# Menghapus File Besar dari Git History

## Masalah
File `admin.rar` (100.76 MB) melebihi batas GitHub (100 MB) dan menyebabkan push gagal.

## Solusi

### Opsi 1: Hapus dari Commit Terakhir (Jika Belum Push)
Jika file baru ditambahkan di commit terakhir dan belum di-push:

```bash
cd admin
git rm --cached admin.rar
git commit --amend -m "Remove admin.rar (too large for GitHub)"
git push origin dev --force-with-lease
```

### Opsi 2: Hapus dari Git History (Jika Sudah Ter-commit)
Jika file sudah ter-commit di history sebelumnya, gunakan `git filter-branch`:

```bash
cd admin

# Backup dulu
git branch backup-before-cleanup

# Hapus file dari semua commit
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch admin.rar" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (HATI-HATI: ini akan rewrite history)
git push origin dev --force --all
```

### Opsi 3: Menggunakan BFG Repo-Cleaner (Recommended)
BFG lebih cepat dan aman daripada git filter-branch:

```bash
# Download BFG dari https://rtyley.github.io/bfg-repo-cleaner/

# Hapus file dari history
java -jar bfg.jar --delete-files admin.rar

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin dev --force
```

## Pencegahan
File `*.rar` sudah ditambahkan ke `.gitignore`. Pastikan untuk:

1. **Jangan commit file besar** (>50MB)
2. **Gunakan Git LFS** untuk file besar jika memang diperlukan
3. **Hapus file dari staging** sebelum commit:
   ```bash
   git reset HEAD admin.rar
   ```

## Catatan
- Setelah menghapus file dari history, semua developer perlu melakukan:
  ```bash
  git fetch origin
  git reset --hard origin/dev
  ```
- File `admin.rar` masih ada di local filesystem, hanya dihapus dari Git tracking.
