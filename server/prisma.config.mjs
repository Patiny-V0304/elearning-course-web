import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  // Đường dẫn tới schema file
  schema: 'prisma/schema.prisma',

  // Cấu hình migration
  migrations: {
    path: 'prisma/migrations',
  },

  // URL kết nối database cho Prisma CLI (migrate, db push, etc.)
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
