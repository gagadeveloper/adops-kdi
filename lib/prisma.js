import { PrismaClient } from '@prisma/client'

// Mencegah multiple connections di development environment
let prisma

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  // Cek apakah sudah ada prisma instance di global
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

export { prisma }