# Now we can start development (this is a comment)
 
# Let's import FastAPI and create the server
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
 
app = FastAPI()
 
# Every movie has title, director and year so this is our basic data model here
# Creating a new movie needs all these fields
class MovieCreate(BaseModel):
    title: str
    director: str
    year:int
 
# Patching the movie (updating some fields) has a little bit different pydantic model
# the fields are optional so let's make a model for that "MovieUpdate"
# only patch the fields that are there (non-none)
class MovieUpdate(BaseModel):
    title: str | None = None
    director: str | None = None
    year: int | None = None
 
movies = [
    {
        "id": 1,
        "title": "Inception",
        "director": "Christopher Nolan",
        "year": 2010
    },
    {
        "id": 2,
        "title": "The Matrix",
        "director": "The Wachowskis",
        "year": 1999
    },
    {
        "id": 3,
        "title": "Parasite",
        "director": "Bong Joon-ho",
        "year": 2019
    }
]
 
 
def find_movie(movie_id: int):
 
    for movie in movies:
        if movie["id"] == movie_id:
            return movie
 
    raise HTTPException(
        status_code=404,
        detail="Movie not found"
    )
 
 
# Create some rest endpoints. Root is the first with "Hello FastAPI"!
@app.get("/")
def hello():
    return { "message " : "Hello from Fast API Server. Updated!"}
 
@app.get("/movies")
def get_movies():
    return movies
 
 
@app.get("/movies/{movie_id}")
def get_movie(movie_id : int):
    for movie in movies:
        if movie["id"] == movie_id:
            return movie
    # in case of error codes e.g. 404 we use HTTP exceptions
    raise HTTPException (
        status_code = 404,
        detail="Movie not found"
    )
 
# next steps: Pydantic. Let's implement POST and data validation so we see the need for Pydantic
 
@app.post("/movies", status_code=201) # Status code OK 200 is the default
def create_movie( movie: MovieCreate ):   # The REST parameters (payload) must match the data model
    #create a new movie based on the data
    new_id = max(
        movie["id"]
        for movie in movies
    ) + 1
 
    new_movie = {
        "id": new_id,
        **movie.model_dump()  # this ** is quite much like the spread operator in javascript
    }
 
    movies.append(new_movie)
 
    return new_movie
 
@app.put("/movies/{movie_id}")
def replace_movie(
    movie_id: int,
    replacement: MovieCreate
):
 
    #helper function to find a movie from our local in-memory data
    # this is used in many rest api functions
    find_movie(movie_id) # raises 404 immediately if the movie with that id does not exist
 
    new_movie = {
        "id": movie_id,
        **replacement.model_dump()   # the same "spread operator"
    }
 
    for index, movie in enumerate(movies):
 
        if movie["id"] == movie_id:
            movies[index] = new_movie
            return new_movie  # return new movie to the client
 
 
@app.patch("/movies/{movie_id}")
def update_movie(
    movie_id: int,
    updates: MovieUpdate
):
 
    movie = find_movie(movie_id)
 
    # excluding means if some field is "undefined" we don't update that
    update_data = updates.model_dump(
        exclude_unset=True
    )
 
    movie.update(update_data)
 
    return movie
 
 
@app.delete(
    "/movies/{movie_id}",
    status_code=204
)
def delete_movie(movie_id: int):
 
    find_movie(movie_id)
 
    for index, movie in enumerate(movies):
 
        if movie["id"] == movie_id:
            movies.pop(index)
            return Response(status_code=204) # response is the way to customize status codes