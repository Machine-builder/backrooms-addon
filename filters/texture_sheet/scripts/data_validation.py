from typing import List, Tuple
from pydantic import BaseModel

class SubTexture(BaseModel):
    bounding_box: Tuple[int, int, int, int]
    save_as: str
    use_layers: List[str]

class Sheet(BaseModel):
    filepath: str
    sub_textures: List[SubTexture]

class DataFile(BaseModel):
    sheets: List[Sheet]