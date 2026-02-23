#!/bin/bash

# ==============================================================================
# Skrip Instalasi Otomatis AbsensiKU (Full Setup)
# Mengatur Komponen System, Konfigurasi Database, Build, & Service Systemd
# ==============================================================================

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}      Instalasi Lengkap & Otomatis AbsensiKU 🚀     ${NC}"
echo -e "${CYAN}====================================================${NC}"
echo ""

# Memastikan skrip dijalankan dengan akses root/sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Harap jalankan skrip ini menggunakan sudo!${NC}"
  echo -e "Perintah yang benar: ${YELLOW}sudo ./install.sh${NC}"
  exit 1
fi

APP_USER=${SUDO_USER:-root}
GITHUB_REPO="https://github.com/Chandra2702/AbsensiKU.git"
APP_CLONE_DIR="/opt/absensiku"

# Deteksi Mode: Offline (lokal file sudah ada) atau Online (via curl)
if [ -f "package.json" ] && grep -q "absensiku" package.json; then
    echo -e "${GREEN}[Mode Offline] Menjalankan instalasi dari folder saat ini...${NC}"
    APP_DIR=$(pwd)
else
    echo -e "${YELLOW}[Mode Online] Akan mendownload proyek dari GitHub ke $APP_CLONE_DIR...${NC}"
    
    # Install git jika belum ada
    apt-get update -y && apt-get install -y git
    
    # Hapus folder lama jika ada, lalu clone yang baru
    rm -rf "$APP_CLONE_DIR"
    git clone "$GITHUB_REPO" "$APP_CLONE_DIR" || { echo -e "${RED}Gagal download dari GitHub.${NC}"; exit 1; }
    
    # Masuk ke direktori hasil download
    cd "$APP_CLONE_DIR" || exit
    APP_DIR="$APP_CLONE_DIR"
    
    # Set kepemilikan
    chown -R $APP_USER:$APP_USER "$APP_DIR"
fi

echo -e "\n${YELLOW}[1/7] Menginstal Komponen Sistem (MariaDB & Node.js)...${NC}"
apt-get update -y
apt-get install -y curl software-properties-common mariadb-server

# Cek apakah Node.js sudah ada dan versinya memadai (Minimal v18)
NODE_VER=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VER" ] || [ "$NODE_VER" -lt 18 ]; then
    echo -e "Menginstal Node.js versi terbaru (20.x)..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo -e "${GREEN}✓ Komponen platform berhasil disiapkan.${NC}"

echo -e "\n${YELLOW}[2/7] Konfigurasi Aplikasi...${NC}"
read -p "Masukkan Port Web yang diinginkan [default: 3000]: " WEB_PORT </dev/tty
WEB_PORT=${WEB_PORT:-3000}

read -p "Masukkan Username Database Baru [default: absensiku]: " DB_USER </dev/tty
DB_USER=${DB_USER:-absensiku}

read -p "Masukkan Password untuk User '\$DB_USER' [default: admin123]: " DB_PASS </dev/tty
DB_PASS=${DB_PASS:-admin123}

read -p "Masukkan Nama Database [default: absensiku]: " DB_NAME </dev/tty
DB_NAME=${DB_NAME:-absensiku}

echo -e "\n${YELLOW}[3/7] Membuat File Konfigurasi Lingkungan (.env)...${NC}"
cat <<EOT > "$APP_DIR/.env"
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_NAME=$DB_NAME
DB_PORT=3306

PORT=$WEB_PORT
SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "absensiku-secure-key-$(date +%s)")
EOT

chown $APP_USER:$APP_USER "$APP_DIR/.env" 2>/dev/null || true
echo -e "${GREEN}✓ File .env berhasil dibuat di $APP_DIR/.env${NC}"

echo -e "\n${YELLOW}[4/7] Mengatur MariaDB / Database Lokal...${NC}"
systemctl start mariadb || systemctl start mysql
systemctl enable mariadb || systemctl enable mysql

mariadb -u root -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;" || { echo -e "${RED}Gagal membuat database.${NC}"; exit 1; }
mariadb -u root -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mariadb -u root -e "ALTER USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mariadb -u root -e "GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';"
mariadb -u root -e "FLUSH PRIVILEGES;"
echo -e "${GREEN}✓ Database dan Kredensial berhasil diatur.${NC}"

echo -e "\n${YELLOW}[5/7] Menginstal Package Library NPM...${NC}"
# Kita paksa proses npm install menggunakan npm global jika perlu
npm install --prefix "$APP_DIR"
chown -R $APP_USER:$APP_USER "$APP_DIR/node_modules" 2>/dev/null || true

echo -e "\n${YELLOW}[6/7] Membangun Aplikasi (Build & Seed Database)...${NC}"
echo -e "Menjalankan Build frontend... (Tunggu sebentar)"
npm run build --prefix "$APP_DIR"
chown -R $APP_USER:$APP_USER "$APP_DIR/dist" 2>/dev/null || true

echo -e "Memasukkan data awal (Seeder) ke dalam Database..."
npm run seed --prefix "$APP_DIR"

if [ "$WEB_PORT" -lt 1024 ]; then
    echo -e "\n${YELLOW}[!] Membutuhkan Port Khusus (<1024)...${NC}"
    echo -e "Memberikan hak akses 'cap_net_bind_service' ke binary Node.js agar bisa berjalan di Port $WEB_PORT tanpa sudo."
    NODE_BIN=\$(readlink -f \$(which node))
    setcap cap_net_bind_service=+ep "\$NODE_BIN"
    echo -e "${GREEN}✓ Izin Binding Port <= 1024 ditambahkan.${NC}"
fi

echo -e "\n${YELLOW}[7/7] Mendaftarkan AbsensiKU ke Systemctl (Autostart)...${NC}"
SERVICE_FILE="/etc/systemd/system/absensiku.service"

cat <<EOT > $SERVICE_FILE
[Unit]
Description=AbsensiKU Application Server
After=network.target mariadb.service mysql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOT

systemctl daemon-reload
systemctl enable absensiku
systemctl restart absensiku
echo -e "${GREEN}✓ Service absensiku berhasil diaktifkan otomatis.${NC}"

echo -e "\n${CYAN}====================================================${NC}"
echo -e "${GREEN}Instalasi AbsensiKU Selesai dengan Sempurna! 🎉${NC}"
echo -e "Port Akses Web  : ${CYAN}$WEB_PORT${NC}"
echo -e "Database Name   : ${CYAN}$DB_NAME${NC}"
echo -e "Database User   : ${CYAN}$DB_USER${NC}"
echo -e "Status Aplikasi : ${GREEN}Berjalan di Latar Belakang (Systemctl)${NC}"
echo -e "${CYAN}====================================================${NC}"
echo -e "Aplikasi Anda sekarang aktif dan akan otomatis hidup kembali jika server Reboot."
echo -e "Silakan akses dashboard Anda melalui browser HTTP di Port $WEB_PORT"
echo -e ""
echo -e "${YELLOW}Perintah Berguna:${NC}"
echo -e "- Melihat Log  : \`sudo journalctl -u absensiku -f\`"
echo -e "- Restart App  : \`sudo systemctl restart absensiku\`"
echo -e "- Stop App     : \`sudo systemctl stop absensiku\`"
echo -e "${CYAN}====================================================${NC}"
