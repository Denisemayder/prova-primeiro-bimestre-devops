const express = require('express');

const {
  criarReserva,
  listarReservas,
  buscarReservaPorId,
  atualizarReserva,
  excluirReserva,
} = require('../controllers/reservasController');

const router = express.Router();

router.post('/', criarReserva);

router.get('/', listarReservas);

router.get('/:id', buscarReservaPorId);

router.put('/:id', atualizarReserva);

router.delete('/:id', excluirReserva);

module.exports = router;