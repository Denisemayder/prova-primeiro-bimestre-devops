const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function checkDbConnection(timeoutMs = 10000) {
  let timeout;

  try {
    const timeoutPromise = new Promise((_, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('Timeout na conexão com o banco de dados'));
      }, timeoutMs);
    });

    await Promise.race([
      pool.query('SELECT 1'),
      timeoutPromise,
    ]);

    return true;
  } finally {
    clearTimeout(timeout);
  }
}

async function criarTabelaReservas() {
  const query = `
    CREATE TABLE IF NOT EXISTS reservas (
      id SERIAL PRIMARY KEY,
      cliente VARCHAR(255) NOT NULL,
      data DATE NOT NULL,
      status VARCHAR(50) NOT NULL
        CHECK (status IN ('pendente', 'confirmada', 'cancelada'))
    );
  `;

  await pool.query(query);
}

module.exports = {
  pool,
  checkDbConnection,
  criarTabelaReservas,
};