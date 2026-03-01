BROAD_TO_SPECIFIC = {
    "GK":  ["GK"],
    "DEF": ["CB", "RB", "LB", "RWB", "LWB"],
    "MID": ["CDM", "CM", "CAM", "RM", "LM"],
    "FWD": ["RW", "LW", "ST", "CF", "SS"],
}

FORMATION_SLOTS = {
    "4-3-3":   {"GK": 1, "DEF": 4, "MID": 3, "FWD": 3},
    "4-2-3-1": {"GK": 1, "DEF": 4, "MID": 5, "FWD": 1},
    "4-4-2":   {"GK": 1, "DEF": 4, "MID": 4, "FWD": 2},
    "4-5-1":   {"GK": 1, "DEF": 4, "MID": 5, "FWD": 1},
    "5-4-1":   {"GK": 1, "DEF": 5, "MID": 4, "FWD": 1},
}


class SquadSelector:

    def select(self, data: dict) -> dict:
        players = data.get("players", [])
        formation = data.get("recommended_formation", "4-3-3")

        if not players:
            data["starting_xi"] = []
            data["bench"] = []
            return data

        # Convert all players to plain dicts with string values
        player_dicts = []
        for p in players:
            if hasattr(p, "dict"):
                d = p.dict()
            else:
                d = dict(p)
            # Convert enums to strings
            for key, val in d.items():
                if hasattr(val, "value"):
                    d[key] = val.value
            player_dicts.append(d)

        slots = FORMATION_SLOTS.get(formation, {"GK": 1, "DEF": 4, "MID": 3, "FWD": 3})
        available = [p for p in player_dicts if p.get("available", True)]

        starting_xi, used_names = self._fill_xi(available, slots)
        bench = [p for p in available if p.get("name") not in used_names]

        data["starting_xi"] = starting_xi
        data["bench"] = bench
        return data

    def _fill_xi(self, available: list, slots: dict):
        starting_xi = []
        used_names = set()

        for broad, count in slots.items():
            selected = self._pick_for_position(available, broad, count, used_names)
            for p in selected:
                p_copy = dict(p)
                p_copy["slot_broad"] = broad
                starting_xi.append(p_copy)
                used_names.add(p.get("name"))

        return starting_xi, used_names

    def _pick_for_position(self, available: list, broad: str, count: int, used_names: set) -> list:
        candidates = []

        # Pass 1 — primary position match
        for p in available:
            if p.get("name") in used_names:
                continue
            if p.get("position") == broad:
                candidates.append(p)

        # Pass 2 — secondary position covers this broad category
        if len(candidates) < count:
            specific_options = BROAD_TO_SPECIFIC.get(broad, [])
            for p in available:
                if p.get("name") in used_names:
                    continue
                if p in candidates:
                    continue
                if p.get("secondary_position") in specific_options:
                    candidates.append(p)

        # Pass 3 — any available player as last resort
        if len(candidates) < count:
            for p in available:
                if p.get("name") in used_names:
                    continue
                if p in candidates:
                    continue
                candidates.append(p)

        # Sort by fitness descending
        candidates.sort(key=lambda p: p.get("fitness_score") or 0.0, reverse=True)

        return candidates[:count]