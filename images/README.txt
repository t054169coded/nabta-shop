Product photographs (optional)
==============================

The site works without any files in here — every plant is drawn as SVG so it
can actually grow on hover.

If you want to show your own photographs as well, drop them in this folder
using exactly these names:

  bird-of-paradise.jpg
  fiddle-leaf-fig.jpg
  monstera-deliciosa.jpg
  golden-pothos.jpg
  pink-rubber-plant.jpg
  olive-tree.jpg

Then open data/products.json and change that plant's "hasPhoto" from false to
true, and run:  python3 tools/mirror.py

A "Real photo" button will appear under the plant, switching between your
photograph and the growth view.

To make six different photos look like one shoot, keep these consistent:
  - portrait crop, roughly 440 x 640 (same as the illustrations)
  - the plant centred, pot fully visible, standing on the floor
  - one plain pale wall behind it, no furniture
  - light coming from the same side in every shot (top-left works well)
  - the same pot in every photo if you can

Only use photographs you own or that are licensed for use (Unsplash and Pexels
are free). Images saved from Pinterest belong to someone else.
