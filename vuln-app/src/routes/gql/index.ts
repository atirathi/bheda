import { Router, Request, Response } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { query as pgQuery } from '../../services/db';
import { getMongoDb } from '../../services/db';

const schema = buildSchema(`
  type User {
    id: ID
    username: String
    password: String
    email: String
    role: String
  }
  type Product {
    id: ID
    name: String
    description: String
    price: Float
    category: String
    stock: Int
  }
  type Query {
    user(id: String!): User
    users: [User]
    products: [Product]
    product(id: ID!): Product
    search(q: String): [Product]
  }
  type Mutation {
    login(username: String!, password: String!): AuthResult
    createProduct(name: String!, price: Float!): Product
  }
  type AuthResult {
    success: Boolean
    token: String
    user: User
  }
`);

const root = {
  user: async (args: { id: string }) => {
    const result = await pgQuery(`SELECT * FROM users WHERE id = '${args.id}'`);
    return result.rows[0] || null;
  },
  users: async () => {
    const result = await pgQuery('SELECT * FROM users');
    return result.rows;
  },
  products: async () => {
    const result = await pgQuery('SELECT * FROM products');
    return result.rows;
  },
  product: async (args: { id: string }) => {
    const result = await pgQuery(`SELECT * FROM products WHERE id = ${args.id}`);
    return result.rows[0] || null;
  },
  search: async (args: { q: string }) => {
    const result = await pgQuery(`SELECT * FROM products WHERE name ILIKE '%${args.q || ''}%'`);
    return result.rows;
  },
  login: async (args: { username: string; password: string }) => {
    const db = await getMongoDb();
    const user = await db.collection('users').findOne({ username: args.username, password: args.password });
    if (user) return { success: true, token: 'gql_token_demo', user };
    return { success: false, token: null, user: null };
  },
  createProduct: async (args: { name: string; price: number }) => {
    const result = await pgQuery(`INSERT INTO products (name, price) VALUES ('${args.name}', ${args.price}) RETURNING *`);
    return result.rows[0];
  },
};

const router = Router();

router.use('/', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true,
}));

export default router;
