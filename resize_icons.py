from PIL import Image
import os

source = r"c:\Users\jojin\Downloads\ai-limit-tracker\ai-limit-tracker\icons\logo.png"
out_dir = r"c:\Users\jojin\Downloads\ai-limit-tracker\ai-limit-tracker\icons"

sizes = [16, 48, 128]

img = Image.open(source)
for size in sizes:
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(os.path.join(out_dir, f"icon{size}.png"))
    print(f"Generated icon{size}.png")
