const STATUS_VALIDOS = ['pendente', 'confirmada', 'cancelada'];

function isClienteValido(cliente) {
  return (
    typeof cliente === 'string' &&
    cliente.trim().length > 0 &&
    cliente.length <= 255
  );
}

function isDataValida(data) {
  if (typeof data !== 'string') {
    return false;
  }

  const formato = /^\d{4}-\d{2}-\d{2}$/;

  if (!formato.test(data)) {
    return false;
  }

  const [ano, mes, dia] = data.split('-').map(Number);
  const dataObj = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    dataObj.getUTCFullYear() === ano &&
    dataObj.getUTCMonth() === mes - 1 &&
    dataObj.getUTCDate() === dia
  );
}

function isStatusValido(status) {
  return STATUS_VALIDOS.includes(status);
}

function isIdValido(id) {
  const numero = Number(id);

  return Number.isInteger(numero) && numero > 0;
}

function validateEnvVars(keys) {
  const ausentes = keys.filter((key) => !process.env[key]);

  if (ausentes.length > 0) {
    console.error(
      `Variáveis de ambiente obrigatórias ausentes: ${ausentes.join(', ')}`
    );
    process.exit(1);
  }
}

module.exports = {
  STATUS_VALIDOS,
  isClienteValido,
  isDataValida,
  isStatusValido,
  isIdValido,
  validateEnvVars,
};