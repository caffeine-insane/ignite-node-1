const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

let users = [];


function findTodoById(todos, id) {
  return todos.find((todo) => todo.id == id)
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers
  const user = users.find((user) => user.username == username)
  if (!user) {
    return response.status(404).json({
      error: "User not found"
    })
  }
  request.user = user
  return next()
}

app.post('/users', async (request, response) => {
  const { name, username } = await request.body
  const userExists = users.find((user) => user.username == username)

  if (userExists) {
    return response.status(400).json({
      error: "User already exists"
    })
  }

  const user = {
    name,
    username,
    id: uuidv4(),
    todos: []
  }

  users.push(user)

  return response.status(201).json(user)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request
  return response.json(user.todos)
});

app.post('/todos', checksExistsUserAccount, async (request, response) => {
  const { title, deadline } = await request.body
  const { user } = request

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }
  user.todos.push(todo)

  return response.status(201).json(todo)

});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { user } = request
  const { title, deadline } = request.body

  const todo = findTodoById(user.todos, id)
  if (!todo) {
    return response.status(404).json({
      error: "Todo not found"
    })
  }
  todo.deadline = new Date(deadline)
  todo.title = title

  return response.status(201).json(todo)
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { user } = request

  const todo = findTodoById(user.todos, id)
  if (!todo) {
    return response.status(404).json({
      error: "Todo not found"
    })
  }
  todo.done = true

  return response.status(201).json(todo)
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { user } = request

  const todoFinded = user.todos.find((todo) => todo.id === id)

  if (!todoFinded) {
    return response.status(404).json({
      error: "Todo not found"
    })
  }

  users = users.map((userM) => {
    if (userM.id === user.id) {
      userM.todos = user.todos.filter((todo) => todo.id !== todoFinded.id)
    }
    return userM
  })

  return response.status(204).json(user)
});

module.exports = app;