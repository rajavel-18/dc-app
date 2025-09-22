// import { drizzle } from 'drizzle-orm/node-postgres';
// import { Pool } from 'pg';
// import * as schema from './schema';
// import * as dotenv from 'dotenv';
// dotenv.config();

// const databaseUrl = process.env.DATABASE_URL;

// if (!databaseUrl) {
//   throw new Error('DATABASE_URL environment variable is required');
// }

// const pool = new Pool({
//   connectionString: databaseUrl,
// });

// export const db = drizzle(pool, { schema });


import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

@Global()
@Module({
  providers: [
    {
      provide: 'DRIZZLE',
      useValue: db,
    },
  ],
  exports: ['DRIZZLE'],
})
export class DrizzleModule {}
