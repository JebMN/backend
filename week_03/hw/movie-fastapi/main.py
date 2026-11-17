from fastapi import FastAPI, HTTPException,Response
from pydantic import BaseModel

app = FastAPI()

class CreateMov(BaseModel):
    title:str
    director:str
    year:int

class MovUpdate(BaseModel):
    title: str | None = None
    director: str | None = None
    year: int | None = None

movies = [
    
    {
        "id": 1,
        "title": "Forest Gump",
        "director": "Rober Zemeckis", 
        "year" : 1994 
    },
    {
        "id": 2,
        "title": "White Sun of the Desert",
        "director": "Vladimir Motyl", 
        "year" : 1970 
    },
    {
        "id": 3,
        "title": "Taxi Driver",
        "director": "Martin Scorsese", 
        "year" : 1976
    },
    {
        "id": 4,
        "title": "Fight Club",
        "director" : "David Fincher", 
        "year" : 1999
    }
]
def find_mov(movie_id: int):
    for movie in movies:
        if movie["id"] == movie_id:
            return movie
        raise HTTPException(
            status_code=404,
            detail="Movie was not found"
        )


#Get actions
@app.get("/")
def root():
    return {
        "message": "HEllo"
    }

@app.get("/movies")
def get_mov(
    min_year: int | None = None
    ):
    result = movies
    if min_year is not None:
        result = [
            movie 
            for movie in result
            if movie["year"] >= min_year
        ]
    return result

@app.get("/movies/{movie_id}")
def get_mov(movie_id:int):
    for movie in movies:
        if movie in movies:
            if movie["id"] == movie_id:
                return movie
    raise HTTPException (
        status_code=404,
        detail="Movie was not found"
    )

#Post action
@app.post("/movies",status_code=201)
def create_mov(movie:CreateMov):
    new_id= max(
        movie["id"]
        for movie in movies
    )+1

    new_mov = {
        "id":new_id,
        **movie.model_dump()
    }
    movies.append(new_mov)
    return new_mov

@app.put("/movies/{movie_id}")
def replace_mov(
    movie_id:int,
    replacement: CreateMov

):

    find_mov(movie_id)

    new_movie = {
        "id": movie_id,
        **replacement.model_dump()
    }
    for index, movie in enumerate(movies):
        if movie["id"] == movie_id:
            movies[index] = new_movie
            return new_movie

@app.patch("/movies/{movie_id}")
def patch_mov(
    movie_id:int,
    updates:MovUpdate
):
    movie = find_mov(movie_id)
    update_data = updates.model_dump(
        exclude_unset=True

    )
    movie.update(update_data)
    return movie

@app.delete("/movies/{movie_id}")
def delete_mov(movie_id:int):
    find_mov(movie_id)
    for index, movie in enumerate(movies):
        if movie["id"] == movie_id:
            movies.pop(index)
            return Response(status_code=204)
    raise HTTPException (
        status_code= 404,
        detail="Movie was not found"
    )