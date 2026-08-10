# PLAN TESSS 


# Robotic Code OP3

![alt text](./images/image.png)

## How to run ( OLD ) 

build
```bash
❯ colcon build --continue-on-error
```


action editor
```bash
ros2 run op3_action_editor webots_executor.py
```


rqt_image_view 
```bash
ros2 run rqt_image_view rqt_image_view
```


ros2 debug vision

```bash
ros2 launch soccer_vision soccer_vision.launch.py publish_debug_image:=true
```

## How to run ( NEWW )

```bash
chmod +x ./run/run_vision_and_webots.sh
./run/run_vision_and_webots.sh
```

### TODO

[ ] Docker
[ ] Lokalisasi
    OTW UKF https://chatgpt.com/share/69209904-ab40-8010-be8c-09a715ca9bb4
[ ] Game controler
[ ] run_kill_all.sh : masih belum nutup
[ ] webots : kalau di refresh masih missconnect 
[ ] vission prototype : cv2 --> yolo /src/soccer_vision/launch/soccer_vision.launch.py

---

# Tutorial Website Bascorro Localhost

Dokumentasi ini menjelaskan cara menyalakan website Bascorro di komputer lokal,
software yang diperlukan, cara mengedit isi website, dan cara mengatasi error
umum.

Website berada di folder:

```bash
docs
```

Path lengkap di komputer ini:

```bash
/home/farhan/Projects/bascorro_website/docs
```

Project website ini menggunakan:

- Next.js untuk aplikasi web.
- React dan TypeScript untuk komponen halaman.
- Fumadocs untuk halaman dokumentasi.
- MDX untuk konten dokumentasi.
- pnpm untuk dependency manager.

## Software Yang Diperlukan

### 1. Node.js

Gunakan Node.js versi LTS. Rekomendasi:

- Node.js 20 LTS
- Node.js 22 LTS

Cek apakah Node.js sudah terinstall:

```bash
node -v
```

Kalau belum ada, install dari:

```text
https://nodejs.org/
```

Untuk Linux, opsi yang rapi adalah memakai nvm:

```text
https://github.com/nvm-sh/nvm
```

### 2. pnpm

Project ini memakai pnpm. Versi yang tertulis di `docs/package.json` adalah:

```text
pnpm@10.15.1
```

Aktifkan pnpm lewat Corepack:

```bash
corepack enable
corepack prepare pnpm@10.15.1 --activate
```

Cek versi pnpm:

```bash
pnpm -v
```

### 3. Git

Git diperlukan untuk clone project, melihat perubahan, dan commit.

Cek Git:

```bash
git --version
```

### 4. Code Editor

Rekomendasi editor:

- Visual Studio Code
- Cursor
- Zed
- WebStorm

Extension yang berguna di VS Code:

- ESLint
- Biome
- Tailwind CSS IntelliSense
- MDX
- TypeScript and JavaScript Language Features

### 5. Browser

Gunakan browser modern:

- Google Chrome
- Microsoft Edge
- Firefox

## Persiapan Pertama Kali

Masuk ke folder website:

```bash
cd /home/farhan/Projects/bascorro_website/docs
```

Install dependency:

```bash
pnpm install
```

Kalau folder `node_modules` sudah ada, command ini tetap aman dijalankan.
pnpm akan memastikan dependency sesuai dengan `pnpm-lock.yaml`.

Buat file environment lokal:

```bash
cp .env.example .env.local
```

Untuk membuka halaman utama website, biasanya env lengkap belum wajib. Beberapa
fitur seperti gallery R2, dataset lab, dan Gemini assist membutuhkan env
tertentu.

## Cara Menyalakan Website Localhost

Masuk ke folder website:

```bash
cd /home/farhan/Projects/bascorro_website/docs
```

Jalankan development server:

```bash
pnpm dev
```

Buka browser ke:

```text
http://localhost:3000
```

Kalau port `3000` sedang dipakai aplikasi lain, Next.js biasanya akan
menawarkan atau memakai port lain, misalnya:

```text
http://localhost:3001
```

Ikuti URL yang muncul di terminal.

## Route Penting

Halaman utama:

```text
http://localhost:3000
```

Halaman docs:

```text
http://localhost:3000/docs
```

Halaman team:

```text
http://localhost:3000/team
```

Halaman gallery:

```text
http://localhost:3000/gallery
```

Halaman competitions:

```text
http://localhost:3000/competitions
```

Halaman robocup:

```text
http://localhost:3000/robocup
```

Dataset lab:

```text
http://localhost:3000/dataset-lab
```

## Cara Mematikan Server Localhost

Di terminal yang sedang menjalankan:

