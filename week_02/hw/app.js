//crete a server using express 
const express = require("express");
const morgan = require("morgan");

const app = express();
const PORT = 3000;
/* //Disable reqLogger for morgan
function reqLogger(req, res, next){
    const start = Date.now();
    res.on("finish", ()=> {
    console.log(req.method, req.originalUrl,res.statusCode, `${Date.now() - start}ms`);
    });
    
    next(); 
} 
app.use(reqLogger);
*/
//JSON parsing middleware +set up morgan
app.use(express.json());
app.use(morgan('dev'));

//app.use(express.json());
    //movie data
let movies = [
  {
    id: 1,
    title: "Tuntematon sotilas",
    director: "Aku Louhimies",
    year: 2017
  },
  {
    id: 2,
    title: "Lapin sota",
    director: "Aku Louhimies",
    year: 2026
  },
  {
    id: 3,
    title: "Guard",
    director: "John Michael McDonagh",
    year: 2011
  },
  {
    id: 4,
    title: "Trainspotting",
    director: "Danny Boyle",
    year: 1996
  }
];


//Function that will define what parameters are missing from a PUSH,PUT or PATCH
function validateMovies(body, partial = false) {
    const errors = [];
    const maxYear = new Date().getFullYear(); 

    if(!partial && body.title === undefined)
        errors.push("Title is needed");
    if (body.title !== undefined &&
        (typeof body.title !== "string" || body.title.trim().length === 0))
        errors.push("title must be filled in");

    if (!partial && body.director === undefined)
        errors.push("director is required");
    if (body.director !== undefined && (typeof body.director !== "string" ||
        body.director.trim().length === 0))
        errors.push("title must be filled in");

    if (!partial && body.year === undefined)
        errors.push("year is needed");
    if (body.year !== undefined && 
        (!Number.isInteger(body.year) || body.year < 1888 || body.year > maxYear))
        errors.push(`year must an intger between 1890 and ${maxYear}`);

    return errors;

    }

    //get request just for movise
app.get("/movies", (req, res) => {
    const { director, minYear, year, sort } = req.query;
    let result = [...movies];
       if (director) {
        if (typeof director !== 'string') {
            return res.status(400).json({ error: 'director must be a single string' });
        }
        result = result.filter(m =>
            m.director.toLowerCase() === director.toLowerCase()
        );
    }
    if (minYear) {
        const min = Number(minYear);
        if (!Number.isInteger(min)) {
            return res.status(400).json({ error: 'minYear must be an integer' });
        }
        result = result.filter(m => m.year >= min);
    }
    if (year) {
        const y = Number(year);
        if (!Number.isInteger(y)) {
            return res.status(400).json({ error: 'year must be an integer' });
        }
        result = result.filter(m => m.year === y);
    }
    if (sort === 'year') {
        result.sort((a, b) => a.year - b.year);              // oldest to newest
        } else if (sort === 'title') {
        result.sort((a, b) => a.title.localeCompare(b.title)); // alphabetical
        } else if (sort) {
        return res.status(400).json({ error: 'Invalid sort. Use "year" or "title"' });
        }

    res.json(result);
});

//Testing server 500 
app.get("/crash", (req, res) => {
    throw new Error("Test crash");
});

    app.get("/movies/:id", (req, res) => {
        const id = Number(req.params.id);
        const movie = movies.find((movie) => movie.id === id);

        if(!movie) {
            return res.status(404).json({
                error: "MOVIE_NOT_FOUND",
                message : "Movie is not found"});
        }
        res.json(movie);
    });

    //have the app listen to port 3000
app.listen(PORT, ()=> {
    console.log("Server listening at port 3000")
});

app.post("/movies", (req,res) => {
    const{title, director, year} = req.body;
   
    errors = validateMovies(req.body, false);
    if(errors.length > 0) {
        return res.status(400).json({
            error : {
                code :"VLADATION ERROR",
                message: "Movies data is invalid",
                details: errors
            }
        })
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

    app.put('/movies/:id', (req,res) => {
        const id = Number(req.params.id); 
        const index = movies.findIndex( m => m.id === id);
        if( index === -1) {
            return res.status(404).json({
                code: 'MOVIE_NOT_FOUND', message: 'Movie not found'
            })
        }
        errors = validateMovies(req.body, false);
        if(errors.length > 0){
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Movie data is invalid",
                    details: errors
                }
            })
        }
    
    movies[index] = { id, ...req.body};
    res.json(movies[index]);
    });



app.patch('/movies/:id', (req, res) => {
    // Find the movie by id from the array
    const id = Number(req.params.id);
    const movie = movies.find(m => m.id === id);
 
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
 
    // Patch might have a partial object body so let's use true here
    errors = validateMovies( req.body, true );
    if( errors.length > 0 ){
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Movie data is invalid",
                details: errors
            }
        })
    }
    // The data is valid so we can patch the fields to be updated
    const { title, director, year } = req.body;
    if (title !== undefined) movie.title = title;
    if (director !== undefined) movie.director = director;
    if (year !== undefined) movie.year = year;
   
 
    res.json(movie); // return the Movie and OK
 });

//DELETE PARAMETER
 app.delete("/movies/:id", (req, res) => {
    const id = Number(req.params.id);
    const index = movies.findIndex(movie => movie.id === id);

    if (index === -1) {
        return res.status(404).json({
            error: { code :"MOVIE_NOT_FOUND", message: "Movie was not found" }
        });
    }
    movies.splice(index, 1);
    res.status(204).send();
 });

//Route error handling
app.use((req,res) => {
    res.status(404).json({
        error: {
            code : "ROUTE_NOT_FOUND",
            message : "The request route was not found"
        }
    });
});

//Server error handling
app.use((err, req, res, next) => {
    console.log(err);

    res.status(500).json({
        error: {
            code: "INTERAL_SERVER_ERROR",
            message: "An unexpected server error occured :("
        }
    });
});