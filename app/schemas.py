from pydantic import BaseModel

'''
VALIDATION
'''

#Pydantic
class TodoBase(BaseModel):
    title : str
    description : str | None = None
    completed : bool = False

class TodoCreate(TodoBase):
    pass

class TodoResponse(TodoBase):
    id : int

    class config:
        form_attributes = True