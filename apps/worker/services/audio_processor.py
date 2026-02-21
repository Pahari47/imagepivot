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
        "wma": ".wma",
        "alac": ".m4a",
    }
    return format_to_ext.get(format.lower(), ".mp3")


def get_bitrate_from_quality(quality: str) -> int:
    """Convert quality preset to bitrate in kbps."""
    quality_map = {
        "low": 96,
        "medium": 192,
        "high": 320,
    }
    return quality_map.get(quality.lower(), 192)


def get_pydub_format(format: str) -> str:
    """
    Convert user-friendly format name to pydub-compatible format.
    
    Some formats need special handling:
    - AAC: Use 'ipod' format (MP4/M4A container with AAC codec)
    - ALAC: Use 'ipod' format (MP4/M4A container with ALAC codec)
    - WMA: Use 'asf' container (Advanced Systems Format)
    """
    format = format.lower()
    format_map = {
        "mp3": "mp3",
        "wav": "wav",
        "flac": "flac",
        "aac": "ipod",  # AAC in MP4/M4A container (pydub uses 'ipod' for M4A)
        "m4a": "ipod",  # MP4/M4A container (pydub uses 'ipod' for M4A)
        "ogg": "ogg",
        "wma": "asf",  # WMA uses ASF container
        "alac": "ipod",  # ALAC in MP4/M4A container (pydub uses 'ipod' for M4A)
    }
    return format_map.get(format, "mp3")


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


def convert_audio(
    input_path: str,
    output_path: str,
    output_format: str,
    quality: Optional[str] = None,
    bitrate: Optional[int] = None,
) -> None:
    """
    Convert audio file to a different format.
    
    Args:
        input_path: Path to input audio file
        output_path: Path to save output audio file
        output_format: Target format (mp3, wav, flac, aac, ogg, wma, alac, m4a)
        quality: Quality preset for lossy formats (low=96k, medium=192k, high=320k)
        bitrate: Custom bitrate in kbps (only used when quality is 'custom')
    """
    if AudioSegment is None:
        raise RuntimeError("pydub is not installed. Please install pydub and ffmpeg.")
    
    output_format = output_format.lower()
    # Lossy formats that support bitrate/quality settings
    lossy_formats = ["mp3", "aac", "ogg", "wma", "m4a"]
    # ALAC is lossless, so exclude it from lossy
    is_lossy = output_format in lossy_formats and output_format != "alac"
    
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
    print(f"[AUDIO_PROCESSOR] Converting to format: {output_format}")
    
    # Determine bitrate for lossy formats
    export_bitrate = None
    if is_lossy:
        if quality == "custom" and bitrate:
            export_bitrate = f"{bitrate}k"
            print(f"[AUDIO_PROCESSOR] Using custom bitrate: {export_bitrate}")
        elif quality:
            bitrate_kbps = get_bitrate_from_quality(quality)
            export_bitrate = f"{bitrate_kbps}k"
            print(f"[AUDIO_PROCESSOR] Using quality preset '{quality}': {export_bitrate}")
        else:
            # Default to medium quality
            export_bitrate = "192k"
            print(f"[AUDIO_PROCESSOR] Using default bitrate: {export_bitrate}")
    
    # Map user format to pydub format (AAC -> m4a, ALAC -> m4a, etc.)
    pydub_format = get_pydub_format(output_format)
    print(f"[AUDIO_PROCESSOR] Exporting to format: {output_format} (pydub format: {pydub_format}), path: {output_path}")
    
    try:
        export_params = {"format": pydub_format}
        
        if is_lossy and export_bitrate:
            # For MP3, use bitrate parameter
            if output_format == "mp3":
                export_params["bitrate"] = export_bitrate
            # For AAC (m4a container with AAC codec), use codec and bitrate
            elif output_format == "aac":
                export_params["codec"] = "aac"
                export_params["bitrate"] = export_bitrate
            # For OGG, use bitrate parameter
            elif output_format == "ogg":
                export_params["bitrate"] = export_bitrate
            # For WMA (asf container), use codec and bitrate
            elif output_format == "wma":
                export_params["codec"] = "wmav2"
                export_params["bitrate"] = export_bitrate
            # For M4A (default to AAC codec with bitrate)
            elif output_format == "m4a":
                export_params["codec"] = "aac"
                export_params["bitrate"] = export_bitrate
        elif output_format == "alac":
            # ALAC codec in m4a container (lossless, no bitrate)
            export_params["codec"] = "alac"
        
        audio.export(output_path, **export_params)
    except Exception as e:
        raise ValueError(f"Error exporting audio: {e}")
    
    print(f"[AUDIO_PROCESSOR] Audio converted and exported successfully")


