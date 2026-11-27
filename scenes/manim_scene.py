import json, os, textwrap
from manim import *

config.pixel_width = 540
config.pixel_height = 960
config.frame_width = 9.0
config.frame_height = 16.0
config.background_color = "#0B1120"

class ProScene(Scene):
    def construct(self):
        title_txt = "YUNA AI Explainer"
        sub_txt = "Smart Visual Breakdown"
        if os.path.exists("timeline.json"):
            tl = json.load(open("timeline.json", encoding="utf-8"))
            title_txt = str(tl.get("title") or title_txt)[:48]
        if os.path.exists("shot_list.json"):
            shots = json.load(open("shot_list.json", encoding="utf-8")).get("shots", [])
            ms = [s for s in shots if s.get("tool") == "manim"]
            if ms:
                sub_txt = str(ms[0].get("notes") or ms[0].get("line", {}).get("text") or sub_txt)[:72]

        t_wrap = "\n".join(textwrap.wrap(title_txt, 18)[:3])
        s_wrap = "\n".join(textwrap.wrap(sub_txt, 24)[:3])
        head = sub = None
        for fnt in ["Lohit Tamil", None]:
            try:
                kw = {"font": fnt} if fnt else {}
                head = Text(t_wrap, font_size=36, color=YELLOW, **kw)
                sub = Text(s_wrap, font_size=24, color=WHITE, **kw)
                break
            except Exception:
                head = sub = None
        if head is None:
            head = Text("YUNA AI DIAGRAM", font_size=36, color=YELLOW)
            sub = Text("2D Concept Flow", font_size=24, color=WHITE)

        head.move_to(UP * 3.2)
        box = SurroundingRectangle(head, color=BLUE, buff=0.35, corner_radius=0.2)
        n1 = RoundedRectangle(width=6.4, height=1.5, corner_radius=0.25, color=TEAL, fill_opacity=0.2).move_to(ORIGIN)
        sub.move_to(n1.get_center())
        arr = Arrow(box.get_bottom(), n1.get_top(), color=GOLD, buff=0.15)
        n2 = RoundedRectangle(width=5.6, height=1.2, corner_radius=0.25, color=PURPLE, fill_opacity=0.22).move_to(DOWN * 2.8)
        lbl2 = Text("YUNA Studio Engine", font_size=24, color=WHITE).move_to(n2.get_center())
        arr2 = Arrow(n1.get_bottom(), n2.get_top(), color=TEAL, buff=0.15)

        self.play(Write(head), Create(box), run_time=0.8)
        self.play(GrowArrow(arr), FadeIn(n1), Write(sub), run_time=0.9)
        self.play(GrowArrow(arr2), FadeIn(n2), Write(lbl2), run_time=0.8)
        self.wait(1.0)
