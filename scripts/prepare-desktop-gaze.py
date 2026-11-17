#!/usr/bin/env python3
"""Prepare local eye pixels, so file:// playback never needs canvas image readback.

Calibration: Yiyu pixel-pet/art/freeArtProfiles.ts and v2/rig/PoseAppearance.ts.
Only the existing public character PNGs in assets/xiaoyu are read.
"""
import base64
import hashlib
import json
import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EYES = [
    dict(x=465, y=489, rx=49, ry=25, angle=-.3, irisX=466, irisY=488, irisRx=31, irisRy=28),
    dict(x=638, y=421, rx=49, ry=28, angle=-.35, irisX=639, irisY=420, irisRx=31, irisRy=29),
]


def rgba(path):
    data = path.read_bytes()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('Expected PNG')
    offset, compressed = 8, bytearray()
    while offset < len(data):
        size = struct.unpack('>I', data[offset:offset + 4])[0]
        kind, payload = data[offset + 4:offset + 8], data[offset + 8:offset + 8 + size]
        if kind == b'IHDR':
            width, height, depth, colour, compression, filtering, interlace = struct.unpack('>IIBBBBB', payload)
            if (depth, colour, compression, filtering, interlace) != (8, 6, 0, 0, 0):
                raise ValueError('Expected non-interlaced 8-bit RGBA')
        elif kind == b'IDAT':
            compressed.extend(payload)
        offset += size + 12
    raw, stride = zlib.decompress(compressed), width * 4
    pixels, previous = bytearray(), bytearray(stride)
    for y in range(height):
        start = y * (stride + 1)
        mode, row = raw[start], bytearray(raw[start + 1:start + 1 + stride])
        if mode not in range(5):
            raise ValueError('Invalid PNG filter')
        for x in range(stride):
            a = row[x - 4] if x >= 4 else 0
            b, c = previous[x], previous[x - 4] if x >= 4 else 0
            if mode == 1:
                predictor = a
            elif mode == 2:
                predictor = b
            elif mode == 3:
                predictor = (a + b) // 2
            elif mode == 4:
                p = a + b - c
                da, db, dc = abs(p - a), abs(p - b), abs(p - c)
                predictor = a if da <= db and da <= dc else b if db <= dc else c
            else:
                predictor = 0
            row[x] = (row[x] + predictor) & 255
        pixels.extend(row)
        previous = row
    return width, height, pixels


def patch(pixels, width, height, eye):
    # The original renderer prepares artwork at about 0.46 source resolution.
    # A half-resolution local patch has the same visual density, at bounded cost.
    left, top = int(eye['x'] - 88) // 2 * 2, int(eye['y'] - 72) // 2 * 2
    w, h, factor = 88, 72, .5
    original, aperture = bytearray(w * h * 4), bytearray(w * h)
    cosine, sine = math.cos(eye['angle']), math.sin(eye['angle'])
    for y in range(h):
        for x in range(w):
            sx, sy = left + x * 2 + 1, top + y * 2 + 1
            if not (0 <= sx < width and 0 <= sy < height):
                continue
            offset = (sy * width + sx) * 4
            r, g, b, a = pixels[offset:offset + 4]
            dx, dy = sx - eye['x'], sy - eye['y']
            u, v = dx * cosine + dy * sine, -dx * sine + dy * cosine
            distance = (u / eye['rx']) ** 2 + (v / eye['ry']) ** 2
            iris_distance = ((sx - eye['irisX']) / eye['irisRx']) ** 2 + ((sy - eye['irisY']) / eye['irisRy']) ** 2
            blue = b > r * 1.08 and b >= g * .94
            white = r > 175 and g > 175 and b >= r * .985 and abs(r - g) < 22
            dark = r < 185 and g < 150 and b < 185
            inside = a > 100 and (distance < 1.3 or iris_distance < 1.2) and (blue or white or (dark and iris_distance < .7))
            i = y * w + x
            if inside:
                aperture[i] = 1
                original[i * 4:i * 4 + 4] = bytes((r, g, b, a))
    return dict(left=left, top=top, width=w, height=h, scale=2,
                rx=eye['rx'] * factor, ry=eye['ry'] * factor,
                irisX=(eye['irisX'] - left - 1) * factor, irisY=(eye['irisY'] - top - 1) * factor,
                irisRx=eye['irisRx'] * factor, irisRy=eye['irisRy'] * factor,
                pixels=base64.b64encode(original).decode(), aperture=base64.b64encode(aperture).decode())


def main():
    result = {}
    for pose in ('neutral', 'wave', 'chin'):
        path = ROOT / 'assets/xiaoyu' / (pose + '.png')
        width, height, pixels = rgba(path)
        if (width, height) != (1024, 1536):
            raise ValueError('Source calibration mismatch')
        eyes = [dict(e) for e in EYES]
        if pose != 'neutral':
            for eye, (x, y) in zip(eyes, [(471, 487), (644, 426)]):
                eye.update(x=x, y=y, irisX=x + 1, irisY=y - 1)
        result[pose] = dict(sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                            centers=[[e['x'], e['y']] for e in eyes],
                            eyes=[patch(pixels, width, height, eye) for eye in eyes])
    target = ROOT / 'assets/xiaoyu/gaze-patches.js'
    target.write_text('/* Generated from the local original PNGs. See scripts/prepare-desktop-gaze.py. */\n'
                      + 'window.XIAOYU_GAZE_PATCHES=' + json.dumps(result, separators=(',', ':')) + ';\n')
    print(f'Prepared {len(result)} poses / 6 eyes: {target.stat().st_size:,} bytes')


if __name__ == '__main__':
    main()
