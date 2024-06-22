var express = require("express");
var path = require("path");
var logger = require("morgan");
var bodyParser = require("body-parser");
var neo4j = require("neo4j-driver");

var app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

var driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", "test")
);

var session = driver.session();

app.get("/", (req, res) => {
  session
    .run("MATCH (n:Movie {title:'İsmail DENEME'}) RETURN n LIMIT 25")
    .then((result) => {
      var movieArr = [];
      result.records.forEach((record) => {
        movieArr.push({
          id: record._fields[0].identity.low,
          title: record._fields[0].properties.title,
          year: record._fields[0].properties.year,
        });
      });
      session
        .run("MATCH (n:Person {name:'ismail'}) RETURN n LIMIT 25")
        .then((result2) => {
          var personArr = [];
          result2.records.forEach((record) => {
            personArr.push({
              id: record._fields[0].identity.low,
              name: record._fields[0].properties.name,
            });
          });
          res.render("index", {
            movies: movieArr,
            people: personArr,
          });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/movie/add", (req, res) => {
  var title = req.body.title;
  var year = req.body.year;

  session
    .run("MERGE(n:Movie {title:$titleParam, year:$yearParam}) RETURN n.title", {
      titleParam: title,
      yearParam: year,
    })
    .then((result) => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });

  console.log(title);
});

app.post("/person/add", (req, res) => {
  var name = req.body.name;

  session
    .run("MERGE(n:Person {name:$nameParam}) RETURN n.name", {
      nameParam: name,
    })
    .then((result) => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });

  console.log(name);
});

app.post("/movie/person/add", (req, res) => {
  var title = req.body.title;
  var name = req.body.name;

  session
    .run(
      "MATCH(a:Person {name:$nameParam}), (b:Movie {title:$titleParam}) MERGE (a)-[r:ACTED_IN]-(b) RETURN a,b",
      {
        nameParam: name,
        titleParam: title,
      }
    )
    .then((result) => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });

  console.log(name);
});

app.listen(3000);
console.log("Server Started on Port 3000");

module.exports = app;
