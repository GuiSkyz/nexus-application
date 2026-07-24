import struct
import zlib
import os

os.makedirs("assets", exist_ok=True)

def make_png(width, height, r, g, b):
    raw = b""
    for _ in range(height):
        raw += b"\x00"
        for _ in range(width):
            raw += bytes([r, g, b])

    def chunk(chunk_type, data):
        c = chunk_type + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    idat = chunk(b"IDAT", zlib.compress(raw))
    iend = chunk(b"IEND", b"")
    return b"\x89PNG\r\n\x1a\n" + ihdr + idat + iend

# Azul institucional #0757c8
png = make_png(64, 64, 7, 87, 200)

for name in ["favicon.png", "icon.png", "splash.png", "adaptive-icon.png"]:
    with open(f"assets/{name}", "wb") as f:
        f.write(png)

print("PNGs validos criados com sucesso")