```bash
pnpm dev
```

Tekan:

```text
Ctrl + C
```

Kalau ditanya konfirmasi, tekan:

```text
y
```

## Cara Mengedit Website

Buka folder ini di code editor:

```bash
/home/farhan/Projects/bascorro_website/docs
```

Saat `pnpm dev` masih menyala, perubahan file biasanya otomatis muncul di
browser melalui hot reload. Kalau tidak berubah, refresh browser.

## Struktur Folder Penting

### `docs/package.json`

Berisi script command dan daftar dependency.

Script penting:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm format
pnpm test:unit
pnpm types:check
```

Fungsi script:

- `pnpm dev`: menjalankan website untuk development.
- `pnpm build`: membuat production build.
- `pnpm start`: menjalankan hasil production build.
- `pnpm lint`: cek format/lint dengan Biome.
- `pnpm format`: format code.
- `pnpm test:unit`: menjalankan unit test.
- `pnpm types:check`: cek MDX, Next typegen, dan TypeScript.

### `docs/src/app`

Berisi route utama website.

Contoh:

```text
docs/src/app/(home)/page.tsx
docs/src/app/team/page.tsx
docs/src/app/gallery/page.tsx
docs/src/app/competitions/page.tsx
docs/src/app/robocup/page.tsx
docs/src/app/dataset-lab/page.tsx
```

Kalau ingin membuat halaman baru, biasanya buat folder baru di `docs/src/app`.
Contoh membuat halaman contact:

```text
docs/src/app/contact/page.tsx
```

Maka URL-nya menjadi:

```text
http://localhost:3000/contact
```

### `docs/src/components`

Berisi komponen React yang dipakai oleh halaman.

Contoh:

```text
docs/src/components/landing
docs/src/components/dataset-lab
docs/src/components/docs
docs/src/components/learning
docs/src/components/shared
docs/src/components/ui
```

Kalau ada bagian halaman yang berulang atau besar, sebaiknya dibuat sebagai
component di folder ini.

### `docs/content/docs`

Berisi konten dokumentasi dalam format MDX.

MDX mirip Markdown, tetapi bisa memakai komponen React.

Contoh file:

```text
docs/content/docs/index.mdx
docs/content/docs/getting-started/installation.mdx
docs/content/docs/software/vision.mdx
docs/content/docs/learning/ros/ros2-basics.mdx
```

Kalau ingin mengedit isi halaman docs, edit file MDX di folder ini.

### `docs/public`

Berisi file statis yang bisa diakses langsung oleh browser.

Contoh:

```text
docs/public/Logo_Bascorro.png
docs/public/robot1.jpeg
docs/public/robot2.jpeg
docs/public/team/2025
docs/public/team/2026
```

Contoh penggunaan gambar dari `public`:

```text
/Logo_Bascorro.png
/robot1.jpeg
/team/2026/nama-file.jpg
```

Jangan panggil gambar dengan path `public/nama-file.png` di browser. Folder
`public` sudah menjadi root file statis.

### `docs/src/data`

Berisi data JSON yang dipakai website.

Contoh:

```text
docs/src/data/team-2025.json
docs/src/data/team-2026.json
```

Kalau ingin mengedit data anggota tim, cek file JSON di folder ini.

### `docs/src/app/global.css`

Berisi style global website. Edit file ini kalau ingin mengubah style global,
warna umum, typography, atau utility CSS yang berlaku luas.

## Cara Edit Halaman Utama

Halaman utama berada di:

```text
docs/src/app/(home)/page.tsx
```

Komponen landing page berada di:

```text
docs/src/components/landing/LandingPage.tsx
```

Bagian-bagian landing page berada di folder:

```text
docs/src/components/landing
```

Contoh file penting:

```text
docs/src/components/landing/Hero.tsx
docs/src/components/landing/Intro.tsx
docs/src/components/landing/Achievements.tsx
docs/src/components/landing/Partners.tsx
docs/src/components/landing/Contact.tsx
docs/src/components/landing/Navbar.tsx
```

Kalau ingin mengubah teks hero, cari di `Hero.tsx` atau `LandingPage.tsx`.
Kalau ingin mengubah daftar partner/sponsor, cek `Partners.tsx` dan data
constants yang dipakai komponen landing.

## Cara Edit Dokumentasi

Konten docs ada di:

```text
docs/content/docs
```

Contoh mengedit halaman instalasi:

```text
docs/content/docs/getting-started/installation.mdx
```

Contoh mengedit halaman vision:

```text
docs/content/docs/software/vision.mdx
```

Setelah diedit, buka:

```text
http://localhost:3000/docs
```

Kalau halaman docs tidak muncul setelah menambah file baru, cek file `meta.json`.
Beberapa folder docs memiliki `meta.json` untuk mengatur urutan dan judul
halaman di sidebar.

Contoh:

```text
docs/content/docs/getting-started/meta.json
docs/content/docs/software/meta.json
docs/content/docs/learning/ros/meta.json
```

## Cara Menambah Halaman Docs Baru

Contoh ingin menambah halaman:

```text
/docs/software/navigation
```

Buat file:

```text
docs/content/docs/software/navigation.mdx
```

Isi minimal:

```mdx
---
title: Navigation
description: Catatan sistem navigasi robot.
---

