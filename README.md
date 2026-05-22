# 📚 E-Learning LMS Platform

Nền tảng học lập trình trực tuyến (LMS) với **Next.js 16** (Client) + **Express + Prisma v7** (Server) + **PostgreSQL 15**.

## Mục lục

- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Kiến trúc dự án](#-kiến-trúc-dự-án)
- [Khởi chạy nhanh (Docker)](#-khởi-chạy-nhanh-docker--khuyên-dùng)
- [Khởi chạy thủ công (không Docker)](#-khởi-chạy-thủ-công-không-docker)
- [Biến môi trường](#-biến-môi-trường)
- [Lệnh hữu ích](#-lệnh-hữu-ích)
- [Xử lý lỗi thường gặp](#-xử-lý-lỗi-thường-gặp)

---

## 🔧 Yêu cầu hệ thống

| Công cụ        | Phiên bản tối thiểu | Ghi chú                          |
| --------------- | -------------------- | -------------------------------- |
| **Docker**      | 20+                  | Bắt buộc nếu chạy bằng Docker   |
| **Docker Compose** | 2.0+              | Thường đi kèm Docker Desktop    |
| **Node.js**     | 22+                  | Chỉ cần nếu chạy thủ công       |
| **npm**         | 10+                  | Đi kèm Node.js                  |
| **Git**         | 2.0+                 | Để clone repo                    |

---

## 📁 Kiến trúc dự án

```
project-e-learning/
├── client/                  # Frontend - Next.js 16 (TypeScript, Tailwind CSS v4)
│   ├── src/app/             # App Router pages
│   ├── .env.example         # Biến môi trường mẫu cho client
│   └── package.json
├── server/                  # Backend - Express.js + Prisma v7
│   ├── controllers/         # Business logic (userController.js, ...)
│   ├── routes/              # API route definitions
│   ├── lib/prisma.js        # Prisma client singleton (driver adapter)
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── prisma.config.mjs    # Prisma v7 CLI configuration
│   ├── Dockerfile           # Docker image cho server
│   ├── .env.example         # Biến môi trường mẫu cho server
│   └── package.json
├── docker-compose.yml       # Orchestration: db + server
├── .env.example             # Biến môi trường mẫu cho Docker Compose (PostgreSQL)
├── ERD-elearning.jpg        # Sơ đồ ERD
└── project-markdown.md      # Tài liệu nghiệp vụ chi tiết
```

---

## 🚀 Khởi chạy nhanh (Docker) — Khuyên dùng

> **Cách này sẽ tự động dựng PostgreSQL + Backend Server cho bạn.**
> Bạn chỉ cần chạy Client (Next.js) ở local.

### Bước 1: Clone repo

```bash
git clone <repo-url>
cd project-e-learning
```

### Bước 2: Tạo file `.env`

Tạo **3 file `.env`** từ các file mẫu:

```bash
# 1. File .env gốc (cho Docker Compose — cấu hình PostgreSQL)
cp .env.example .env

# 2. File .env cho Server (cho Prisma + Express)
cp server/.env.example server/.env

# 3. File .env cho Client (cho Next.js)
cp client/.env.example client/.env.local
```

> [!IMPORTANT]
> Giá trị mặc định trong `.env.example` đã hoạt động ngay, **không cần chỉnh sửa gì** nếu chạy local.

### Bước 3: Khởi chạy Database + Server bằng Docker

```bash
docker compose up --build -d
```

Lệnh này sẽ:
1. Tạo container **PostgreSQL 15** (`lms_db`) trên port `5432`
2. Build và chạy container **Express Server** (`lms_server`) trên port `5000`
3. Tự động chạy `prisma generate` + `prisma db push` để tạo bảng trong database

Chờ khoảng 20-30 giây rồi kiểm tra:

```bash
# Xem trạng thái containers
docker compose ps

# Kiểm tra server đã sẵn sàng chưa
curl http://localhost:5000/api/health
# Kết quả mong đợi: {"status":"OK","message":"Server đang chạy"}
```

### Bước 4: Cài đặt và chạy Client

```bash
cd client
npm install
npm run dev
```

### Bước 5: Mở trình duyệt

| Dịch vụ   | URL                          |
| ---------- | ---------------------------- |
| **Client** | http://localhost:3000         |
| **Server** | http://localhost:5000         |
| **Health** | http://localhost:5000/api/health |

✅ **Xong!** Bạn đã có thể sử dụng ứng dụng.

---

## 🔨 Khởi chạy thủ công (không Docker)

> Dùng cách này nếu bạn muốn chạy mọi thứ trực tiếp trên máy, hoặc không cài Docker.

### Bước 1: Cài PostgreSQL

Cài PostgreSQL 15+ trên máy và tạo database:

```bash
# Đăng nhập PostgreSQL
psql -U postgres

# Tạo user và database
CREATE USER admin WITH PASSWORD 'password123';
CREATE DATABASE lms_database OWNER admin;
\q
```

### Bước 2: Tạo file `.env`

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

**⚠️ Quan trọng:** Mở file `server/.env` và đổi `DATABASE_URL` để trỏ về `localhost` thay vì `db`:

```env
# Đổi dòng này:
DATABASE_URL="postgresql://admin:password123@db:5432/lms_database?schema=public"

# Thành:
DATABASE_URL="postgresql://admin:password123@localhost:5432/lms_database?schema=public"
```

### Bước 3: Cài dependencies và setup Server

```bash
cd server
npm install

# Generate Prisma Client
npx prisma generate

# Tạo bảng trong database
npx prisma db push
```

### Bước 4: Chạy Server

```bash
# Development mode (auto-reload) — cần cài nodemon global hoặc dùng npx
npx nodemon server.js

# Hoặc chạy trực tiếp
npm start
```

### Bước 5: Cài và chạy Client (terminal mới)

```bash
cd client
npm install
npm run dev
```

---

## 🔐 Biến môi trường

### Root `.env` (Docker Compose)

| Biến              | Mô tả                 | Giá trị mặc định |
| ----------------- | ---------------------- | ----------------- |
| `POSTGRES_USER`     | Username PostgreSQL    | `admin`           |
| `POSTGRES_PASSWORD` | Password PostgreSQL    | `password123`     |
| `POSTGRES_DB`       | Tên database           | `lms_database`    |
| `POSTGRES_PORT`     | Port PostgreSQL        | `5432`            |

### Server `.env`

| Biến           | Mô tả                       | Giá trị mặc định                                              |
| -------------- | ---------------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`   | Prisma connection string     | `postgresql://admin:password123@db:5432/lms_database?schema=public` |
| `PORT`           | Port chạy Express server     | `5000`                                                         |

### Client `.env.local`

| Biến                 | Mô tả                 | Giá trị mặc định           |
| -------------------- | ---------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL`  | URL của Backend API    | `http://localhost:5000`     |

---

## 📝 Lệnh hữu ích

### Docker

```bash
# Khởi chạy tất cả (build lại nếu có thay đổi)
docker compose up --build -d

# Xem logs realtime
docker compose logs -f

# Xem logs chỉ server
docker compose logs -f server

# Dừng tất cả
docker compose down

# Dừng và xoá toàn bộ dữ liệu database (volume)
docker compose down -v

# Rebuild chỉ server (khi thay đổi code backend)
docker compose up --build -d server
```

### Prisma (chạy trong thư mục `server/`)

```bash
# Generate Prisma Client (sau khi sửa schema)
npx prisma generate

# Đẩy schema lên database (không tạo migration)
npx prisma db push

# Mở Prisma Studio (GUI xem database)
npx prisma studio
```

### Client (chạy trong thư mục `client/`)

```bash
# Chạy dev server
npm run dev

# Build production
npm run build

# Lint check
npm run lint
```

---

## ❓ Xử lý lỗi thường gặp

### 1. `Port 5432 already in use`

Có PostgreSQL đang chạy local trên cùng port. Giải pháp:

```bash
# Tắt PostgreSQL local
sudo systemctl stop postgresql

# Hoặc đổi port trong docker-compose.yml
ports:
  - "5433:5432"  # Dùng port 5433 thay thế
```

### 2. `ECONNREFUSED` khi server kết nối DB

Server khởi động trước khi database sẵn sàng. Giải pháp:

```bash
# Restart lại server container
docker compose restart server

# Hoặc xem log để debug
docker compose logs server
```

### 3. `Prisma Client not generated`

```bash
# Vào container server và generate lại
docker compose exec server npx prisma generate
```

### 4. Muốn reset database từ đầu

```bash
# Xoá volume và chạy lại
docker compose down -v
docker compose up --build -d
```

### 5. Client không kết nối được Server

- Đảm bảo server đang chạy: `curl http://localhost:5000/api/health`
- Kiểm tra file `client/.env.local` có `NEXT_PUBLIC_API_URL=http://localhost:5000`
- Restart lại client: `npm run dev`

---

## 📊 Tài liệu tham khảo

- **ERD:** Xem file `ERD-elearning.jpg` hoặc `ERD-elearning.drawio`
- **Tài liệu nghiệp vụ:** Xem file `project-markdown.md`

## Tech Stack

| Layer      | Công nghệ                                |
| ---------- | ----------------------------------------- |
| Frontend   | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend    | Express.js, Prisma v7 (Driver Adapter)    |
| Database   | PostgreSQL 15                             |
| Container  | Docker, Docker Compose                    |
| Runtime    | Node.js 22                                |
