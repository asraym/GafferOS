class FeatureBuilder:

    # Must match training schema exactly when ML is added in Phase 2
    FEATURE_KEYS = [
        "offensive_strength_index",
        "defensive_vulnerability_index",
        "transition_intensity_score",
        "fatigue_risk_score",
        "tactical_stability_score",
        "opponent_strength_index",
        "form_score",
        "opponent_form_score",
    ]

    def build(self, data: dict) -> dict:
        """Returns only the ML feature vector from enriched data."""
        return {key: data.get(key, 0.0) for key in self.FEATURE_KEYS}

    def to_list(self, data: dict) -> list:
        """Returns features as ordered list for scikit-learn."""
        features = self.build(data)
        return [features[k] for k in self.FEATURE_KEYS]