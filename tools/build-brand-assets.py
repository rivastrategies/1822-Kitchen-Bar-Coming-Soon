"""Export icon formats and a share image from the existing approved logo assets."""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / 'assets/brand'
small = Image.open(BRAND / 'favicon-drive-01.png').convert('RGB')
for size in (16, 32, 48):
    small.resize((size, size), Image.Resampling.LANCZOS).save(BRAND / f'favicon-{size}-v1.png', optimize=True)
small.save(ROOT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])

# Trim transparent canvas only; preserve the badge artwork, colors and proportions.
badge = Image.open(BRAND / 'primary-badge-web.png').convert('RGBA')
# Keep the header's original canvas and proportions at a suitable display size.
badge.resize((400, 240), Image.Resampling.LANCZOS).save(
    BRAND / 'header-badge-v1.webp', lossless=True, method=6)
badge = badge.crop(badge.getchannel('A').getbbox())
for size, filename in ((180, ROOT / 'apple-touch-icon.png'),
                       (192, BRAND / 'icon-192-v1.png'),
                       (512, BRAND / 'icon-512-v1.png')):
    canvas = Image.new('RGB', (size, size), '#f3efe6')
    mark = ImageOps.contain(badge, (round(size * .84), round(size * .84)), Image.Resampling.LANCZOS)
    canvas.paste(mark, ((size - mark.width) // 2, (size - mark.height) // 2), mark)
    canvas.save(filename, optimize=True)

share = Image.new('RGB', (1200, 630), '#0d1b3d')
mark = ImageOps.contain(badge, (560, 480), Image.Resampling.LANCZOS)
share.paste(mark, ((1200 - mark.width) // 2, (630 - mark.height) // 2), mark)
share.save(BRAND / '1822-share-v1.png', optimize=True)
print('Exported approved-logo browser icons, phone icons and 1200 x 630 share image.')
