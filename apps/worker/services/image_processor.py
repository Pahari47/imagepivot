import os
from typing import Optional, Tuple
from pathlib import Path

from PIL import Image


def get_image_format_from_mime(mime_type: str) -> str:
    """Convert MIME type to PIL format string."""
    mime_to_format = {
        "image/jpeg": "JPEG",
        "image/jpg": "JPEG",
        "image/png": "PNG",
        "image/gif": "GIF",
        "image/webp": "WEBP",
        "image/bmp": "BMP",
        "image/tiff": "TIFF",
    }
    return mime_to_format.get(mime_type.lower(), "JPEG")


def get_extension_from_format(format: str) -> str:
    """Get file extension from PIL format."""
    format_to_ext = {
        "JPEG": ".jpg",
        "PNG": ".png",
        "GIF": ".gif",
        "WEBP": ".webp",
        "BMP": ".bmp",
        "TIFF": ".tiff",
    }
    return format_to_ext.get(format.upper(), ".jpg")


def ensure_rgb_mode(img: Image.Image, target_format: str) -> Image.Image:
    """
    Convert image to RGB mode if needed for formats that don't support transparency.
    """
    if target_format.upper() in ("JPEG", "BMP") and img.mode in ("RGBA", "LA", "P"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        if img.mode in ("RGBA", "LA"):
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else img.split()[-1])
        else:
            background.paste(img)
        return background
    return img


def resize_image(
    input_path: str,
    output_path: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    maintain_aspect: bool = True,
    output_format: Optional[str] = None,
    quality: int = 95,
) -> None:
    """
    Resize an image.
    
    Args:
        input_path: Path to input image
        output_path: Path to save output image
        width: Target width in pixels (optional)
        height: Target height in pixels (optional)
        maintain_aspect: If True, maintain aspect ratio (default: True)
        output_format: Output format (JPEG, PNG, etc.). If None, uses input format
        quality: Quality for JPEG/WebP (1-100, default: 95)
    """
    if width is None and height is None:
        raise ValueError("At least one of width or height must be specified")
    
    img = Image.open(input_path)
    original_format = img.format or "JPEG"
    target_format = output_format or original_format
    
    if maintain_aspect:
        if width and height:
            img.thumbnail((width, height), Image.Resampling.LANCZOS)
        elif width:
            ratio = width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((width, new_height), Image.Resampling.LANCZOS)
        elif height:
            ratio = height / img.height
            new_width = int(img.width * ratio)
            img = img.resize((new_width, height), Image.Resampling.LANCZOS)
    else:
        if width is None:
            width = img.width
        if height is None:
            height = img.height
        img = img.resize((width, height), Image.Resampling.LANCZOS)
    
    img = ensure_rgb_mode(img, target_format)
    
    save_kwargs = {"format": target_format}
    if target_format in ("JPEG", "WEBP"):
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = True
    elif target_format == "PNG":
        save_kwargs["optimize"] = True
    
    img.save(output_path, **save_kwargs)


def compress_image(
    input_path: str,
    output_path: str,
    quality: int = 85,
    output_format: Optional[str] = None,
    optimize: bool = True,
) -> None:
    """
    Compress an image by reducing quality and optimizing.
    
    Args:
        input_path: Path to input image
        output_path: Path to save output image
        quality: Quality for JPEG/WebP (1-100, default: 85)
        output_format: Output format (JPEG, PNG, etc.). If None, uses input format
        optimize: If True, enable optimization (default: True)
    """
    img = Image.open(input_path)
    original_format = img.format or "JPEG"
    target_format = output_format or original_format
    
    img = ensure_rgb_mode(img, target_format)
    
    save_kwargs = {"format": target_format}
    if target_format in ("JPEG", "WEBP"):
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = optimize
    elif target_format == "PNG":
        save_kwargs["optimize"] = optimize
    
    img.save(output_path, **save_kwargs)