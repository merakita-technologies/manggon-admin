# Fix: GitHub Push Error - File Too Large

## Masalah
```
remote: error: File admin.rar is 100.76 MB; this exceeds GitHub's file size limit of 100.00 MB
```

## Status
✅ File `admin.rar` sudah dihapus dari Git tracking
✅ File `*.rar` sudah ditambahkan ke `.gitignore`

## Langkah Selanjutnya

### Jika File Hanya di Commit Terakhir (Belum di-push ke remote)

1. **Commit perubahan:**
   ```bash
   cd admin
   git add .gitignore
   git commit -m "chore: remove admin.rar and add to .gitignore"
   ```

2. **Push ke remote:**
   ```bash
   git push origin dev
   ```

### Jika File Sudah Ada di History (Sudah Ter-push Sebelumnya)

File perlu dihapus dari Git history. Pilih salah satu metode:

#### Metode 1: Git Filter-Branch (Built-in)
```bash
cd admin

# Backup branch
git branch backup-before-cleanup

# Hapus file dari semua commit
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch admin.rar" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (HATI-HATI!)
git push origin dev --force --all
```

#### Metode 2: BFG Repo-Cleaner (Recommended - Lebih Cepat)
```bash
cd admin

# Download BFG dari: https://rtyley.github.io/bfg-repo-cleaner/
# Atau install via: brew install bfg (Mac) / choco install bfg (Windows)

# Hapus file dari history
java -jar bfg.jar --delete-files admin.rar

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin dev --force
```

#### Metode 3: Reset ke Commit Sebelum File Ditambahkan
```bash
cd admin

# Cari commit sebelum admin.rar ditambahkan
git log --oneline --all | grep -B5 "admin.rar"

# Reset ke commit sebelum file ditambahkan (ganti COMMIT_HASH)
git reset --hard <COMMIT_HASH_BEFORE_ADMIN_RAR>

# Force push
git push origin dev --force
```

## ⚠️ PENTING

1. **Backup dulu!** Buat branch backup sebelum melakukan force push
2. **Koordinasi dengan team** - semua developer perlu melakukan:
   ```bash
   git fetch origin
   git reset --hard origin/dev
   ```
3. **File masih ada di local** - hanya dihapus dari Git tracking

## Verifikasi

Setelah push berhasil, verifikasi:
```bash
git ls-files | grep -i "\.rar"
# Seharusnya tidak ada output
```

## Pencegahan

✅ File `*.rar`, `*.zip`, `*.7z` sudah ditambahkan ke `.gitignore`
✅ Jangan commit file >50MB
✅ Gunakan Git LFS untuk file besar jika memang diperlukan
