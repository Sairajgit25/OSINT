"""Risk-weight chart for the FootprintX PRD PDF (§25 heuristic weights).
Follows typesetting/charts.md: horizontal bars, no top/right spines,
value labels (grid removed), palette colors, no internal title (caption in PDF).
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.font_manager as fm

fm.fontManager.addfont("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
import matplotlib.pyplot as plt

plt.rcParams["font.sans-serif"] = ["DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

# Palette (cascade seed 42)
ACCENT = "#1f6c92"
ICON = "#4b86a4"
INK = "#131515"
MUTED = "#747b7e"
BORDER = "#acbdc5"

rules = [
    ("Credential / password metadata exposed", 25),
    ("Multiple breach exposure (2+)", 20),
    ("Phone number publicly indexed", 20),
    ("Sensitive public information", 20),
    ("Single breach exposure", 10),
    ("Email address publicly indexed", 10),
    ("Many account associations (6+)", 10),
    ("Reused username across platforms", 10),
]
rules_sorted = sorted(rules, key=lambda r: r[1])
labels = [r[0] for r in rules_sorted]
values = [r[1] for r in rules_sorted]

fig, ax = plt.subplots(figsize=(7.0, 3.4), constrained_layout=True)
bars = ax.barh(labels, values, height=0.62, color=ACCENT, edgecolor="none", zorder=3)

# Value labels at bar ends -> grid removed entirely (charts.md)
for bar, v in zip(bars, values):
    ax.text(bar.get_width() + 0.45, bar.get_y() + bar.get_height() / 2,
            f"+{v}", va="center", ha="left", fontsize=11, color=INK, zorder=4)

ax.set_xlim(0, 29)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.spines["left"].set_visible(False)
ax.spines["bottom"].set_color(BORDER)
ax.tick_params(axis="y", length=0, labelsize=11, colors=INK)
ax.tick_params(axis="x", length=3, labelsize=10, colors=MUTED)
ax.set_xlabel("Score contribution (points, capped at 100)", fontsize=10, color=MUTED)
ax.grid(False)

fig.savefig("/home/z/my-project/scripts/pdf-build/chart-risk-weights.png", dpi=220,
            facecolor="white")
print("chart saved")
