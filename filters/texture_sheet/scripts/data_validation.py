from typing import List, Optional, Tuple
from pydantic import BaseModel

class Mutation(BaseModel):
    use_layers: List[str]
    suffix: str

class SubTexture(BaseModel):
    bounding_box: Tuple[int, int, int, int]
    save_as: str
    use_layers: List[str]
    mutations: Optional[List[Mutation]]

class Sheet(BaseModel):
    filepath: str
    sub_textures: List[SubTexture]

class DataFile(BaseModel):
    sheets: List[Sheet]