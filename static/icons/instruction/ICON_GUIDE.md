# Instruction Icon Generation Guide

> Use this guide to generate WebP icons via EmojiKitchen

## Quick Start - Adding New Icons

### Step 1: Generate the Icon

Use EmojiKitchen to combine two emojis. You can use:
- **EmojiKitchen website**: https://emojikitchen.dev/
- **EmojiKitchen CLI** (if installed in RecipeGrove)

### Step 2: Download/Save as WebP

Save the generated icon as a 24x24 WebP file.

### Step 3: Name the File

Use the semantic name that matches the icon key in code:
- `stovetop.webp` (not `1f373_1f525.webp`)
- `mix.webp`
- `bake.webp`
- etc.

### Step 4: Place in This Folder

Copy the WebP file to `static/icons/instruction/`

### Step 5: Update the Sidecar JSON

In your recipe's `-grove.json` file, add the icon key to the step:
```json
{
  "step": 1,
  "icons": ["mix", "chop"],
  "text": "Combine and chop the ingredients..."
}
```

---

## Icon Specifications

- **Size**: 24px × 24px
- **Format**: WebP (for optimal compression and quality)
- **Background**: Transparent

## Standard Instruction Icon Set

Generate each icon using EmojiKitchen with the following emoji combinations:

| Key | Emoji 1 | Emoji 2 | Codepoint 1 | Codepoint 2 | Output Filename | Semantic Meaning |
|-----|---------|---------|-------------|-------------|-----------------|------------------|
| `stovetop` | 🍳 | 🔥 | `1f373` | `1f525` | `1f373_1f525.webp` | Cook on stove/pan |
| `mix` | 🥄 | ⭐ | `1f944` | `2b50` | `1f944_2b50.webp` | Mix/stir in bowl |
| `spicy` | 🌶️ | 🔥 | `1f336` | `1f525` | `1f336_1f525.webp` | Spicy/hot indicator |
| `chop` | 🔪 | 🥬 | `1f52a` | `1f96c` | `1f52a_1f96c.webp` | Chop/prep ingredients |
| `simmer` | ♨️ | ⏱️ | `2668` | `23f1` | `2668_23f1.webp` | Simmer/wait |
| `chill` | 🧊 | ❄️ | `1f9ca` | `2744` | `1f9ca_2744.webp` | Refrigerate/chill |
| `serve` | 🍽️ | ✨ | `1f37d` | `2728` | `1f37d_2728.webp` | Plate/serve |
| `boil` | 🥣 | 🔥 | `1f963` | `1f525` | `1f963_1f525.webp` | Boil in pot |
| `bake` | 🥧 | 🔥 | `1f967` | `1f525` | `1f967_1f525.webp` | Oven/bake |
| `marinate` | 🥩 | ⏰ | `1f969` | `23f0` | `1f969_23f0.webp` | Marinate/rest |
| `blend` | 🥤 | 🌀 | `1f964` | `1f300` | `1f964_1f300.webp` | Blend/puree |
| `season` | 🧂 | ⭐ | `1f9c2` | `2b50` | `1f9c2_2b50.webp` | Season/salt |
| `grill` | 🥩 | 🔥 | `1f969` | `1f525` | `1f969_1f525.webp` | Grill/BBQ |
| `steam` | 🥟 | ♨️ | `1f95f` | `2668` | `1f95f_2668.webp` | Steam |
| `knead` | 🍞 | 💪 | `1f35e` | `1f4aa` | `1f35e_1f4aa.webp` | Knead dough |

## Generation Commands

Using EmojiKitchen CLI:

```bash
# Generate all icons
uv run python -m emoji_kitchen generate 1f373 1f525 -o 1f373_1f525.webp --size 24
uv run python -m emoji_kitchen generate 1f944 2b50 -o 1f944_2b50.webp --size 24
uv run python -m emoji_kitchen generate 1f336 1f525 -o 1f336_1f525.webp --size 24
uv run python -m emoji_kitchen generate 1f52a 1f96c -o 1f52a_1f96c.webp --size 24
uv run python -m emoji_kitchen generate 2668 23f1 -o 2668_23f1.webp --size 24
uv run python -m emoji_kitchen generate 1f9ca 2744 -o 1f9ca_2744.webp --size 24
uv run python -m emoji_kitchen generate 1f37d 2728 -o 1f37d_2728.webp --size 24
uv run python -m emoji_kitchen generate 1f963 1f525 -o 1f963_1f525.webp --size 24
uv run python -m emoji_kitchen generate 1f967 1f525 -o 1f967_1f525.webp --size 24
uv run python -m emoji_kitchen generate 1f969 23f0 -o 1f969_23f0.webp --size 24
uv run python -m emoji_kitchen generate 1f964 1f300 -o 1f964_1f300.webp --size 24
uv run python -m emoji_kitchen generate 1f9c2 2b50 -o 1f9c2_2b50.webp --size 24
uv run python -m emoji_kitchen generate 1f969 1f525 -o 1f969_1f525.webp --size 24
uv run python -m emoji_kitchen generate 1f95f 2668 -o 1f95f_2668.webp --size 24
uv run python -m emoji_kitchen generate 1f35e 1f4aa -o 1f35e_1f4aa.webp --size 24
```

