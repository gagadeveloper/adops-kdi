const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Successfully connected to database.');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    console.log('\nCheck your DATABASE_URL in .env file:');
    return false;
  }
}

async function checkExistingTables() {
  try {
    console.log('\nChecking existing database structure...');
    
    // This works for PostgreSQL - gets a list of all tables in the public schema
    const result = await prisma.$queryRaw`
      SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';
    `;
    
    if (result.length === 0) {
      console.log('📂 No tables found in database. Ready for fresh setup.');
      return {empty: true};
    }
    
    console.log('📋 Existing tables:');
    const tables = result.map(r => r.tablename);
    tables.forEach(table => console.log(` - ${table}`));
    
    return {empty: false, tables};
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    return {error: true, message: error.message};
  }
}

function runPrismaDbPush() {
  return new Promise((resolve, reject) => {
    console.log('\n🚀 Running npx prisma db push...');
    
    exec('npx prisma db push', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error:', stderr);
        reject(error);
        return;
      }
      
      console.log('✅', stdout);
      resolve();
    });
  });
}

function runSeedScript() {
  return new Promise((resolve, reject) => {
    console.log('\n🌱 Running seed script...');
    
    exec('node seed.js', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error:', stderr);
        reject(error);
        return;
      }
      
      console.log('✅', stdout);
      resolve();
    });
  });
}

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.log('Please check your database connection and try again.');
      process.exit(1);
    }
    
    const dbState = await checkExistingTables();
    
    if (dbState.error) {
      console.log('Please check database permissions and try again.');
      process.exit(1);
    }
    
    if (!dbState.empty) {
      const answer = await askQuestion('\n⚠️ Database already has tables. Do you want to continue and potentially modify these tables? (yes/no): ');
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Operation cancelled by user.');
        process.exit(0);
      }
    }
    
    await runPrismaDbPush();
    
    const seedAnswer = await askQuestion('\nDo you want to run the seed script to populate the database with initial data? (yes/no): ');
    
    if (seedAnswer.toLowerCase() === 'yes') {
      await runSeedScript();
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nTest credentials:');
    console.log('Admin: admin@adops.com / admin123');
    console.log('User:  user@adops.com / user123');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();