# Navigation

Isi dokumentasi di sini.
```

Update `meta.json` di folder yang sama kalau ingin halaman muncul di sidebar
dengan urutan tertentu.

## Cara Edit Data Team

Data team ada di:

```text
docs/src/data/team-2025.json
docs/src/data/team-2026.json
```

Foto team ada di:

```text
docs/public/team/2025
docs/public/team/2026
```

Langkah umum:

1. Masukkan foto ke folder `docs/public/team/2026`.
2. Edit data anggota di `docs/src/data/team-2026.json`.
3. Pastikan path gambar sesuai dengan file di `public`.
4. Buka `http://localhost:3000/team`.
5. Cek apakah kartu member tampil benar.

## Cara Edit Gambar Dan Aset

Semua aset publik simpan di:

```text
docs/public
```

Contoh menambah gambar robot:

```text
docs/public/robot-baru.jpeg
```

Di React/Next.js, gambar dari folder `public` dipanggil dengan path:

```text
/robot-baru.jpeg
```

Jangan panggil dengan:

```text
public/robot-baru.jpeg
```

Karena folder `public` adalah root untuk file statis di browser.

## Cara Edit Gallery

Halaman gallery ada di:

```text
docs/src/app/gallery/page.tsx
docs/src/app/gallery/GalleryClient.tsx
```

Ada script metadata gallery:

```text
docs/scripts/gallery.metadata.json
docs/scripts/gallery.metadata.ts
docs/scripts/generate-gallery-metadata.sh
```

Gallery juga punya env R2 di:

```text
docs/.env.example
```

Variable yang terkait gallery:

```text
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_ENDPOINT
R2_BUCKET
R2_PUBLIC_BASE_URL
R2_GALLERY_PREFIX
```

Kalau gallery mengambil data dari Cloudflare R2, pastikan `.env.local` sudah
diisi sesuai akun dan bucket yang benar.

## Cara Edit Dataset Lab

Halaman dataset lab:

```text
docs/src/app/dataset-lab/page.tsx
```

Komponen UI dataset lab:

```text
docs/src/components/dataset-lab
```

API dataset lab:

```text
docs/src/app/api/datasets
```

Library/helper dataset lab:

```text
docs/src/lib/dataset-lab
```

Env yang dibutuhkan:

```text
DATASET_LAB_TOKEN
DATASET_LAB_DATA_DIR
GEMINI_API_KEY
```

`DATASET_LAB_TOKEN` wajib untuk akses internal. `GEMINI_API_KEY` opsional,
hanya diperlukan jika ingin fitur assist dari Gemini.

## Cara Cek Website Siap Production

Sebelum deploy atau push perubahan besar, jalankan:

```bash
pnpm lint
pnpm types:check
pnpm test:unit
pnpm build
```

Penjelasan:

- `pnpm lint`: cek masalah format/lint.
- `pnpm types:check`: cek MDX dan TypeScript.
- `pnpm test:unit`: cek unit test.
- `pnpm build`: cek apakah website bisa dibuild.

Kalau semua command berhasil, perubahan biasanya aman untuk direview.

## Cara Menjalankan Mode Production Di Local

Development mode:

```bash
pnpm dev
```

Production local mode:

```bash
pnpm build
pnpm start
```

Setelah `pnpm start`, buka:

```text
http://localhost:3000
```

Catatan:

- `pnpm start` hanya bisa jalan setelah `pnpm build` berhasil.
- Untuk development harian, gunakan `pnpm dev`.

## Troubleshooting Error Umum

### Error: command not found: pnpm

Solusi:

```bash
corepack enable
corepack prepare pnpm@10.15.1 --activate
```

Lalu cek:

```bash
pnpm -v
```

### Error: command not found: node

Solusi:

- Install Node.js 20 LTS atau 22 LTS.
- Tutup dan buka ulang terminal.
- Cek lagi dengan `node -v`.

### Error: port 3000 already in use

Artinya port 3000 sedang dipakai aplikasi lain.

Solusi pertama:

- Ikuti port lain yang ditawarkan Next.js.

