import json
import os
from pathlib import Path
import sys
from typing import Dict, List
from PIL import Image

import commentjson
import pypdn

from scripts import data_validation


dir_project = Path(os.environ['ROOT_DIR']).resolve()
dir_filter_data = dir_project / 'packs/data/texture_sheet'
dir_bp = Path('BP').absolute()
dir_rp = Path('RP').absolute()


def process(data: data_validation.DataFile):
    for sheet in data.sheets:
        image_filepath = dir_project / sheet.filepath
        image_pdn = pypdn.read(image_filepath)
        
        layers_by_name = {layer.name: layer for layer in image_pdn.layers}

        # Group sub_textures by the use_layers attributes
        groups: Dict[str, List[data_validation.SubTexture]] = {}
        for sub_texture in sheet.sub_textures:
            layers_id = ','.join(sorted(sub_texture.use_layers))
            group = groups.setdefault(layers_id, [])
            group.append(sub_texture)

        for group in groups.values():
            use_layers = group[0].use_layers

            # Reset visibility of all layers
            for layer in image_pdn.layers:
                layer.visible = False
            
            # Show only selected layers
            for layer_name in use_layers:
                layer = layers_by_name[layer_name]
                layer.visible = True
            
            # Generate a flattened image
            flat_pdn = image_pdn.flatten(asByte=True)
            img = Image.fromarray(flat_pdn)  # type: ignore

            for sub_texture in group:
                bounding_box = sub_texture.bounding_box
                save_as = sub_texture.save_as

                left, upper, w, h = bounding_box
                right = left + w
                lower = upper + h
                image_cropped = img.crop((left, upper, right, lower),)
                
                save_as_absolute = dir_project / save_as
                image_cropped.save(save_as_absolute)

                print(f'Cropped and saved "{save_as}"')

def main():
    """
    Filter entry point.
    """

    try:
        settings = json.loads(sys.argv[1])
    except IndexError:
        print('Warning: No settings provided. Using default settings.')
        settings = {}
    
    data_filepath = dir_filter_data / 'data.json'
    data_json = commentjson.loads(data_filepath.read_bytes())
    data = data_validation.DataFile.model_validate(data_json)

    process(data)

if __name__ == "__main__":
    main()