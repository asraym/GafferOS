class FormAnalyser:

    POINTS = {"W": 3, "D": 1, "L": 0}
    MAX_POINTS = 15  # 5 wins = max

    def analyse(self, data: dict) -> dict:
        results = data["last_5_results"]
        opp_results = data.get("opponent_last_5_results", ["D"] * 5)

        form_data = {
            "form_score": self._form_score(results),
            "opponent_form_score": self._form_score(opp_results),
            "momentum": self._momentum(results),
            "form_label": self._form_label(results),
        }

        return {**data, **form_data}

    # ── Form Score ─────────────────────────────────────────────
    def _form_score(self, results: list) -> float:
        """0.0 to 1.0 — overall recent form quality."""
        if not results:
            return 0.5
        pts = sum(self.POINTS.get(r, 1) for r in results)
        return round(pts / self.MAX_POINTS, 3)

    # ── Momentum ───────────────────────────────────────────────
    def _momentum(self, results: list) -> str:
        """
        Compares last 2 results vs first 3.
        Returns Rising, Falling or Stable.
        """
        if len(results) < 3:
            return "Stable"

        recent = sum(self.POINTS.get(r, 1) for r in results[-2:]) / 2
        earlier = sum(self.POINTS.get(r, 1) for r in results[:3]) / 3

        if recent > earlier + 0.5:
            return "Rising"
        elif recent < earlier - 0.5:
            return "Falling"
        return "Stable"

    # ── Form Label ─────────────────────────────────────────────
    def _form_label(self, results: list) -> str:
        """Human readable form string e.g. W W D L W"""
        return " ".join(results)