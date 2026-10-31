/**
 * Transaction-safe sequential document numbering generator for Subscriptions and Invoices.
 * Uses atomic sequence counters in PostgreSQL.
 */

/**
 * Generates the next sequential number for a given document type.
 * e.g., getNextSequenceNumber(prisma, 'SUBSCRIPTION', 'SUB', 6) -> 'SUB-000001'
 * 
 * @param {import('@prisma/client').PrismaClient | import('@prisma/client').Prisma.TransactionClient} client
 * @param {'SUBSCRIPTION' | 'INVOICE'} sequenceName
 * @param {string} prefix
 * @param {number} padLength
 * @returns {Promise<string>}
 */
export async function getNextSequenceNumber(client, sequenceName, prefix, padLength = 6) {
  // Use atomic raw SQL or upsert with lock inside transaction
  // Raw upsert in PostgreSQL with row-level lock ensures sequential concurrency safety
  const result = await client.$queryRaw`
    INSERT INTO "DocumentSequence" ("name", "nextValue", "updatedAt")
    VALUES (${sequenceName}, 2, NOW())
    ON CONFLICT ("name")
    DO UPDATE SET 
      "nextValue" = "DocumentSequence"."nextValue" + 1,
      "updatedAt" = NOW()
    RETURNING "nextValue" - 1 AS "currentValue"
  `;

  let currentVal = 1;
  if (result && result.length > 0) {
    const rawVal = result[0].currentValue;
    currentVal = typeof rawVal === 'bigint' ? Number(rawVal) : parseInt(rawVal, 10);
  }

  const paddedNumber = String(currentVal).padStart(padLength, '0');
  return `${prefix}-${paddedNumber}`;
}

export async function generateSubscriptionNumber(client) {
  return getNextSequenceNumber(client, 'SUBSCRIPTION', 'SUB', 6);
}

export async function generateInvoiceNumber(client) {
  return getNextSequenceNumber(client, 'INVOICE', 'INV', 6);
}
