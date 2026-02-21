import os
from typing import Optional
from pathlib import Path

try:
    from pydub import AudioSegment
    from pydub.exceptions import CouldntDecodeError
except ImportError:
    AudioSegment = None
    CouldntDecodeError = Exception


def get_audio_format_from_mime(mime_type: str) -> str:
    """Convert MIME type to audio format string."""
    mime_to_format = {
        "audio/mpeg": "mp3",
        "audio/mp3": "mp3",
        "audio/mp4": "m4a",
        "audio/x-m4a": "m4a",
        "audio/m4a": "m4a",
        "audio/wav": "wav",
        "audio/wave": "wav",
        "audio/x-wav": "wav",
        "audio/aac": "aac",
        "audio/x-aac": "aac",
        "audio/ogg": "ogg",
        "audio/vorbis": "ogg",
        "audio/flac": "flac",
        "audio/x-flac": "flac",
        "audio/webm": "webm",
        "audio/opus": "opus",
    }
    return mime_to_format.get(mime_type.lower(), "mp3")


def get_extension_from_format(format: str) -> str:
    """Get file extension from audio format."""
    format_to_ext = {
        "mp3": ".mp3",
        "wav": ".wav",
        "aac": ".aac",
        "m4a": ".m4a",
        "ogg": ".ogg",
        "flac": ".flac",
        "webm": ".webm",
        "opus": ".opus",
    }
    return format_to_ext.get(format.lower(), ".mp3")


def trim_audio(
    input_path: str,
    output_path: str,
    start_time: float,
    end_time: float,
    output_format: Optional[str] = None,
) -> None:
    """
    Trim audio file to specified time range.
    
    Args:
        input_path: Path to input audio file
        output_path: Path to save output audio file
        start_time: Start time in seconds (float)
        end_time: End time in seconds (float)
        output_format: Output format (mp3, wav, aac, etc.). If None, uses input format
    """
    if AudioSegment is None:
        raise RuntimeError("pydub is not installed. Please install pydub and ffmpeg.")
    
    if start_time < 0:
        raise ValueError("start_time must be >= 0")
    
    if end_time <= start_time:
        raise ValueError("end_time must be greater than start_time")
    
    print(f"[AUDIO_PROCESSOR] Loading audio file: {input_path}")
    
    try:
        audio = AudioSegment.from_file(input_path)
    except CouldntDecodeError as e:
        raise ValueError(f"Could not decode audio file: {e}")
    except Exception as e:
        raise ValueError(f"Error loading audio file: {e}")
    
    duration_ms = len(audio)
    duration_seconds = duration_ms / 1000.0
    
    print(f"[AUDIO_PROCESSOR] Audio duration: {duration_seconds:.2f} seconds")
    print(f"[AUDIO_PROCESSOR] Trim range: {start_time:.2f}s to {end_time:.2f}s")
    
    if start_time > duration_seconds:
        raise ValueError(f"start_time ({start_time:.2f}s) exceeds audio duration ({duration_seconds:.2f}s)")
    
    if end_time > duration_seconds:
        print(f"[AUDIO_PROCESSOR] Warning: end_time ({end_time:.2f}s) exceeds duration ({duration_seconds:.2f}s), using duration")
        end_time = duration_seconds
    
    start_ms = int(start_time * 1000)
    end_ms = int(end_time * 1000)
    
    print(f"[AUDIO_PROCESSOR] Trimming from {start_ms}ms to {end_ms}ms")
    
    trimmed = audio[start_ms:end_ms]
    
    if output_format:
        output_format = output_format.lower()
        output_ext = get_extension_from_format(output_format)
    else:
        input_ext = Path(input_path).suffix.lower()
        format_map = {
            ".mp3": "mp3",
            ".wav": "wav",
            ".aac": "aac",
            ".m4a": "m4a",
            ".ogg": "ogg",
            ".flac": "flac",
            ".webm": "webm",
            ".opus": "opus",
        }
        output_format = format_map.get(input_ext, "mp3")
        output_ext = input_ext or ".mp3"
    
    print(f"[AUDIO_PROCESSOR] Exporting to format: {output_format}, path: {output_path}")
    
    try:
        trimmed.export(output_path, format=output_format)
    except Exception as e:
        raise ValueError(f"Error exporting audio: {e}")
    
    print(f"[AUDIO_PROCESSOR] Audio trimmed and exported successfully")

