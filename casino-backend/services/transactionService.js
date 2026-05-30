const DEFAULT_LIMIT = 50;

async function getDepositsByUserId(db, userId, options = {}) {
    const limit = Number.isInteger(options.limit) ? Math.max(1, Math.min(500, options.limit)) : DEFAULT_LIMIT;
    const offset = Number.isInteger(options.offset) ? Math.max(0, options.offset) : 0;

    const client = db.pool; 
    try {
        const totalRes = await client.query('SELECT COUNT(*) FROM deposits WHERE user_id = $1', [userId]);
        const total = Number(totalRes.rows[0].count || 0);

        const res = await client.query(
            `SELECT id, package_name, amount_points, cost_pln, created_at
             FROM deposits
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        return { rows: res.rows, total };
    } catch (err) {
        throw err;
    }
}

module.exports = {
    getDepositsByUserId
};
