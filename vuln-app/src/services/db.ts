import { Pool } from 'pg';
import { MongoClient } from 'mongodb';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Required env var ${name} is not set. Refusing to start with insecure default.`);
  }
  return v;
}

const pgPool = new Pool({
  host: process.env.PG_HOST || 'postgres',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DB || 'bheda',
  user: process.env.PG_USER || 'bheda',
  password: requireEnv('PG_PASS'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let mongoClient: MongoClient | null = null;
let mongoDb: any = null;

export async function getMongoDb() {
  if (mongoDb) return mongoDb;
  const uri = process.env.MONGO_URI || 'mongodb://mongo:27017/bheda';
  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  mongoDb = mongoClient.db('bheda');
  return mongoDb;
}

export async function initDb() {
  const client = await pgPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT,
        description TEXT,
        price DECIMAL,
        category TEXT,
        stock INTEGER,
        rating DECIMAL,
        image_url TEXT
      );
      INSERT INTO products (name, description, price, category, stock, rating, image_url) VALUES
        ('Laptop', 'High performance laptop', 999.99, 'Electronics', 10, 4.5, '/img/laptop.jpg'),
        ('Phone', 'Smartphone with great camera', 699.99, 'Electronics', 25, 4.2, '/img/phone.jpg'),
        ('Book', 'Interesting book', 19.99, 'Books', 100, 4.8, '/img/book.jpg')
      ON CONFLICT DO NOTHING;

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );
      INSERT INTO users (username, password, email, role) VALUES
        ('admin', 'bheda_admin_pass_2024', 'admin@bheda.local', 'admin'),
        ('user1', 'password123', 'user1@test.com', 'user'),
        ('user2', 'letmein', 'user2@test.com', 'user')
      ON CONFLICT DO NOTHING;

      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        username TEXT,
        body TEXT,
        product_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
      INSERT INTO comments (username, body, product_id) VALUES
        ('Alice', 'Great product!', 1),
        ('Bob', 'Love it!', 2)
      ON CONFLICT DO NOTHING;

      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        user_agent TEXT,
        ip TEXT,
        path TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: any[]) {
  return pgPool.query(text, params);
}

export async function getClient() {
  return pgPool.connect();
}

export { pgPool };
