const { pool } = require('../db');
const {
  isClienteValido,
  isDataValida,
  isStatusValido,
  isIdValido,
} = require('../validators/reserva');

function formatReserva(row) {
  if (!row) {
    return row;
  }

  return {
    ...row,
    data:
      row.data instanceof Date
        ? row.data.toISOString().split('T')[0]
        : String(row.data).split('T')[0],
  };
}

function isDbError(err) {
  return (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ENOTFOUND' ||
    err.code === '57P01' ||
    err.code === '57P03' ||
    String(err.message).toLowerCase().includes('timeout')
  );
}

async function withDbErrorHandling(res, fn) {
  try {
    return await fn();
  } catch (err) {
    console.error('Erro no banco de dados:', err.message);

    if (isDbError(err)) {
      return res.status(503).json({
        erro: 'Banco de dados indisponível',
      });
    }

    return res.status(500).json({
      erro: 'Erro interno do servidor',
    });
  }
}

async function criarReserva(req, res) {
  const { cliente, data, status } = req.body;

  if (
    !isClienteValido(cliente) ||
    !isDataValida(data) ||
    !isStatusValido(status)
  ) {
    return res.status(400).json({
      erro: 'Dados da reserva inválidos',
    });
  }

  return withDbErrorHandling(res, async () => {
    const result = await pool.query(
      `INSERT INTO reservas (cliente, data, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [cliente.trim(), data, status]
    );

    return res.status(201).json(formatReserva(result.rows[0]));
  });
}

async function listarReservas(req, res) {
  return withDbErrorHandling(res, async () => {
    const result = await pool.query(
      'SELECT * FROM reservas ORDER BY id'
    );

    return res.status(200).json(result.rows.map(formatReserva));
  });
}

async function buscarReservaPorId(req, res) {
  const { id } = req.params;

  if (!isIdValido(id)) {
    return res.status(400).json({
      erro: 'ID inválido',
    });
  }

  return withDbErrorHandling(res, async () => {
    const result = await pool.query(
      'SELECT * FROM reservas WHERE id = $1',
      [Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: 'Reserva não encontrada',
      });
    }

    return res.status(200).json(formatReserva(result.rows[0]));
  });
}

async function atualizarReserva(req, res) {
  const { id } = req.params;
  const { cliente, data, status } = req.body;

  if (!isIdValido(id)) {
    return res.status(400).json({
      erro: 'ID inválido',
    });
  }

  if (
    cliente === undefined &&
    data === undefined &&
    status === undefined
  ) {
    return res.status(400).json({
      erro: 'Nenhum campo informado para atualização',
    });
  }

  if (
    (cliente !== undefined && !isClienteValido(cliente)) ||
    (data !== undefined && !isDataValida(data)) ||
    (status !== undefined && !isStatusValido(status))
  ) {
    return res.status(400).json({
      erro: 'Dados da reserva inválidos',
    });
  }

  const campos = [];
  const valores = [];

  if (cliente !== undefined) {
    valores.push(cliente.trim());
    campos.push(`cliente = $${valores.length}`);
  }

  if (data !== undefined) {
    valores.push(data);
    campos.push(`data = $${valores.length}`);
  }

  if (status !== undefined) {
    valores.push(status);
    campos.push(`status = $${valores.length}`);
  }

  valores.push(Number(id));

  return withDbErrorHandling(res, async () => {
    const result = await pool.query(
      `UPDATE reservas
       SET ${campos.join(', ')}
       WHERE id = $${valores.length}
       RETURNING *`,
      valores
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: 'Reserva não encontrada',
      });
    }

    return res.status(200).json(formatReserva(result.rows[0]));
  });
}

async function excluirReserva(req, res) {
  const { id } = req.params;

  if (!isIdValido(id)) {
    return res.status(400).json({
      erro: 'ID inválido',
    });
  }

  return withDbErrorHandling(res, async () => {
    const result = await pool.query(
      'DELETE FROM reservas WHERE id = $1 RETURNING id',
      [Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: 'Reserva não encontrada',
      });
    }

    return res.status(200).json({
      mensagem: 'Reserva excluída com sucesso',
    });
  });
}

module.exports = {
  criarReserva,
  listarReservas,
  buscarReservaPorId,
  atualizarReserva,
  excluirReserva,
};