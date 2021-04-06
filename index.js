let express = require("express");
require("dotenv").config();
let app = express();
const path = require("path");
const PORT = process.env.PORT || 8080;

let bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

const storage = require("azure-storage");
const storageClient = storage.createTableService(process.env.CONNECTIONSTRING);
storageClient.createTableIfNotExists("tasks", function (error, createResult) {
  if (error) {
    return console.log("Error creating table", error);
  }
  if (createResult.isSuccessful) {
    console.log("Create Table operation executed successfully for:", "tasks");
  }
});

app.post("/addtask", function (req, res) {
  let newTask = req.body.newtask;
  let entGen = storage.TableUtilities.entityGenerator;
  let entity = {
    PartitionKey: entGen.String(Math.random().toString()),
    RowKey: entGen.String("row1"),
    task: entGen.String(newTask),
    dateValue: entGen.DateTime(new Date(Date.UTC(2011, 10, 25))),
  };
  storageClient.insertOrMergeEntity("tasks", entity, function (error, result, response) {
    if (error) {
      return console.log("Error", error);
    }
    console.log("insertOrMergeEntity succeeded.");
  });
  res.redirect("/");
});

app.get("/", function (req, res) {
  let data = new storage.TableQuery();
  storageClient.queryEntities("tasks", data, null, {}, (error, result, response) => {
    values = [];
    response.body.value.map((v) => values.push(v));
    if (!error) {
      res.render("index", { task: values });
    }
  });
});

app.post("/removetask", function (req, res) {
  let completeTask = req.body.check;
  if (typeof completeTask === "string") {
    let deletableRow = {
      PartitionKey: { _: completeTask },
      RowKey: { _: "row1" },
    };
    console.log("Deletablerow", deletableRow);
    storageClient.deleteEntity("tasks", deletableRow, function (error, res1) {
      if (!error) {
        res.redirect("/");
      }
    });
  } else {
    res.redirect("/");
  }
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));
  app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
