const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 8000;
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()


// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gf8ipgr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();



    const userCollection = client.db("TaskFlow").collection("users");
    const todoListCollection = client.db("TaskFlow").collection("todoLists");



    // user api

    app.get('/users' , async (req, res) => {
        // console.log(req.headers.authorization)
        const users = await userCollection.find().toArray(); 
        res.send(users);
    })
    
    app.get('/users/:email',   async (req, res) => {
        const users = await userCollection.find({email: req.params.email}).toArray();
        res.send(users);
    })

    app.post('/users', async (req, res) => {
      const newUser = req.body;
      const existingUser = await userCollection.findOne({ email: newUser.email });
  
      if (existingUser) {
          // User already exists, return a response or handle accordingly
          res.json({ acknowledged: true, message: 'User already exists' });
      } else {
          // User doesn't exist, create a new user
          const result = await userCollection.insertOne(newUser);
          console.log('New user created:', req.body);
          res.json(result);
      }
  });



  // Handle todo api
  
  // Get all todo lists
app.get('/todo-lists', async (req, res) => {
  const todoLists = await todoListCollection.find().toArray();
  res.json(todoLists);
});

// Get a specific todo list by user email
app.get('/todo-lists/:email', async (req, res) => {
  const todoList = await todoListCollection.findOne({ userEmail: req.params.email });
  res.json(todoList);
});
 
// Save or update a todo list
app.post('/todo-lists/tasks', async (req, res) => {
  const { userEmail, tasks } = req.body;
  const existingTodoList = await todoListCollection.findOne({ userEmail });
 
  if (existingTodoList) {
    // Update existing todo list by pushing the new task to the "todo" array
    await todoListCollection.updateOne(
      { userEmail },
      { $push: { 'tasks.todo': { id: Date.now(), content: tasks } } }
    );
    res.json({ acknowledged: true, message: 'Task added to todo successfully' });
  } else {
    // Create a new todo list with empty arrays for "todo", "ongoing", and "completed"
    await todoListCollection.insertOne({
      userEmail,
      tasks: { todo: [{ id: Date.now(), content: tasks.todo[0] }], ongoing: [null], completed: [null] },
    });
 
    res.json({ acknowledged: true, message: 'Todo list created successfully with the task added to todo' });
  }
});


// Handle swapping tasks between columns
app.post('/todo-lists/swap-tasks', async (req, res) => {
  try {
    const { userEmail, sourceColumn, targetColumn, taskId, content } = req.body;
    console.log('Request Body:', req.body);
    
    // Fetch the todo list for the user
    const todoList = await todoListCollection.findOne({ userEmail });

    // Find the task in the source column
    const movedTaskIndex = todoList.tasks[sourceColumn].findIndex((task) => task.id === taskId);

    if (movedTaskIndex !== -1) {
      // If the task is found in the source column
      const movedTask = todoList.tasks[sourceColumn][movedTaskIndex];

      // Remove the task from the source column
      todoList.tasks[sourceColumn].splice(movedTaskIndex, 1);

      // Check if the target column exists; if not, create it
      if (!todoList.tasks[targetColumn]) {
        todoList.tasks[targetColumn] = [];
      }

      // Add the task to the target column
      todoList.tasks[targetColumn].push(movedTask);

      console.log('Updated Todo List:', todoList);
      // Update the todo list in the database
      await todoListCollection.updateOne(
        { userEmail },
        { $set: { tasks: todoList.tasks } }
      );

      console.log('Updated Todo List:', todoList);
      
      res.json({ acknowledged: true, message: 'Task moved successfully' });
    } else {
      // If the task is not found in the source column
      res.status(404).json({ acknowledged: false, message: 'Task not found in source column' });
    }
  } catch (error) {
    console.error('Error swapping tasks:', error);
    res.status(500).json({ acknowledged: false, message: 'Internal Server Error' });
  }
});

 

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) =>{
    res.send("TaskFlow server is running");
})

app.listen( port, () =>{
    console.log(`TaskFlow Server Port : ${port}`);
})
