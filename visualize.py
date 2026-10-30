"""Draw model bounding boxes on a photo. No API calls or image generation."""

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


def pixel_box(box, width, height):
    if not isinstance(box, list) or len(box) != 4:
        raise ValueError('bbox must be [xmin, ymin, xmax, ymax]')
    if any(type(v) not in (int, float) or not math.isfinite(v)
           or not 0 <= v <= 1000 for v in box):
        raise ValueError('bbox values must be finite numbers in 0..1000')
    xmin, ymin, xmax, ymax = box
    if xmin >= xmax or ymin >= ymax:
        raise ValueError('bbox requires xmin < xmax and ymin < ymax')
    # Pillow draws inclusive endpoints: the far image edge is width/height - 1.
    return (
        min(width - 1, round(xmin * width / 1000)),
        min(height - 1, round(ymin * height / 1000)),
        min(width - 1, round(xmax * width / 1000)),
        min(height - 1, round(ymax * height / 1000)),
    )


def pixel_anchor(anchor, normalized_box, width, height):
    if not isinstance(anchor, list) or len(anchor) != 2:
        raise ValueError('anchor must be [x, y]')
    if any(type(v) not in (int, float) or not math.isfinite(v)
           or not 0 <= v <= 1000 for v in anchor):
        raise ValueError('anchor values must be finite numbers in 0..1000')
    x, y = anchor
    xmin, ymin, xmax, ymax = normalized_box
    if not (xmin <= x <= xmax and ymin <= y <= ymax):
        raise ValueError('anchor must be inside bbox')
    return (min(width - 1, round(x * width / 1000)),
            min(height - 1, round(y * height / 1000)))


def annotate(image_path, json_path, output_path, items_key='objects',
             label_key='name_en', box_key='bbox', label_position='top',
             show_boxes=True, show_anchors=False):
    if label_position not in ('top', 'center'):
        raise ValueError('label_position must be top or center')
    image_path, json_path, output_path = map(Path, (image_path, json_path, output_path))
    if output_path.resolve() in (image_path.resolve(), json_path.resolve()):
        raise ValueError('output must not overwrite an input file')
    if output_path.exists():
        raise ValueError('output already exists; choose a new filename')
    data = json.loads(json_path.read_text(encoding='utf-8-sig'))
    items = data.get(items_key) if isinstance(data, dict) else data
    if not isinstance(items, list):
        raise ValueError(f'JSON must be an array or an object containing "{items_key}" array')

    with Image.open(image_path) as source:
        # Use the same upright orientation as ordinary photo viewers.
        image = ImageOps.exif_transpose(source).convert('RGB')
    width, height = image.size
    font = ImageFont.load_default(size=max(12, round(min(width, height) / 40)))
    draw = ImageDraw.Draw(image)
    line_width = max(2, round(min(width, height) / 300))
    colors = ['#EF4444', '#2563EB', '#16A34A', '#9333EA', '#EA580C']
    for index, item in enumerate(items):
        try:
            if not isinstance(item, dict):
                raise ValueError('each object must be a JSON object')
            label = item[label_key]
            if not isinstance(label, str) or not label.strip() or not label.isascii():
                raise ValueError('English label must be a nonempty ASCII string')
            label = ' '.join(label.split())
            box = pixel_box(item[box_key], width, height)
            anchor = (pixel_anchor(item['anchor'], item[box_key], width, height)
                      if show_anchors else None)
        except (KeyError, ValueError) as exc:
            raise ValueError(f'object {index + 1}: {exc}') from exc
        color = colors[index % len(colors)]
        if show_boxes:
            draw.rectangle(box, outline=color, width=line_width)
        # Wrap unusually long labels to keep the text inside the image.
        lines, current = [], ''
        for char in label:
            if current and draw.textlength(current + char, font=font) > max(1, width - 8):
                lines.append(current)
                current = ''
            current += char
        lines.append(current)
        text = '\n'.join(lines)
        left, top, right, bottom = draw.multiline_textbbox((0, 0), text, font=font)
        tw, th = right - left + 8, bottom - top + 8
        if label_position == 'center':
            cx = (box[0] + box[2]) / 2
            cy = (box[1] + box[3]) / 2
            x, y = round(cx - tw / 2), round(cy - th / 2)
        else:
            x = box[0]
            y = box[1] - th if box[1] >= th else box[1]
        # Keep edge labels readable without changing the model's bbox.
        x = max(0, min(x, width - tw))
        y = max(0, min(y, height - th))
        draw.rectangle((x, y, x + tw - 1, y + th - 1), fill=color)
        draw.multiline_text((x + 4 - left, y + 4 - top), text, font=font, fill='white')
        if anchor is not None:
            radius = max(4, round(min(width, height) / 120))
            ax, ay = anchor
            draw.ellipse((ax - radius, ay - radius, ax + radius, ay + radius),
                         fill=color, outline='white', width=max(2, line_width))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path)
    return len(items), image.size


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image', help='original image path')
    parser.add_argument('json', help='model JSON file path')
    parser.add_argument('-o', '--output', required=True, help='new output image path; PNG recommended')
    parser.add_argument('--items-key', default='objects')
    parser.add_argument('--label-key', default='name_en')
    parser.add_argument('--box-key', default='bbox')
    parser.add_argument('--label-position', choices=('top', 'center'), default='top',
                        help='draw labels above boxes (default) or at their centers')
    parser.add_argument('--hide-boxes', action='store_true',
                        help='draw only labels for a cleaner experience preview')
    parser.add_argument('--show-anchor', action='store_true',
                        help='mark each model anchor; requires anchor in every object')
    args = parser.parse_args()
    try:
        count, size = annotate(args.image, args.json, args.output,
                               args.items_key, args.label_key, args.box_key,
                               args.label_position, not args.hide_boxes,
                               args.show_anchor)
    except (ValueError, OSError) as exc:
        parser.exit(1, f'Error: {exc}\n')
    print(f'Saved {args.output} ({size[0]}x{size[1]}, {count} objects, '
          f'labels={args.label_position}, boxes={not args.hide_boxes})')


if __name__ == '__main__':
    main()
