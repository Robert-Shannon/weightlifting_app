import sys
import os
from pathlib import Path

# Get the project root directory
root_dir = Path(__file__).parent.parent

# Add the project root to Python's path
sys.path.insert(0, str(root_dir))