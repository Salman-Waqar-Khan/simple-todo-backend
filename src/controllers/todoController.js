const mongoose = require('mongoose');
const Todo = require('../models/Todo');

const allowedFields = ['title', 'description', 'completed'];

const getAllowedFields = (body) => {
  const source = body && typeof body === 'object' && !Array.isArray(body) ? body : {};

  return allowedFields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      result[field] = source[field];
    }

    return result;
  }, {});
};

const ensureValidId = (id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    const error = new Error('Invalid todo id.');
    error.statusCode = 400;
    throw error;
  }
};

const createTodo = async (req, res, next) => {
  try {
    const todo = await Todo.create(getAllowedFields(req.body));

    res.status(201).json({
      success: true,
      data: todo
    });
  } catch (error) {
    next(error);
  }
};

const getTodos = async (_req, res, next) => {
  try {
    const todos = await Todo.find();

    res.status(200).json({
      success: true,
      count: todos.length,
      data: todos
    });
  } catch (error) {
    next(error);
  }
};

const getTodoById = async (req, res, next) => {
  try {
    ensureValidId(req.params.id);

    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      const error = new Error('Todo not found.');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: todo
    });
  } catch (error) {
    next(error);
  }
};

const updateTodo = async (req, res, next) => {
  try {
    ensureValidId(req.params.id);

    const updates = getAllowedFields(req.body);

    if (Object.keys(updates).length === 0) {
      const error = new Error(
        'Provide at least one of title, description, or completed to update.'
      );
      error.statusCode = 400;
      throw error;
    }

    const todo = await Todo.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!todo) {
      const error = new Error('Todo not found.');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: todo
    });
  } catch (error) {
    next(error);
  }
};

const deleteTodo = async (req, res, next) => {
  try {
    ensureValidId(req.params.id);

    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) {
      const error = new Error('Todo not found.');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Todo deleted successfully.',
      data: todo
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  deleteTodo
};
