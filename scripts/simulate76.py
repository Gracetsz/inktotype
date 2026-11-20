"""76 格模拟照片生成器（含 14 个标点）。
布局直接读 scripts/layout76.json —— 与前端 lib/template.ts 同源，不重复实现。

标点是本轮要验的东西：README v3 指出小面积字符（. , ' 等）连通域阈值
若沿用 250px² 会被当噪点滤除。这里按真实排版位置书写标点，
再交给管线看分级阈值是否救得回来。
"""
import cv2, numpy as np, json, random, sys
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter, map_coordinates

L = json.load(open("scripts/layout76.json"))
W, H, MARK, PAD = L["W"], L["H"], L["mark"], L["pad"]
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-BoldItalic.ttf"


def build_template():
    """四角实心黑方块 + 格框 + 基线/x-height 参考线 + 浅灰参考字"""
    img = np.full((H, W), 255, np.uint8)
    for x, y in [(PAD, PAD), (W - PAD - MARK, PAD), (W - PAD - MARK, H - PAD - MARK), (PAD, H - PAD - MARK)]:
        img[y:y + MARK, x:x + MARK] = 0
    pil = Image.fromarray(img)
    d = ImageDraw.Draw(pil)
    lf = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 34)
    rf = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 120)
    for ch, c in L["cells"].items():
        d.rectangle([c["boxX"], c["boxY"], c["boxX"] + c["boxW"], c["boxY"] + c["boxH"]], outline=205, width=3)
        d.line([c["boxX"] + 20, c["baseline"], c["boxX"] + c["boxW"] - 20, c["baseline"]], fill=205, width=3)
        d.line([c["boxX"] + 20, c["xheight"], c["boxX"] + c["boxW"] - 20, c["xheight"]], fill=220, width=2)
        d.text((c["boxX"] + 14, c["boxY"] + 6), ch, font=lf, fill=60)
        cx = c["boxX"] + c["boxW"] // 2
        if c["anchor"] == "xheight-top":
            d.text((cx, c["xheight"]), ch, font=rf, fill=228, anchor="ms")
        elif c["anchor"] == "middle":
            d.text((cx, (c["baseline"] + c["xheight"]) // 2), ch, font=rf, fill=228, anchor="mm")
        else:
            d.text((cx, c["baseline"]), ch, font=rf, fill=228, anchor="ms")
    return np.array(pil)


def write_chars(page, ink=20, wobble=14, seed=7):
    """按各字符的真实排版位置书写：句逗贴基线、引号悬于 x-height 上、破折号居中"""
    random.seed(seed); np.random.seed(seed)
    pil = Image.fromarray(page.copy())
    for ch, c in L["cells"].items():
        size = int(c["h"] * random.uniform(0.55, 0.7))
        f = ImageFont.truetype(FONT, size)
        tile = Image.new("L", (c["w"], c["h"] + 80), 255)
        td = ImageDraw.Draw(tile)
        # tile 顶部对应模板的 c["y"]，基线在 tile 内的相对位置
        base_rel = c["baseline"] - c["y"]
        xh_rel = c["xheight"] - c["y"]
        cx = c["w"] // 2
        if c["anchor"] == "xheight-top":
            td.text((cx, xh_rel), ch, font=f, fill=ink, anchor="ms")
        elif c["anchor"] == "middle":
            td.text((cx, (base_rel + xh_rel) // 2), ch, font=f, fill=ink, anchor="mm")
        else:
            td.text((cx, base_rel), ch, font=f, fill=ink, anchor="ms")

        a = np.array(tile, np.float32)
        dx = gaussian_filter(np.random.rand(*a.shape) * 2 - 1, 6) * 12
        dy = gaussian_filter(np.random.rand(*a.shape) * 2 - 1, 6) * 12
        yy, xx = np.meshgrid(np.arange(a.shape[0]), np.arange(a.shape[1]), indexing="ij")
        wv = map_coordinates(a, [np.clip(yy + dy, 0, a.shape[0] - 1), np.clip(xx + dx, 0, a.shape[1] - 1)], order=1)
        lw = Image.fromarray(wv.astype(np.uint8))
        pil.paste(Image.new("L", lw.size, ink), (c["x"], c["y"] + random.randint(-wobble, wobble)),
                  mask=Image.fromarray((255 - np.array(lw)).astype(np.uint8)))
    return np.array(pil)


def shoot(written, dst, gradx=.25, grady=-.2, noise=6, blur=3, q=82, scale=1.0, rot=0):
    h, w = written.shape
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = np.float32(dst)
    if rot:
        cx, cy = w / 2, h / 2
        a = np.deg2rad(rot); ca, sa = np.cos(a), np.sin(a)
        dst = np.float32([[cx + ((x - cx) * ca - (y - cy) * sa) * .78,
                           cy + ((x - cx) * sa + (y - cy) * ca) * .78] for x, y in dst])
    photo = cv2.warpPerspective(written, cv2.getPerspectiveTransform(src, dst), (w, h), borderValue=140)
    gy, gx = np.mgrid[0:h, 0:w]
    photo = np.clip(photo.astype(np.float32) * (1 + gradx * (gx / w) + grady * (gy / h))
                    + np.random.normal(0, noise, (h, w)), 0, 255).astype(np.uint8)
    if blur > 1:
        k = blur if blur % 2 else blur + 1
        photo = cv2.GaussianBlur(photo, (k, k), 0)
    if scale != 1.0:
        photo = cv2.resize(photo, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    return photo


if __name__ == "__main__":
    tpl = build_template()
    cv2.imwrite("scripts/fixtures/template76.png", tpl)
    mild = [[180, 120], [W - 90, 220], [W - 160, H - 100], [70, H - 190]]
    hard = [[420, 260], [W - 150, 90], [W - 380, H - 240], [110, H - 120]]
    cases = {
        "76_baseline":   dict(ink=20,  dst=mild, blur=3),
        "76_faint":      dict(ink=125, dst=mild, blur=3),
        "76_hard":       dict(ink=90,  dst=hard, blur=11, gradx=.6, grady=-.45, noise=14, q=60, scale=.75, rot=10),
    }
    cache = {}
    for name, cfg in cases.items():
        ink = cfg.pop("ink")
        if ink not in cache:
            cache[ink] = write_chars(tpl, ink=ink)
        q = cfg.pop("q", 82)
        photo = shoot(cache[ink], **cfg)
        cv2.imwrite(f"scripts/fixtures/{name}.jpg", photo, [cv2.IMWRITE_JPEG_QUALITY, q])
        print(f"{name:14s} {photo.shape[1]}x{photo.shape[0]}")
