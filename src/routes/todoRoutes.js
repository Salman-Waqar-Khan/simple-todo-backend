const express = require('express');
const {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  deleteTodo
} = require('../controllers/todoController');

const router = express.Router();

router.route('/').post(createTodo).get(getTodos);
router.route('/:id').get(getTodoById).put(updateTodo).delete(deleteTodo);

module.exports = router;
