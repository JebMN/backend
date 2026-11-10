    //crete a server using express 
const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());
    //movie data
let movies = [
  {
    id: 1,
    title: "Inception",
    director: "Christopher Nolan",
    year: 2010
  },
  {
    id: 2,
    title: "The Matrix",
    director: "The Wachowskis",
    year: 1999
  },
  {
    id: 3,
    title: "Parasite",
    director: "Bong Joon-ho",
    year: 2019
  }
];

function validateMovie(body, partial = false) {
    const errors = [];
    const maxYear = new Date().getFullYear(); 
}
    //get request just for movise
app.get("/movies", (req, res) => {
    res.json(movies);
});

    app.get("/movies/:id", (req, res) => {
        const id = Number(req.params.id);
        const movie = movies.find((movie) => movie.id === id);

        if(!movie) {
            return res.status(404).json({error: "Movie not found"});
        }
        res.json(movie);
    });

    //have the app listen to port 3000
app.listen(PORT, ()=> {
    console.log("Server listening at port 3000")
});

app.post("/movies", (req,res) => {
    const{title, director, year} = req.body;
   
    
    if(!title || !director || !year) {
        return res.status(400).json({
            error : "title, director and year are required"
        });
    }
    
    //Inline validation 
    //Rules: title must be string
    if ( typeof title !== "string" || title.trim() === "" ) {
        res.status(400).json({
            error : { code: "VALIDATION_ERROR", message: "title must be a non empty string"}
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
