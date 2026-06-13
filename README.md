# 🚗 Del Road (Mobile Drive Tracker)

Del Road adalah aplikasi pelacakan perjalanan premium dengan antarmuka mode gelap (Dark Theme) modern, dirancang untuk memberikan analitik mengemudi secara real-time dan gamifikasi interaktif.

## ✨ Fitur Utama

### 1. HUD (Head-Up Display) Real-time
*   **Speedometer Interaktif:** Desain melingkar kustom (SVG) yang bereaksi terhadap kecepatan Anda secara real-time.
*   **G-Force Crosshair:** Indikator visual titik merah yang bergerak sesuai dengan gaya G-Force akselerasi dan pengereman perangkat.
*   **Kompas Pintar:** Jarum kompas visual yang selalu menunjukkan arah laju kendaraan Anda.
*   **Peringatan Batas Kecepatan:** Warna indikator kecepatan berubah saat Anda mendekati atau melewati batas kecepatan.

### 2. Peta & Perekaman Perjalanan (Map)
*   **Perekaman Akurat:** Tombol bergradien tebal untuk Memulai, Menjeda, dan Mengakhiri perjalanan dengan mudah.
*   **Live Overlay:** Menampilkan status jalan, batas kecepatan, dan waktu saat ini dengan visibilitas tinggi saat merekam di atas peta.
*   **Zona & Cuaca:** Pemantauan kondisi sekitar secara langsung.

### 3. Riwayat Perjalanan (History)
*   **Kartu Perjalanan Detail:** Menampilkan jarak, durasi, kecepatan rata-rata, dan waktu perjalanan dengan desain garis-garis neon.
*   **Preview Rute Peta:** Cuplikan rute mini (Leaflet map) untuk setiap perjalanan yang tersimpan tanpa harus membuka detail.
*   **Tampilan Kalender / Aktivitas:** Beralih antara daftar semua aktivitas dan ringkasan statistik harian.

### 4. Detail Perjalanan Lengkap & Fitur Berbagi (Share Card)
*   **Metrik Telematika Lengkap:** Menganalisis Jumlah Pengereman, G-Force Tertinggi, Akselerasi Maksimal, Perubahan Jalur, dan lainnya.
*   **Distribusi Kecepatan:** Grafik batang multi-segmen yang menunjukkan berapa lama dan sejauh mana Anda melaju di rentang kecepatan tertentu (berdasarkan waktu atau jarak).
*   **Share Card Generator:** Menyimpan layar ringkasan mengemudi yang indah menjadi gambar (Image PNG) siap bagikan ke media sosial. Anda dapat mengganti latar belakang (background) kartu ringkasan ini dengan foto galeri Anda sendiri.

### 5. Wawasan & Gamifikasi (Insights)
*   **Dashboard Analitik:** Menyajikan metrik total seperti Total Jarak (km), Durasi (jam), Kecepatan Maksimum, dan G-Force Maksimum.
*   **Sistem Milestone:** Berbagai pencapaian (Achievement) otomatis terbuka berdasarkan seberapa jauh atau seberapa sering Anda mengemudi.
*   **Streak Mengemudi:** Menghitung jumlah hari berturut-turut Anda mengemudi dengan indikator ikon api.

### 6. Garasi Virtual (Garage)
*   **Manajemen Kendaraan:** Tambahkan kendaraan yang Anda kendarai.
*   **Sistem Rating Elo:** Skor gaya mengemudi dan kemampuan telematika yang disimulasikan seperti poin rank game, lengkap dengan progress bar.
*   **Dark Modal UI:** UI input kustom premium untuk menambahkan kendaraan baru ke garasi.

### 7. Profil Pengemudi (Profile)
*   **Identitas Pengemudi (Driver ID):** Avatar dengan inisial dan lencana "PRO".
*   **Progress Pencapaian (Achievements Bar):** Bar persentase penyelesaian berbagai milestone dan koleksi piala visual (Emoji Badges).
*   **Quick Actions:** Akses cepat ke pengaturan dan fitur eksport data kendaraan.

### 8. Layar Perayaan (Celebration Screen)
*   **Hadiah Pasca-Berkendara:** Setiap selesai berkendara, sistem mengecek jika ada *Milestone* baru yang tercapai atau *Streak* hari ini berhasil diperbarui.
*   **Animasi Sukses:** Tampilan UI bergradien neon hijau khusus sebagai apresiasi setelah log perjalanan.

---
**Teknologi:** React Native, Expo, NativeWind (Tailwind CSS), Leaflet Peta, Expo Sensors (GPS & Akselerometer), ViewShot (Share).
