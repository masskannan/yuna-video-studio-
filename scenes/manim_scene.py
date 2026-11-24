from manim import *

class ProScene(Scene):
    def construct(self):
        title = Text("YUNA Pro Diagram", font_size=48, color=BLUE)
        box = SurroundingRectangle(title, color=YELLOW, buff=0.3)
        self.play(Write(title), Create(box))
        self.wait(1)
