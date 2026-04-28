from __future__ import annotations

import argparse
import json
import math
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


def _now_ms() -> int:
    return int(time.time() * 1000)


def _safe_float(value: Any, fallback: float = 0.0) -> float:
    try:
        parsed = float(value)
        if math.isfinite(parsed):
            return parsed
    except Exception:
        pass
    return fallback


def _bounded(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9][a-zA-Z0-9_\-']*", (text or "").lower())


class ParallelCubedRuntime:
    def __init__(self, genome_path: Path) -> None:
        self._lock = threading.RLock()
        self.genome_path = genome_path
        self.version = "1.0"
        self.regions: list[str] = []
        self.synapses: dict[str, dict[str, float]] = {}
        self.bindings: dict[str, list[str]] = {}
        self.params: dict[str, Any] = {}
        self.state_energy: dict[str, float] = {}
        self.last_recall_at: int | None = None
        self.recall_count = 0
        self.reload_genome()

    def reload_genome(self) -> None:
        with self._lock:
            payload = json.loads(self.genome_path.read_text(encoding="utf-8"))
            self.version = str(payload.get("meta", {}).get("version", "1.0"))
            self.regions = [str(item.get("id", "")).strip() for item in payload.get("regions", []) if str(item.get("id", "")).strip()]
            self.synapses = {}
            for edge in payload.get("synapses", []):
                src = str(edge.get("src", "")).strip()
                dst = str(edge.get("dst", "")).strip()
                if not src or not dst:
                    continue
                self.synapses.setdefault(src, {})[dst] = _bounded(_safe_float(edge.get("w"), 0.0), 0.0, 2.0)
            self.bindings = {
                str(region): [str(name) for name in (engines or []) if str(name).strip()]
                for region, engines in (payload.get("bindings", {}) or {}).items()
            }
            self.params = payload.get("params", {}) or {}
            for region in self.regions:
                self.state_energy.setdefault(region, 0.0)

    def _activate_regions(self, seed_region: str) -> list[str]:
        spread = _bounded(_safe_float(self.params.get("spread"), 0.55), 0.0, 1.0)
        max_active = int(_safe_float(self.params.get("max_active_regions"), 3))
        max_active = max(1, min(12, max_active))
        seed = seed_region if seed_region in self.regions else (self.regions[0] if self.regions else "memory")
        neighbors = sorted(
            (self.synapses.get(seed, {}) or {}).items(),
            key=lambda item: item[1],
            reverse=True
        )
        active = [seed]
        for neighbor, weight in neighbors:
            if len(active) >= max_active:
                break
            if spread <= 0:
                break
            if _safe_float(weight) * spread <= 0.05:
                continue
            active.append(neighbor)
        return active

    def _region_score(
        self,
        region: str,
        query_text: str,
        query_tokens: list[str],
        segments: list[dict[str, Any]]
    ) -> dict[str, float]:
        scores: dict[str, float] = {}
        query_text_normalized = query_text.lower().strip()
        token_set = set(query_tokens)
        for segment in segments:
            segment_id = str(segment.get("id", "")).strip()
            text = str(segment.get("text", ""))
            if not segment_id or not text:
                continue
            text_lower = text.lower()
            text_tokens = set(_tokenize(text))
            overlap = len(token_set & text_tokens)
            overlap_ratio = overlap / max(1, len(token_set))
            phrase_bonus = 0.0
            if query_text_normalized and query_text_normalized in text_lower:
                phrase_bonus = 0.6
            code_hint_bonus = 0.0
            if segment.get("codeCount", 0):
                code_hint_bonus = min(0.2, float(segment.get("codeCount", 0)) * 0.015)

            if region == "logic":
                score = (overlap_ratio * 0.9) + phrase_bonus + (code_hint_bonus * 0.7)
            elif region == "memory":
                score = (overlap_ratio * 1.1) + (phrase_bonus * 0.7) + code_hint_bonus
            elif region == "emotion":
                sentiment_hint = 0.12 if re.search(r"\b(concern|risk|issue|trust|fair|harm|safe|bias)\b", text_lower) else 0.0
                score = (overlap_ratio * 0.7) + (phrase_bonus * 0.5) + sentiment_hint + (code_hint_bonus * 0.4)
            else:
                score = overlap_ratio + phrase_bonus + code_hint_bonus

            if score > 0:
                scores[segment_id] = score
        return scores

    def _autoadapt(self, seed_region: str, active_regions: list[str], feedback: float, entropy: float) -> dict[str, Any]:
        feedback = _bounded(feedback, -1.0, 1.0)
        entropy = _bounded(entropy, 0.0, 1.0)
        delta = 0.03 * feedback * (1.0 - entropy)
        for region in active_regions:
            self.state_energy[region] = _bounded(self.state_energy.get(region, 0.0) * 0.99 + (0.35 * (1.0 + feedback)), 0.0, 4.0)
        neighbors = self.synapses.get(seed_region, {})
        for dst, weight in list(neighbors.items()):
            neighbors[dst] = _bounded(weight + delta, 0.02, 1.8)
        return {
            "seed": seed_region,
            "feedback": feedback,
            "entropy": entropy,
            "delta": delta,
            "synapsesFromSeed": neighbors
        }

    def prefilter(self, payload: dict[str, Any]) -> dict[str, Any]:
        started = _now_ms()
        query_text = str(payload.get("query", "")).strip()
        query_tokens = _tokenize(query_text)
        if not query_tokens and query_text:
            query_tokens = [query_text.lower()]

        segments = payload.get("segments") if isinstance(payload.get("segments"), list) else []
        seed_region = str(payload.get("seedRegion", "memory")).strip() or "memory"
        top_k = int(_safe_float(payload.get("topK"), 250))
        top_k = max(20, min(5000, top_k))
        min_score = _bounded(_safe_float(payload.get("minScore"), 0.08), 0.0, 10.0)
        feedback = _bounded(_safe_float(payload.get("feedback"), 0.0), -1.0, 1.0)
        entropy = _bounded(_safe_float(payload.get("entropy"), 0.0), 0.0, 1.0)
        confidence = _bounded(_safe_float(payload.get("confidence"), 0.8), 0.0, 1.0)

        active_regions = self._activate_regions(seed_region)
        merged_scores: dict[str, float] = {}
        region_scores: dict[str, dict[str, float]] = {}

        max_workers = int(_safe_float(self.params.get("max_workers"), 4))
        max_workers = max(1, min(16, max_workers))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(self._region_score, region, query_text, query_tokens, segments): region
                for region in active_regions
            }
            for future in as_completed(futures):
                region = futures[future]
                scores = future.result()
                region_scores[region] = scores
                region_weight = 1.0 + _bounded(self.state_energy.get(region, 0.0), 0.0, 1.0)
                for segment_id, score in scores.items():
                    merged_scores[segment_id] = merged_scores.get(segment_id, 0.0) + (score * region_weight)

        ranked = sorted(
            ((segment_id, score) for segment_id, score in merged_scores.items() if score >= min_score),
            key=lambda item: item[1],
            reverse=True
        )
        top_ranked = ranked[:top_k]
        candidate_ids = [segment_id for segment_id, _ in top_ranked]
        adaptation = self._autoadapt(seed_region, active_regions, feedback, entropy)

        with self._lock:
            self.last_recall_at = _now_ms()
            self.recall_count += 1

        return {
            "candidateSegmentIds": candidate_ids,
            "scoredSegmentCount": len(merged_scores),
            "totalSegmentCount": len(segments),
            "activeRegions": active_regions,
            "seedRegion": seed_region,
            "topScores": [{"segmentId": seg_id, "score": score} for seg_id, score in top_ranked[:40]],
            "adaptation": adaptation,
            "confidence": confidence,
            "durationMs": _now_ms() - started
        }

    def status(self) -> dict[str, Any]:
        with self._lock:
            return {
                "ready": True,
                "genomePath": str(self.genome_path),
                "genomeVersion": self.version,
                "regions": self.regions,
                "params": self.params,
                "lastRecallAt": self.last_recall_at,
                "recallCount": self.recall_count,
                "energy": self.state_energy
            }


