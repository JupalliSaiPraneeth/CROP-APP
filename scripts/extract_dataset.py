import zipfile
import sys
from pathlib import Path

zip_path = Path("datasets/PlantVillage/data.zip")
extract_path = Path("datasets/PlantVillage/extracted")

if not zip_path.exists():
    print(f"Error: {zip_path} does not exist.")
    sys.exit(1)

print(f"Extracting {zip_path} to {extract_path}...")
extract_path.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_path)

print("Extraction completed successfully!")
