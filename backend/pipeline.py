from core.schemas import MatchAnalysisRequest, TacticalReport
from core.input_validator import InputValidator
from core.metric_calculator import MetricCalculator
from core.form_analyser import FormAnalyser
from core.feature_builder import FeatureBuilder
from engine.formation_selector import FormationSelector
from engine.press_engine import PressEngine
from engine.mismatch_detector import MismatchDetector
from engine.rotation_advisor import RotationAdvisor
from engine.explainer import Explainer
from engine.squad_selector import SquadSelector


class TactIQPipeline:

    def __init__(self, ml_model=None):
        # Core
        self.validator = InputValidator()
        self.metrics = MetricCalculator()
        self.form = FormAnalyser()
        self.features = FeatureBuilder()

        # Engine
        self.formation = FormationSelector()
        self.press = PressEngine()
        self.mismatch = MismatchDetector()
        self.rotation = RotationAdvisor()
        self.explainer = Explainer()
        self.squad_selector = SquadSelector()

        # ML — None until Phase 2
        self.ml_model = ml_model

    def run(self, request: MatchAnalysisRequest) -> TacticalReport:

        # Step 1 — Validate
        data = self.validator.validate(request)

        # Step 2 — Calculate metrics
        data = self.metrics.calculate(data)

        # Step 3 — Analyse form
        data = self.form.analyse(data)

        # Step 4 — Tactical reasoning
        data = self.formation.select(data)
        data = self.press.recommend(data)
        data = self.mismatch.detect(data)

        # Step 5 - Auto-select best XI and bench
        data = self.squad_selector.select(data)

        #Step 6 - Rotation advice
        data = self.rotation.advise(data)

        # Step 7 — Build explanation
        data = self.explainer.explain(data)

        # Step 8 — ML prediction (Phase 2)
        win_prob = draw_prob = loss_prob = None
        if self.ml_model is not None:
            try:
                features = self.features.to_list(data)
                probs = self.ml_model.predict_proba([features])[0]
                loss_prob, draw_prob, win_prob = (
                    round(probs[0], 3),
                    round(probs[1], 3),
                    round(probs[2], 3),
                )
            except Exception as e:
                print(f"[ML] Prediction failed: {e}")

        # Step 9 — Return report
        return TacticalReport(
            team_name=data["team_name"],
            opponent_name=data["opponent_name"],
            tier_used=data["tier"],
            recommended_formation=data["recommended_formation"],
            press_intensity=data["press_intensity"],
            defensive_line=data["defensive_line"],
            tactical_focus=data["tactical_focus"],
            match_risk_level=data["match_risk_level"],
            rotation_suggestions=data.get("rotation_suggestions", []),
            win_probability=win_prob,
            draw_probability=draw_prob,
            loss_probability=loss_prob,
            offensive_strength_index=data["offensive_strength_index"],
            defensive_vulnerability_index=data["defensive_vulnerability_index"],
            fatigue_risk_score=data["fatigue_risk_score"],
            tactical_stability_score=data["tactical_stability_score"],
            reasoning=data["reasoning"],
        )