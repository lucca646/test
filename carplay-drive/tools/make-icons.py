#!/usr/bin/env python3
"""Génère les images CarPlay de l'app à partir de primitives géométriques.

CarPlay teinte lui-même les images des boutons : les glyphes sont donc blancs
sur fond transparent, sans dégradé ni couleur.

Tailles = maximums documentés par Apple, dépassés l'image est redimensionnée
(ou l'assertion saute selon les versions d'iOS) :
  - CPGridButton  60 × 60 pt
  - CPListItem    44 × 44 pt   (`CPListItem.maximumImageSize`)
  - CPBarButton   ~30 × 30 pt

Chaque glyphe sort en @1x / @2x / @3x pour que `resolveAssetSource` (appelé par
react-native-carplay sur toute clé finissant par « image ») serve la bonne
densité à l'écran de la voiture.

    python3 tools/make-icons.py
"""

from __future__ import annotations

import math
import pathlib

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

WHITE = (255, 255, 255, 255)
CLEAR = (0, 0, 0, 0)

# Facteur de suréchantillonnage : on dessine gros, on réduit en LANCZOS. PIL n'a
# pas d'antialiasing sur les primitives, c'est la seule façon d'avoir des bords
# propres à 44 px.
SS = 8


class Pad:
    """Canevas normalisé : toutes les coordonnées sont dans [0, 1]."""

    def __init__(self, pt: int):
        self.n = pt * SS
        self.img = Image.new("RGBA", (self.n, self.n), CLEAR)
        self.d = ImageDraw.Draw(self.img)

    def _p(self, pts):
        return [(x * self.n, y * self.n) for x, y in pts]

    def rect(self, x0, y0, x1, y1, c=WHITE):
        self.d.rectangle(self._p([(x0, y0), (x1, y1)]), fill=c)

    def rrect(self, x0, y0, x1, y1, r, c=WHITE):
        self.d.rounded_rectangle(
            self._p([(x0, y0), (x1, y1)]), radius=r * self.n, fill=c
        )

    def ell(self, cx, cy, rx, ry, c=WHITE):
        self.d.ellipse(self._p([(cx - rx, cy - ry), (cx + rx, cy + ry)]), fill=c)

    def poly(self, pts, c=WHITE):
        self.d.polygon(self._p(pts), fill=c)

    def line(self, pts, w, c=WHITE):
        self.d.line(self._p(pts), fill=c, width=max(1, int(w * self.n)), joint="curve")
        # PIL ne fait pas de bouts arrondis : on les pose à la main.
        for x, y in pts:
            self.ell(x, y, w / 2, w / 2, c)

    def arc(self, cx, cy, r, start, end, w, c=WHITE, caps=True):
        """Angles PIL : 0 = 3 h, croissants dans le sens horaire (y vers le bas)."""
        self.d.arc(
            self._p([(cx - r, cy - r), (cx + r, cy + r)]),
            start,
            end,
            fill=c,
            width=max(1, int(w * self.n)),
        )
        if caps:
            for a in (start, end):
                ax = cx + r * math.cos(math.radians(a))
                ay = cy + r * math.sin(math.radians(a))
                self.ell(ax, ay, w / 2, w / 2, c)

    def render(self, pt: int, scale: int) -> Image.Image:
        return self.img.resize((pt * scale, pt * scale), Image.LANCZOS)


def arrow_head(p: Pad, cx, cy, r, angle, size, clockwise=True):
    """Pointe de flèche posée au bout d'un arc, orientée selon sa tangente."""
    a = math.radians(angle)
    s = 1 if clockwise else -1
    tx, ty = -math.sin(a) * s, math.cos(a) * s  # tangente
    nx, ny = math.cos(a), math.sin(a)  # normale sortante
    bx, by = cx + r * nx, cy + r * ny
    p.poly(
        [
            (bx + tx * size, by + ty * size),
            (bx + nx * size * 0.95, by + ny * size * 0.95),
            (bx - nx * size * 0.95, by - ny * size * 0.95),
        ]
    )


