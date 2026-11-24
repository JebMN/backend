require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const pool = require("./db");
//crete a server using express

const app = express();
const PORT = 3000;

//JSON parsing middleware +set up morgan
app.use(express.json());
app.use(morgan('dev'));

const MAX_PG_INT = 214000000;

const MOVIE_COLUMNS = `
    id, 
    title,
    director,
    release_year as YEAR`;

const allowedFields = {
    title: "title",
    director: "director",
    year: "release_year"
};

const allowedSorts = {
    id: "id",
    year: "release_year",
    title: "title"
};


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
function parseId(value) {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1 || id > MAX_PG_INT) {
        return null;
    }
    return id;
}

function badRequest(res, code, message, details) {
    const error = { code, message };
    if (details) error.details = details;
    return res.status(400).json({ error });
}

function movieNotFound(res) {
    return res.status(404).json({
        error: { code: "MOVIE_NOT_FOUND", message: "Movie was not found" }
    });
}

app.get("/health/database", async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT NOW() AS database_time"
        );

        res.json({
            status: "ok",
            databaseTime: result.rows[0].database_time
        });
    } catch (error) {
        next(error);
    }
});

// Testing server 500
app.get("/crash", (req, res) => {
    throw new Error("Test crash");
});
    //All movies wih query parameters still avaliable
app.get("/movies", async (req, res, next) => {
    try {
        const { director, year, minYear, sortBy } = req.query;
        const conditions = [];
        const values = [];

        if (director !== undefined) {
            if (typeof director !== "string" || director.trim() === "") {
                return badRequest(res, "INVALID_QUERY", "director must be a single non-empty string");
            }
            values.push(director);
            conditions.push(`LOWER(director) = LOWER($${values.length})`);
        }

        if (year !== undefined) {
            const y = Number(year);
            if (typeof year !== "string" || year === "" || !Number.isInteger(y)) {
                return badRequest(res, "INVALID_QUERY", "year must be an integer");
            }
            values.push(y);
            conditions.push(`release_year = $${values.length}`);
        }

        if (minYear !== undefined) {
            const min = Number(minYear);
            if (typeof minYear !== "string" || minYear === "" || !Number.isInteger(min)) {
                return badRequest(res, "INVALID_QUERY", "minYear must be an integer");
            }
            values.push(min);
            conditions.push(`release_year >= $${values.length}`);
        }

        // Strict allow-list: the client never supplies SQL text, only a lookup key
        let orderBy = allowedSorts.id;
        if (sortBy !== undefined) {
            if (typeof sortBy !== "string" || !Object.hasOwn(allowedSorts, sortBy)) {
                return badRequest(res, "INVALID_QUERY", 'Invalid sortBy. Use "id", "year" or "title"');
            }
            orderBy = allowedSorts[sortBy];
        }

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const result = await pool.query(
            `SELECT ${MOVIE_COLUMNS}
             FROM movies
             ${where}
             ORDER BY ${orderBy}, id`,
            values
        );

        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});
    //One movie
app.get("/movies/:id", async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        if (id === null) {
            return badRequest(res, "INVALID_ID", "Movie id must be a positive integer");
        }

        const result = await pool.query(
            `SELECT ${MOVIE_COLUMNS}
             FROM movies
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return movieNotFound(res);
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
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

app.post("/movies", async (req, res, next) => {
    try {
        const errors = validateMovies(req.body, false);
        if (errors.length > 0) {
            return badRequest(res, "VALIDATION_ERROR", "Movie data is invalid", errors);
        }

        const { title, director, year } = req.body;

        const result = await pool.query(
            `INSERT INTO movies (title, director, release_year)
             VALUES ($1, $2, $3)
             RETURNING ${MOVIE_COLUMNS}`,
            [title, director, year]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

app.put("/movies/:id", async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        if (id === null) {
            return badRequest(res, "INVALID_ID", "Movie id must be a positive integer");
        }

        const errors = validateMovies(req.body, false);
        if (errors.length > 0) {
            return badRequest(res, "VALIDATION_ERROR", "Movie data is invalid", errors);
        }

        const { title, director, year } = req.body;

        const result = await pool.query(
            `UPDATE movies
             SET
                 title = $1,
                 director = $2,
                 release_year = $3
             WHERE id = $4
             RETURNING ${MOVIE_COLUMNS}`,
            [title, director, year, id]
        );

        if (result.rows.length === 0) {
            return movieNotFound(res);
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});



app.patch("/movies/:id", async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        if (id === null) {
            return badRequest(res, "INVALID_ID", "Movie id must be a positive integer");
        }

        const errors = validateMovies(req.body, true);
        if (errors.length > 0) {
            return badRequest(res, "VALIDATION_ERROR", "Movie data is invalid", errors);
        }

        // Build the SET clauses from the server-defined allow-list only.
        // Client-supplied key names never become part of the SQL text.
        const setClauses = [];
        const values = [];

        for (const [field, column] of Object.entries(allowedFields)) {
            if (req.body[field] !== undefined) {
                values.push(req.body[field]);
                setClauses.push(`${column} = $${values.length}`);
            }
        }

        if (setClauses.length === 0) {
            return badRequest(
                res,
                "EMPTY_PATCH",
                "Provide at least one field to update: title, director or year"
            );
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE movies
             SET ${setClauses.join(", ")}
             WHERE id = $${values.length}
             RETURNING ${MOVIE_COLUMNS}`,
            values
        );

        if (result.rows.length === 0) {
            return movieNotFound(res);
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

//DELETE PARAMETER
app.delete("/movies/:id", async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        if (id === null) {
            return badRequest(res, "INVALID_ID", "Movie id must be a positive integer");
        }

        const result = await pool.query(
            `DELETE FROM movies
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            return movieNotFound(res);
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
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

async function startServer() {
    try {
        const result = await pool.query(
            "SELECT NOW () AS database_time"
        );
        console.log("Connected: ", result.rows[0].database_time)
        app.listen(PORT, () => {
            console.log("Server listening at port 3000")
        });
    }
    catch(error){
        console.error("DB connection failed", error.message);
        process.exit(1);
    }
}

startServer();
