from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from PIL import Image

DATASET_DIR = Path("datasets/PlantVillage/extracted")

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".webp",
}

if not DATASET_DIR.exists():
    raise FileNotFoundError(
        f"Dataset folder not found: {DATASET_DIR.resolve()}"
    )

image_files = [
    path
    for path in DATASET_DIR.rglob("*")
    if path.is_file()
    and path.suffix.lower() in IMAGE_EXTENSIONS
]

print("=" * 60)
print("PLANTVILLAGE DATASET INSPECTION")
print("=" * 60)

print(f"Dataset directory: {DATASET_DIR.resolve()}")
print(f"Total image files: {len(image_files)}")

if not image_files:
    print("\nNo images found.")
    print("Inspect the extracted folder structure.")
    raise SystemExit(1)

valid_images = 0
invalid_images = 0
classes = {}

def verify_image(path):
    try:
        with Image.open(path) as image:
            image.verify()
        return (path, True, None)
    except Exception as error:
        return (path, False, str(error))

with ThreadPoolExecutor(max_workers=16) as executor:
    futures = [executor.submit(verify_image, p) for p in image_files]
    for future in as_completed(futures):
        path, is_valid, err = future.result()
        if is_valid:
            valid_images += 1
            class_name = path.parent.name
            classes[class_name] = classes.get(class_name, 0) + 1
        else:
            invalid_images += 1
            print(f"Invalid image: {path} | {err}")

print(f"\nValid images: {valid_images}")
print(f"Invalid images: {invalid_images}")

print("\nImage counts by parent folder:")

for class_name, count in sorted(classes.items()):
    print(f"{class_name}: {count}")

print("\nSample image paths:")

for path in image_files[:10]:
    print(path)

print("\nInspection complete.")