def qbez(p0, p1, p2, n=18):
    """Bézier quadratique échantillonnée, pour les contours qui ne sont pas droits."""
    out = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        out.append(
            (
                u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
                u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
            )
        )
    return out


# --------------------------------------------------------------------------
# Glyphes
# --------------------------------------------------------------------------


def g_home(p: Pad):
    p.poly([(0.5, 0.05), (0.99, 0.45), (0.01, 0.45)])
    p.rect(0.13, 0.41, 0.87, 0.95)
    p.rect(0.40, 0.62, 0.60, 0.95, CLEAR)


def g_departure(p: Pad):
    p.poly([(0.26, 0.11), (0.55, 0.35), (-0.03, 0.35)])
    p.rect(0.02, 0.32, 0.50, 0.93)
    p.rect(0.17, 0.58, 0.35, 0.93, CLEAR)
    p.rect(0.56, 0.57, 0.84, 0.69)
    p.poly([(0.78, 0.47), (1.00, 0.63), (0.78, 0.79)])


def g_gate(p: Pad):
    """Portail à deux battants : piliers, traverses, barreaux, jour central."""
    p.rect(0.01, 0.15, 0.12, 0.95)
    p.rect(0.88, 0.15, 0.99, 0.95)
    for x0, x1 in ((0.14, 0.47), (0.53, 0.86)):
        p.rect(x0, 0.29, x1, 0.39)
        p.rect(x0, 0.61, x1, 0.71)
    for x in (0.15, 0.28, 0.40, 0.54, 0.67, 0.79):
        p.rect(x, 0.23, x + 0.07, 0.95)


def g_garage(p: Pad):
    p.poly([(0.5, 0.05), (1.01, 0.36), (-0.01, 0.36)])
    p.rect(0.09, 0.33, 0.91, 0.95)
    for i in range(3):
        y = 0.50 + i * 0.145
        p.rect(0.19, y, 0.81, y + 0.06, CLEAR)


def g_bulb(p: Pad):
    p.ell(0.5, 0.40, 0.25, 0.25)
    p.rect(0.40, 0.58, 0.60, 0.72)
    p.rrect(0.37, 0.71, 0.63, 0.95, 0.05)
    p.rect(0.37, 0.785, 0.63, 0.815, CLEAR)
    p.rect(0.37, 0.855, 0.63, 0.885, CLEAR)
    for a in (15, 55, 90, 125, 165):
        r0, r1 = 0.31, 0.44
        rad = math.radians(a)
        p.line(
            [
                (0.5 + r0 * math.cos(rad), 0.40 - r0 * math.sin(rad)),
                (0.5 + r1 * math.cos(rad), 0.40 - r1 * math.sin(rad)),
            ],
            0.055,
        )


def g_thermo(p: Pad):
    p.rrect(0.37, 0.04, 0.63, 0.72, 0.13)
    p.ell(0.5, 0.77, 0.21, 0.21)
    p.rrect(0.435, 0.105, 0.565, 0.70, 0.065, CLEAR)
    p.ell(0.5, 0.77, 0.15, 0.15, CLEAR)
    p.rrect(0.465, 0.32, 0.535, 0.74, 0.035)
    p.ell(0.5, 0.77, 0.105, 0.105)


def g_shield(p: Pad):
    pts = [(0.5, 0.03), (0.95, 0.19), (0.95, 0.47)]
    pts += qbez((0.95, 0.47), (0.93, 0.84), (0.5, 0.98))
    pts += qbez((0.5, 0.98), (0.07, 0.84), (0.05, 0.47))
    pts += [(0.05, 0.19)]
    p.poly(pts)
    p.line([(0.30, 0.48), (0.44, 0.62), (0.71, 0.33)], 0.11, CLEAR)


def g_power(p: Pad):
    # Trou de 60° centré sur le haut (270° en convention PIL).
    p.arc(0.5, 0.56, 0.36, 300, 600, 0.13)
    p.rrect(0.435, 0.05, 0.565, 0.50, 0.065)


