from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class CreateMovie(BaseModel):
    title:str
    director:str
    year:int


@app.get("/")
def root():
    return {
        "message": "HEllo"
    }

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