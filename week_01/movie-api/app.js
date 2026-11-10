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
    const newMovie = {
        id: movies.length + 1, 
        title,
        director,
        year
    };
    movies.push(newMovie) ; 
    res.status(201).json(newMovie);
});

    app.put('movies/:id', (req,res) => {
        const id = Number(req.params.id); 
        const index = movies.findIndex( m => m.id === id);
        if(index === -1) {
            return res.status(404).json({
                code: 'MOVIE_NOT_FOUND', message: 'Movie not found'
            });
        }
    });

    movies[index] = { id, ...req.body};
    res.json(movies[index]);

    app.patch('/movies/:id', (req,res) => {
        const id = Number(req.params.id); 
        const index = movies.find( m => m.id === id);
        
        if (!movie) {
            return res.status(404).json({error: 'Movie not found'});
        }

        const {title, director, year} = req.body;
        if(title !== undefined) movie.title = title;
        if(director !== undefined) movie.director = director;
        if(year !== undefined) movie.year = year;
    });