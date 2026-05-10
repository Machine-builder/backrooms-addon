import json
import os
from pathlib import Path
import sys

import commentjson


dir_project = Path(os.environ['ROOT_DIR']).resolve()
dir_filter_data = dir_project / 'packs/data/texture_sheet'
dir_bp = Path('BP').absolute()
dir_rp = Path('RP').absolute()


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

    raise NotImplementedError('The "Auto PBR" filter has not been implemented yet!')

if __name__ == "__main__":
    main()