class QeccGuard:
    def __init__(self) -> None:
        self.default_p_logical_limit = 0.34
        self.default_error_rate_limit = 0.15
        self.default_retry_limit = 3
        self.default_duration_limit_s = 300.0
        self.default_load_limit = 0.92
        self.decision_count = 0
        self.last_decision_at: int | None = None

    def _syndrome(self, telemetry: dict[str, Any]) -> list[int]:
        error_rate = _bounded(_safe_float(telemetry.get("errorRate"), 0.0), 0.0, 1.0)
        retry_count = max(0, int(_safe_float(telemetry.get("retryCount"), 0.0)))
        duration_s = max(0.0, _safe_float(telemetry.get("durationSeconds"), 0.0))
        load = _bounded(_safe_float(telemetry.get("load"), 0.0), 0.0, 1.0)
        failed_stage = bool(telemetry.get("failedStage", False))

        return [
            1 if error_rate >= self.default_error_rate_limit else 0,
            1 if retry_count > self.default_retry_limit else 0,
            1 if duration_s > self.default_duration_limit_s else 0,
            1 if load > self.default_load_limit else 0,
            1 if failed_stage else 0
        ]

    def evaluate(self, payload: dict[str, Any]) -> dict[str, Any]:
        telemetry = payload.get("telemetry") if isinstance(payload.get("telemetry"), dict) else {}
        syndrome = self._syndrome(telemetry)
        ones = sum(1 for bit in syndrome if bit)
        p_logical = ones / max(1, len(syndrome))
        p_logical_limit = _bounded(_safe_float(payload.get("pLogicalLimit"), self.default_p_logical_limit), 0.0, 1.0)

        action = "continue"
        reason = "within guard thresholds"
        level = "normal"
        recovery_state = "steady"

        if p_logical > p_logical_limit:
            action = "halt"
            reason = "qecc guard exceeded p_logical limit"
            level = "critical"
            recovery_state = "halted"
        elif ones >= 2:
            action = "checkpoint"
            reason = "qecc guard requested checkpoint due to elevated risk"
            level = "elevated"
            recovery_state = "checkpointed"

        self.decision_count += 1
        self.last_decision_at = _now_ms()
        return {
            "decision": {
                "action": action,
                "reason": reason,
                "risk": round(p_logical, 6),
                "level": level,
                "recovery_state": recovery_state
            },
            "qecc": {
                "syndrome": syndrome,
                "ones": ones,
                "p_logical": p_logical,
                "p_logical_limit": p_logical_limit
            },
            "telemetryEcho": telemetry
        }

    def status(self) -> dict[str, Any]:
        return {
            "ready": True,
            "decisionCount": self.decision_count,
            "lastDecisionAt": self.last_decision_at,
            "defaultPolicy": {
                "pLogicalLimit": self.default_p_logical_limit,
                "errorRateLimit": self.default_error_rate_limit,
                "retryLimit": self.default_retry_limit,
                "durationLimitSeconds": self.default_duration_limit_s,
                "loadLimit": self.default_load_limit
            }
        }


