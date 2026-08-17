#!/usr/bin/env python3
"""Create a compact, machine-readable visual comparison for one iOS/Web state."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageChops, ImageEnhance, ImageOps


def pixel_values(image: Image.Image):
    getter = getattr(image, "get_flattened_data", None)
    return getter() if getter else image.getdata()


def parse_crop(value: str | None, label: str) -> tuple[int, int, int, int] | None:
    if value is None:
        return None
    try:
        x, y, width, height = (int(part) for part in value.split(","))
    except (TypeError, ValueError) as error:
        raise SystemExit(f"{label} must be x,y,width,height") from error
    if min(x, y) < 0 or width <= 0 or height <= 0:
        raise SystemExit(f"{label} must use non-negative x/y and positive width/height")
    return x, y, width, height


def load_image(path: Path, crop: tuple[int, int, int, int] | None) -> Image.Image:
    image = Image.open(path).convert("RGB")
    if crop is None:
        return image
    x, y, width, height = crop
    if x + width > image.width or y + height > image.height:
        raise SystemExit(f"crop is outside {path.name} ({image.width}x{image.height})")
    return image.crop((x, y, x + width, y + height))


def region_ratios(mask: Image.Image, columns: int = 4, rows: int = 8) -> list[dict[str, object]]:
    regions: list[dict[str, object]] = []
    for row in range(rows):
        top = round(mask.height * row / rows)
        bottom = round(mask.height * (row + 1) / rows)
        for column in range(columns):
            left = round(mask.width * column / columns)
            right = round(mask.width * (column + 1) / columns)
            tile = mask.crop((left, top, right, bottom))
            changed = sum(1 for value in pixel_values(tile) if value)
            total = tile.width * tile.height
            regions.append(
                {
                    "x": left,
                    "y": top,
                    "width": right - left,
                    "height": bottom - top,
                    "changed_ratio": round(changed / total, 6) if total else 0,
                }
            )
    return sorted(regions, key=lambda item: float(item["changed_ratio"]), reverse=True)


def create_diff_preview(ios: Image.Image, web: Image.Image, mask: Image.Image) -> Image.Image:
    base = ImageEnhance.Brightness(ImageOps.grayscale(ios).convert("RGB")).enhance(0.65)
    red = Image.new("RGB", ios.size, (255, 30, 60))
    return Image.composite(red, base, mask)


def create_contact_sheet(images: Iterable[Image.Image]) -> Image.Image:
    items = list(images)
    sheet = Image.new("RGB", (items[0].width * len(items), items[0].height), "white")
    for index, image in enumerate(items):
        sheet.paste(image, (index * image.width, 0))
    return sheet


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ios", type=Path, required=True)
    parser.add_argument("--web", type=Path, required=True)
    parser.add_argument("--output-prefix", type=Path, required=True)
    parser.add_argument("--ios-crop")
    parser.add_argument("--web-crop")
    parser.add_argument("--threshold", type=int, default=24)
    args = parser.parse_args()

    if not 0 <= args.threshold <= 255:
        raise SystemExit("threshold must be between 0 and 255")

    ios = load_image(args.ios, parse_crop(args.ios_crop, "--ios-crop"))
    web = load_image(args.web, parse_crop(args.web_crop, "--web-crop"))
    if ios.size != web.size:
        raise SystemExit(
            "iOS and Web evidence must have the same pixel dimensions after cropping: "
            f"iOS={ios.width}x{ios.height}, Web={web.width}x{web.height}"
        )

    diff = ImageChops.difference(ios, web)
    total = ios.width * ios.height
    histogram = diff.histogram()
    absolute_error = sum((index % 256) * count for index, count in enumerate(histogram))
    mean_channel_error = absolute_error / (total * 3 * 255)
    prefix = args.output_prefix
    prefix.parent.mkdir(parents=True, exist_ok=True)
    ios_path = prefix.with_name(f"{prefix.name}-ios.png")
    web_path = prefix.with_name(f"{prefix.name}-web.png")
    pixelmatch_mask_path = prefix.with_name(f"{prefix.name}-pixelmatch.png")
    diff_path = prefix.with_name(f"{prefix.name}-diff.png")
    comparison_path = prefix.with_name(f"{prefix.name}-comparison.png")
    report_path = prefix.with_suffix(".json")

    ios.save(ios_path)
    web.save(web_path)
    metrics_script = Path(__file__).with_name("visual_metrics.mjs")
    try:
        completed = subprocess.run(
            [
                "node",
                str(metrics_script),
                f"--ios={ios_path}",
                f"--web={web_path}",
                f"--diff-mask={pixelmatch_mask_path}",
                f"--threshold={args.threshold / 255}",
            ],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as error:
        raise SystemExit(error.stderr.strip() or "Pixelmatch/SSIM comparison failed") from error
    metrics = json.loads(completed.stdout)
    pixelmatch_mask = Image.open(pixelmatch_mask_path).convert("RGBA")
    mask = pixelmatch_mask.getchannel("A").point(lambda value: 255 if value else 0)
    box = mask.getbbox()
    preview = create_diff_preview(ios, web, mask)
    preview.save(diff_path)
    create_contact_sheet((ios, web, preview)).save(comparison_path)

    report = {
        "ios": args.ios.name,
        "web": args.web.name,
        "dimensions": {"width": ios.width, "height": ios.height},
        "engine": {
            "primary": metrics["primary"],
            "pixelmatch_threshold": metrics["threshold"],
            "anti_aliasing": metrics["antiAliasing"],
            "secondary": metrics["secondary"],
        },
        "legacy_threshold_0_255": args.threshold,
        "changed_pixels": metrics["changedPixels"],
        "changed_ratio": metrics["changedRatio"],
        "ssim_score": metrics["ssimScore"],
        "mean_channel_error": round(mean_channel_error, 6),
        "changed_bounds": (
            {"left": box[0], "top": box[1], "right": box[2], "bottom": box[3]}
            if box
            else None
        ),
        "highest_difference_regions": region_ratios(mask)[:8],
        "artifacts": {
            "normalized_ios": ios_path.name,
            "normalized_web": web_path.name,
            "pixelmatch_mask": pixelmatch_mask_path.name,
            "diff": diff_path.name,
            "comparison": comparison_path.name,
        },
        "interpretation": "Evidence for targeted refinement; not a release gate or a claim of pixel-perfect equivalence.",
    }
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