def g_plug(p: Pad):
    p.rrect(0.29, 0.03, 0.40, 0.31, 0.035)
    p.rrect(0.60, 0.03, 0.71, 0.31, 0.035)
    p.rrect(0.18, 0.26, 0.82, 0.63, 0.09)
    p.rect(0.44, 0.60, 0.56, 0.99)


def g_bolt(p: Pad):
    p.poly(
        [
            (0.63, 0.01),
            (0.20, 0.57),
            (0.45, 0.57),
            (0.37, 0.99),
            (0.80, 0.43),
            (0.55, 0.43),
        ]
    )


def g_car(p: Pad):
    p.poly([(0.21, 0.50), (0.31, 0.22), (0.69, 0.22), (0.79, 0.50)])
    p.rrect(0.03, 0.43, 0.97, 0.72, 0.09)
    for cx in (0.25, 0.75):
        p.ell(cx, 0.75, 0.12, 0.12)
        p.ell(cx, 0.75, 0.05, 0.05, CLEAR)


def g_refresh(p: Pad):
    p.arc(0.5, 0.54, 0.33, 330, 600, 0.13, caps=False)
    arrow_head(p, 0.5, 0.54, 0.33, 240, 0.19)


def g_mic(p: Pad):
    p.rrect(0.37, 0.02, 0.63, 0.53, 0.13)
    p.arc(0.5, 0.43, 0.28, 20, 160, 0.085, caps=False)
    p.rect(0.455, 0.70, 0.545, 0.90)
    p.rrect(0.29, 0.89, 0.71, 0.99, 0.05)


GLYPHS = {
    "home": g_home,
    "departure": g_departure,
    "gate": g_gate,
    "garage": g_garage,
    "bulb": g_bulb,
    "thermo": g_thermo,
    "shield": g_shield,
    "power": g_power,
    "plug": g_plug,
    "bolt": g_bolt,
    "car": g_car,
    "refresh": g_refresh,
    "mic": g_mic,
}

# Ce qui est réellement utilisé, par dossier et par taille en points.
SETS = {
    "grid": (
        60,
        ["home", "departure", "gate", "garage", "bulb", "thermo", "shield", "power"],
    ),
    "list": (44, ["bulb", "gate", "garage", "thermo", "shield", "bolt", "plug"]),
    "bar": (30, ["refresh", "mic"]),
}


def build_glyphs() -> int:
    written = 0
    for folder, (pt, names) in SETS.items():
        out = ASSETS / "carplay" / folder
        out.mkdir(parents=True, exist_ok=True)
        for name in names:
            pad = Pad(pt)
            GLYPHS[name](pad)
            for scale in (1, 2, 3):
                suffix = "" if scale == 1 else f"@{scale}x"
                pad.render(pt, scale).save(out / f"{name}{suffix}.png")
                written += 1
    return written


def build_app_icon() -> None:
    """Icône iOS : carré plein, sans transparence ni coins arrondis (iOS s'en charge)."""
    n = 1024
    img = Image.new("RGB", (n, n))
    px = img.load()
    top, bottom = (0x1B, 0x2C, 0x3D), (0x0A, 0x0C, 0x11)
    for y in range(n):
        t = y / (n - 1)
        px_row = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(n):
            px[x, y] = px_row

    pad = Pad(256)
    g_home(pad)
    glyph = pad.render(256, 2)  # 512 px
    img.paste((255, 255, 255), (256, 232), glyph)

    accent = Pad(96)
    g_bolt(accent)
    img.paste((0x0A, 0x84, 0xFF), (620, 620), accent.render(96, 2))

    ASSETS.mkdir(parents=True, exist_ok=True)
    img.save(ASSETS / "icon.png")


if __name__ == "__main__":
    count = build_glyphs()
    build_app_icon()
    print(f"{count} glyphes + icon.png écrits dans {ASSETS}")