class AxionSidecarService:
    def __init__(self, genome_path: Path) -> None:
        self.started_at = _now_ms()
        self.parallel_cubed = ParallelCubedRuntime(genome_path)
        self.qecc_guard = QeccGuard()

    def health(self) -> dict[str, Any]:
        return {
            "status": "ok",
            "startedAt": self.started_at,
            "uptimeMs": max(0, _now_ms() - self.started_at)
        }

    def status(self) -> dict[str, Any]:
        return {
            "status": "ok",
            "startedAt": self.started_at,
            "uptimeMs": max(0, _now_ms() - self.started_at),
            "parallelCubed": self.parallel_cubed.status(),
            "qecc": self.qecc_guard.status()
        }


def _json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    raw = json.dumps(payload, ensure_ascii=True).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(raw)))
    handler.end_headers()
    handler.wfile.write(raw)


def _parse_json_body(handler: BaseHTTPRequestHandler) -> dict[str, Any]:
    length = int(handler.headers.get("Content-Length", "0") or 0)
    if length <= 0:
        return {}
    data = handler.rfile.read(length)
    if not data:
        return {}
    parsed = json.loads(data.decode("utf-8"))
    return parsed if isinstance(parsed, dict) else {}


def build_handler(service: AxionSidecarService):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
            return None

        def do_GET(self) -> None:  # noqa: N802
            if self.path == "/health":
                _json_response(self, 200, {"ok": True, "health": service.health()})
                return
            if self.path == "/status":
                _json_response(self, 200, {"ok": True, "status": service.status()})
                return
            _json_response(self, 404, {"ok": False, "error": "not found"})

        def do_POST(self) -> None:  # noqa: N802
            try:
                body = _parse_json_body(self)
                if self.path == "/parallel-cubed/prefilter":
                    result = service.parallel_cubed.prefilter(body)
                    _json_response(self, 200, {"ok": True, "result": result})
                    return
                if self.path == "/parallel-cubed/reload":
                    service.parallel_cubed.reload_genome()
                    _json_response(self, 200, {"ok": True, "status": service.parallel_cubed.status()})
                    return
                if self.path == "/qecc/guard":
                    result = service.qecc_guard.evaluate(body)
                    _json_response(self, 200, {"ok": True, "result": result})
                    return
                _json_response(self, 404, {"ok": False, "error": "not found"})
            except Exception as error:
                _json_response(
                    self,
                    400,
                    {"ok": False, "error": str(error)}
                )

    return Handler


def main() -> None:
    parser = argparse.ArgumentParser(description="Axion Parallel Cubed + QECC sidecar")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8765, type=int)
    parser.add_argument("--genome", required=True)
    args = parser.parse_args()

    genome_path = Path(args.genome).resolve()
    if not genome_path.exists():
        raise FileNotFoundError(f"Genome file not found: {genome_path}")

    service = AxionSidecarService(genome_path=genome_path)
    handler = build_handler(service)
    server = ThreadingHTTPServer((args.host, args.port), handler)
    print(json.dumps({
        "event": "axion_sidecar_ready",
        "host": args.host,
        "port": args.port,
        "genome": str(genome_path)
    }), flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
