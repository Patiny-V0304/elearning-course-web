const { PrismaClient } = require('../generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Tạo adapter kết nối trực tiếp tới PostgreSQL
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Singleton pattern: tránh tạo nhiều instance PrismaClient trong development
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
