// create a server by using express 

const express = require("express");

const app = express();
const PORT = 3001;

app.use(express.json());
let movies = [
    {
        id:1,
        title: "Trainspotting",
        director: "IDK",
        year: "Summin"
    }
];

// The first REST end point just sending a message back to the client 
app.get("/", (req, res) => {
    res.send("Hello fromn the back end 1")
});

app.get("/movies", (req, res) => {
    res.json(movies);
});

app.get("/movies/:id", (req, res) => {
    const id = Number(req.params.id);
    const movie = movies.find((movie) => movie.id === id);
    
    if(!movie) {
        return res.status(404).json({error: "That movie is not in our server"});
    }
    res.json(movie);
});

app.post("/movies", (req,res) => {
    const{title, director, year} = req.body;
   
    if(!title || !director || !year) {
        return res.status(400).json({
            error : "title, director and year are required"
        });
    }
    const newMovie = {
        id: movies.length + 1, 
        title,
        director,
        year
    };
    movies.push(newMovie) ; 
    res.status(201).json(newMovie);
});

app.listen(PORT,  ()=> {
 console.log("Server listening at port 3001")   
});