def compress_audio(
    input_path: str,
    output_path: str,
    bitrate: int,
    vbr: bool = False,
    sample_rate: Optional[int] = None,
    output_format: str = "mp3",
) -> None:
    """
    Compress audio file to reduce file size.
    
    Args:
        input_path: Path to input audio file
        output_path: Path to save output audio file
        bitrate: Target bitrate in kbps (64-320)
        vbr: Use Variable Bitrate (VBR) for better quality at same file size
        sample_rate: Target sample rate in Hz (8000, 11025, 16000, 22050, 44100, 48000)
        output_format: Output format (mp3, aac, ogg, m4a)
    """
    if AudioSegment is None:
        raise RuntimeError("pydub is not installed. Please install pydub and ffmpeg.")
    
    if bitrate < 64 or bitrate > 320:
        raise ValueError("bitrate must be between 64 and 320 kbps")
    
    print(f"[AUDIO_PROCESSOR] Loading audio file for compression: {input_path}")
    try:
        audio = AudioSegment.from_file(input_path)
    except CouldntDecodeError as e:
        raise ValueError(f"Could not decode audio file: {e}")
    except Exception as e:
        raise ValueError(f"Error loading audio file: {e}")
    
    duration_ms = len(audio)
    duration_seconds = duration_ms / 1000.0
    original_sample_rate = audio.frame_rate
    
    print(f"[AUDIO_PROCESSOR] Audio duration: {duration_seconds:.2f} seconds")
    print(f"[AUDIO_PROCESSOR] Original sample rate: {original_sample_rate} Hz")
    
    # Apply sample rate conversion if specified
    if sample_rate and sample_rate != original_sample_rate:
        print(f"[AUDIO_PROCESSOR] Resampling from {original_sample_rate} Hz to {sample_rate} Hz")
        audio = audio.set_frame_rate(sample_rate)
    
    # Map user format to pydub format
    pydub_format = get_pydub_format(output_format)
    print(f"[AUDIO_PROCESSOR] Compressing to format: {output_format} (pydub format: {pydub_format})")
    print(f"[AUDIO_PROCESSOR] Target bitrate: {bitrate}k, VBR: {vbr}")
    
    try:
        export_params = {"format": pydub_format}
        
        # Set bitrate
        if output_format == "mp3":
            export_params["bitrate"] = f"{bitrate}k"
            if vbr:
                # VBR for MP3: use parameters to enable VBR mode
                # VBR quality scale: 0 (best) to 9 (worst)
                # Map bitrate to approximate VBR quality
                if bitrate >= 256:
                    vbr_quality = "0"
                elif bitrate >= 192:
                    vbr_quality = "2"
                elif bitrate >= 128:
                    vbr_quality = "4"
                elif bitrate >= 96:
                    vbr_quality = "6"
                else:
                    vbr_quality = "8"
                # Use parameters to pass ffmpeg VBR options
                if "parameters" not in export_params:
                    export_params["parameters"] = []
                export_params["parameters"].extend(["-q:a", vbr_quality])
        elif output_format == "aac" or output_format == "m4a":
            export_params["codec"] = "aac"
            export_params["bitrate"] = f"{bitrate}k"
        elif output_format == "ogg":
            export_params["bitrate"] = f"{bitrate}k"
        
        audio.export(output_path, **export_params)
    except Exception as e:
        raise ValueError(f"Error compressing audio: {e}")
    
    print(f"[AUDIO_PROCESSOR] Audio compressed successfully")


def normalize_audio(
    input_path: str,
    output_path: str,
    target_level: float = -16.0,
    output_format: Optional[str] = None,
) -> None:
    """
    Normalize audio file to target loudness level using FFmpeg's loudnorm filter.
    
    Args:
        input_path: Path to input audio file
        output_path: Path to save output audio file
        target_level: Target loudness level in LUFS (default: -16.0, industry standard)
        output_format: Output format (mp3, wav, flac, aac, ogg, m4a). If None, uses input format
    """
    if AudioSegment is None:
        raise RuntimeError("pydub is not installed. Please install pydub and ffmpeg.")
    
    if target_level < -23.0 or target_level > -12.0:
        raise ValueError("target_level must be between -23.0 and -12.0 LUFS")
    
    print(f"[AUDIO_PROCESSOR] Loading audio file for normalization: {input_path}")
    try:
        audio = AudioSegment.from_file(input_path)
    except CouldntDecodeError as e:
        raise ValueError(f"Could not decode audio file: {e}")
    except Exception as e:
        raise ValueError(f"Error loading audio file: {e}")
    
    duration_ms = len(audio)
    duration_seconds = duration_ms / 1000.0
    
    print(f"[AUDIO_PROCESSOR] Audio duration: {duration_seconds:.2f} seconds")
    print(f"[AUDIO_PROCESSOR] Normalizing to target level: {target_level} LUFS")
    
    # Determine output format
    if output_format:
        output_format = output_format.lower()
        pydub_format = get_pydub_format(output_format)
        output_ext = get_extension_from_format(output_format)
    else:
        # Use input format
        input_ext = Path(input_path).suffix.lower()
        format_map = {
            ".mp3": "mp3",
            ".wav": "wav",
            ".aac": "ipod",  # AAC uses ipod format
            ".m4a": "ipod",
            ".ogg": "ogg",
            ".flac": "flac",
            ".webm": "webm",
            ".opus": "opus",
        }
        pydub_format = format_map.get(input_ext, "mp3")
        output_ext = input_ext or ".mp3"
    
    print(f"[AUDIO_PROCESSOR] Exporting to format: {pydub_format if output_format else 'original'}, path: {output_path}")
    
    try:
        # Use FFmpeg's loudnorm filter for normalization
        # loudnorm filter parameters:
        # - I: integrated loudness target (LUFS)
        # - TP: true peak target (dB)
        # - LRA: loudness range target (LU)
        # - dual_mono: treat mono as dual-mono
        # Single-pass mode (faster, good enough for most cases)
        export_params = {
            "format": pydub_format,
            "parameters": [
                "-af",
                f"loudnorm=I={target_level}:TP=-1.5:LRA=11"
            ]
        }
        
        audio.export(output_path, **export_params)
    except Exception as e:
        raise ValueError(f"Error normalizing audio: {e}")
    
    print(f"[AUDIO_PROCESSOR] Audio normalized successfully")