Solusi kedua:

- Cari proses yang memakai port 3000:

```bash
ss -ltnp | grep 3000
```

Atau:

```bash
lsof -i :3000
```

Lalu matikan proses yang tidak diperlukan.

### Website tidak berubah setelah diedit

Solusi:

1. Refresh browser.
2. Pastikan file yang diedit memang file yang dipakai halaman tersebut.
3. Cek terminal `pnpm dev` apakah ada error.
4. Stop server dengan `Ctrl + C`, lalu jalankan ulang `pnpm dev`.

### Error dependency atau module tidak ditemukan

Solusi:

```bash
pnpm install
```

Kalau masih error, hapus cache build Next.js:

```bash
rm -rf .next
pnpm dev
```

Catatan: jangan hapus folder lain seperti `src`, `content`, `public`, atau file
project penting.

### Error dari env atau variable kosong

Solusi:

1. Pastikan file `.env.local` ada.
2. Bandingkan dengan `.env.example`.
3. Isi variable yang diperlukan.
4. Restart `pnpm dev` setelah mengubah `.env.local`.

Next.js membaca env saat server dinyalakan. Jadi perubahan `.env.local` sering
butuh restart server.

### Halaman docs error setelah menambah MDX

Cek:

1. Frontmatter MDX benar.
2. Heading Markdown benar.
3. Komponen React yang dipakai sudah diimport.
4. `meta.json` valid JSON.
5. Tidak ada koma berlebih di JSON.

Jalankan:

```bash
pnpm types:check
```

## Alur Kerja Edit Yang Disarankan

Untuk perubahan kecil:

1. Jalankan `pnpm dev`.
2. Edit file.
3. Cek di browser.
4. Jalankan `pnpm lint`.
5. Jalankan `pnpm types:check`.

Untuk perubahan besar:

1. Jalankan `pnpm dev`.
2. Edit file secara bertahap.
3. Cek tiap halaman yang terdampak di browser.
4. Jalankan `pnpm lint`.
5. Jalankan `pnpm types:check`.
6. Jalankan `pnpm test:unit`.
7. Jalankan `pnpm build`.
8. Review perubahan dengan `git status` dan `git diff`.

## Ringkasan Command Penting

Masuk project website:

```bash
cd /home/farhan/Projects/bascorro_website/docs
```

Install dependency:

```bash
pnpm install
```

Buat env lokal:

```bash
cp .env.example .env.local
```

Jalankan localhost:

```bash
pnpm dev
```

Buka website:

```text
http://localhost:3000
```

Format code:

```bash
pnpm format
```

Cek lint:

```bash
pnpm lint
```

Cek TypeScript dan MDX:

```bash
pnpm types:check
```

Jalankan unit test:

```bash
pnpm test:unit
```

Build production:

```bash
pnpm build
```

Jalankan production build:

```bash
pnpm start
```

## File Yang Paling Sering Diedit

Landing page:

```text
docs/src/app/(home)/page.tsx
docs/src/components/landing/LandingPage.tsx
docs/src/components/landing/Hero.tsx
docs/src/components/landing/Contact.tsx
docs/src/components/landing/Partners.tsx
```

Docs:

```text
docs/content/docs
```

Team:

```text
docs/src/app/team/page.tsx
docs/src/app/team/TeamClient.tsx
docs/src/data/team-2025.json
docs/src/data/team-2026.json
docs/public/team
```

Gallery:

```text
docs/src/app/gallery/page.tsx
docs/src/app/gallery/GalleryClient.tsx
docs/scripts/gallery.metadata.json
```

Style global:

```text
docs/src/app/global.css
```

Aset gambar/PDF:

```text
docs/public
```

## Catatan Penting Untuk Editor

1. Jangan edit folder `node_modules` dan `.next` secara manual kecuali paham efeknya.
2. Jangan commit file rahasia seperti `.env.local`.
3. Simpan gambar publik di folder `docs/public`.
4. Simpan konten docs di `docs/content/docs`.
5. Simpan komponen React di `docs/src/components`.
6. Simpan route halaman di `docs/src/app`.
7. Setelah mengubah `.env.local`, restart `pnpm dev`.
8. Setelah menambah dependency baru, pastikan `pnpm-lock.yaml` ikut berubah.

## Checklist Cepat Menyalakan Website

1. Buka terminal.
2. Jalankan:

```bash
cd /home/farhan/Projects/bascorro_website/docs
```

3. Jalankan:

```bash
pnpm install
```

4. Jalankan:

```bash
cp .env.example .env.local
```

5. Jalankan:

```bash
pnpm dev
```

6. Buka browser:

```text
http://localhost:3000
```