## Batch Generation Script

Save this as `generate_icons.py`:

```python
#!/usr/bin/env python
"""Generate all standard instruction icons."""

import asyncio
from pathlib import Path
from emoji_kitchen import EmojiKitchen

ICONS = {
    "stovetop": ("1f373", "1f525"),
    "mix": ("1f944", "2b50"),
    "spicy": ("1f336", "1f525"),
    "chop": ("1f52a", "1f96c"),
    "simmer": ("2668", "23f1"),
    "chill": ("1f9ca", "2744"),
    "serve": ("1f37d", "2728"),
    "boil": ("1f963", "1f525"),
    "bake": ("1f967", "1f525"),
    "marinate": ("1f969", "23f0"),
    "blend": ("1f964", "1f300"),
    "season": ("1f9c2", "2b50"),
    "grill": ("1f969", "1f525"),
    "steam": ("1f95f", "2668"),
    "knead": ("1f35e", "1f4aa"),
}

async def main():
    output_dir = Path(".")
    kitchen = EmojiKitchen()

    for name, (code1, code2) in ICONS.items():
        filename = f"{code1}_{code2}.webp"
        output_path = output_dir / filename

        result = await kitchen.generate(code1, code2, size=24, format="webp")
        if result:
            output_path.write_bytes(result)
            print(f"✓ Generated {name}: {filename}")
        else:
            print(f"✗ Failed {name}: {filename}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Icon Usage Mapping

When to use each icon in recipe instructions:

| Icon | Use When |
|------|----------|
| `stovetop` | Sautéing, frying, pan-cooking |
| `mix` | Combining ingredients, whisking, stirring |
| `spicy` | Adding chili, hot peppers, spice warning |
| `chop` | Cutting, dicing, mincing, slicing |
| `simmer` | Low heat cooking, reducing sauces |
| `chill` | Refrigerating, cooling, freezing |
| `serve` | Final presentation, plating, garnishing |
| `boil` | Boiling water, blanching vegetables |
| `bake` | Oven baking, roasting |
| `marinate` | Marinating meat, resting dough |
| `blend` | Using blender, food processor, pureeing |
| `season` | Adding salt, pepper, herbs, seasoning |
| `grill` | Grilling, BBQ, char-grilling |
| `steam` | Steaming vegetables, dumplings |
| `knead` | Kneading bread dough, pasta dough |

## Placeholder Icons

The current `.svg` files in this directory are placeholders for testing. Replace them with the generated `.webp` files once available.

---

## Troubleshooting

### Icon Shows Wrong Image (e.g., Minion Face)

Some emoji combinations don't exist in EmojiKitchen and return a fallback image. Try alternative emoji pairs:

**Example - knead icon failed with 🍞 + 💪:**
- Try: 🍞 + 🖐️ (bread + hand)
- Try: 🥖 + 💪 (baguette + muscle)
- Try: 🫓 + 🤲 (flatbread + palms)

### Icon Not Displaying

1. Check the filename matches the icon key exactly (e.g., `mix.webp`)
2. Verify the file is in `static/icons/instruction/`
3. Check the sidecar JSON has the correct icon key in `icons_used`

### Adding a New Icon Type

1. Choose a semantic name (e.g., `fold`, `toast`, `garnish`)
2. Find a good emoji combination
3. Generate and save as `{name}.webp`
4. Add to `IconLegend.svelte`'s `iconMeanings` object:
   ```javascript
   fold: { name: 'Fold', meaning: 'Fold ingredients together' },
   ```

---

## Current Icon Status

| Icon | Status | Notes |
|------|--------|-------|
| stovetop | ✅ WebP | 🍳 + 🔥 |
| mix | ✅ WebP | 🥄 + ⭐ |
| spicy | ✅ WebP | 🌶️ + 🔥 |
| chop | ✅ WebP | 🔪 + 🥬 |
| simmer | ✅ WebP | ♨️ + ⏱️ |
| chill | ✅ WebP | 🧊 + ❄️ |
| serve | ✅ WebP | 🍽️ + ✨ |
| boil | ✅ WebP | 🥣 + 🔥 |
| bake | ✅ WebP | 🥧 + 🔥 |
| marinate | ✅ WebP | 🥩 + ⏰ |
| blend | ✅ WebP | 🥤 + 🌀 |
| season | ✅ WebP | 🧂 + ⭐ |
| grill | ✅ WebP | 🥩 + 🔥 |
| steam | ✅ WebP | 🥟 + ♨️ |
| knead | ⚠️ SVG placeholder | 🍞 + 💪 failed - needs alternative |

---

*Last updated: 2025-11-20*
