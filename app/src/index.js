require('dotenv').config();

const express = require('express');
const { checkDbConnection, criarTabelaReservas } = require('./db');
const { validateEnvVars } = require('./validators/reserva');
const reservasRoutes = require('./routes/reservas');

validateEnvVars([
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
]);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/reservas', reservasRoutes);

app.get('/health', async (req, res) => {
  try {
    await checkDbConnection();

    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(503).json({
      status: 'error',
      mensagem: 'Banco de dados indisponível',
    });
  }
});

async function start() {
  try {
    await checkDbConnection(10000);
    await criarTabelaReservas();

    app.listen(PORT, () => {
      console.log(`API TechNova rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error(
      'Não foi possível iniciar a API:',
      err.message
    );

    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;