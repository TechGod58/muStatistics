#!/usr/bin/env python3
import argparse
import datetime as dt
import json
import math
import os
from typing import Any, Dict, List

import pandas as pd
import pyreadstat
from pyreadstat.pyclasses import MissingRange

META_NOTE_PREFIX = "muStatistics::dataset_meta::"


def _is_nullish(value: Any) -> bool:
    if value is None:
        return True
    try:
        if pd.isna(value):
            return True
    except Exception:
        pass
    return False


def _normalize_scalar(value: Any) -> Any:
    if _is_nullish(value):
        return None
    if isinstance(value, (bool,)):
        return bool(value)
    if isinstance(value, (int,)):
        return int(value)
    if isinstance(value, (float,)):
        if math.isnan(value) or math.isinf(value):
            return None
        return float(value)
    if isinstance(value, (dt.datetime, dt.date, dt.time, pd.Timestamp)):
        return value.isoformat()
    return str(value)


def _decode_meta_note(notes: List[str] | None) -> Dict[str, Any]:
    for note in notes or []:
        text = str(note or "").strip()
        if not text.startswith(META_NOTE_PREFIX):
            continue
        payload = text[len(META_NOTE_PREFIX):].strip()
        if not payload:
            continue
        try:
            parsed = json.loads(payload)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            continue
    return {}


def _encode_meta_note(weight_field: str | None, split_fields: List[str]) -> str | None:
    normalized_weight = str(weight_field).strip() if isinstance(weight_field, str) and str(weight_field).strip() else None
    normalized_split = [str(item).strip() for item in split_fields if str(item).strip()]
    if not normalized_weight and len(normalized_split) == 0:
        return None
    payload = json.dumps(
        {
            "weightField": normalized_weight,
            "splitFields": normalized_split
        },
        ensure_ascii=False,
        separators=(",", ":")
    )
    return f"{META_NOTE_PREFIX}{payload}"


def _normalize_variable_value_labels(value_labels: Dict[str, Dict[Any, str]]) -> Dict[str, List[Dict[str, Any]]]:
    result: Dict[str, List[Dict[str, Any]]] = {}
    for field_name, labels in value_labels.items():
        entries: List[Dict[str, Any]] = []
        for raw_value, raw_label in labels.items():
            value = _normalize_scalar(raw_value)
            label = str(raw_label) if raw_label is not None else ""
            entries.append({"value": value, "label": label})
        result[field_name] = entries
    return result


def _normalize_missing_ranges(missing_ranges: Dict[str, List[Dict[str, Any]]]) -> Dict[str, List[Dict[str, Any]]]:
    result: Dict[str, List[Dict[str, Any]]] = {}
    for field_name, ranges in missing_ranges.items():
        entries: List[Dict[str, Any]] = []
        for item in ranges or []:
            lo = _normalize_scalar(item.get("lo"))
            hi = _normalize_scalar(item.get("hi"))
            entries.append({"lo": lo, "hi": hi})
        result[field_name] = entries
    return result


def _normalize_missing_user_values(missing_values: Dict[str, List[Any]]) -> Dict[str, List[Any]]:
    result: Dict[str, List[Any]] = {}
    for field_name, values in missing_values.items():
        entries = [_normalize_scalar(value) for value in values or []]
        result[field_name] = [value for value in entries if value is not None]
    return result


def _read_spss(input_path: str, output_path: str) -> None:
    dataframe, metadata = pyreadstat.read_sav(
        input_path,
        apply_value_formats=False,
        user_missing=True
    )

    columns = [str(column) for column in dataframe.columns]
    records: List[Dict[str, Any]] = []
    for row in dataframe.itertuples(index=False, name=None):
        record: Dict[str, Any] = {}
        for index, field_name in enumerate(columns):
            value = row[index] if index < len(row) else None
            record[field_name] = _normalize_scalar(value)
        records.append(record)

    note_metadata = _decode_meta_note(getattr(metadata, "notes", None))

    payload = {
        "rows": records,
        "metadata": {
            "columnNames": columns,
            "columnLabels": dict(getattr(metadata, "column_names_to_labels", {}) or {}),
            "variableMeasure": dict(getattr(metadata, "variable_measure", {}) or {}),
            "variableValueLabels": _normalize_variable_value_labels(dict(getattr(metadata, "variable_value_labels", {}) or {})),
            "missingRanges": _normalize_missing_ranges(dict(getattr(metadata, "missing_ranges", {}) or {})),
            "missingUserValues": _normalize_missing_user_values(dict(getattr(metadata, "missing_user_values", {}) or {})),
            "fileLabel": getattr(metadata, "file_label", None),
            "notes": [str(item) for item in (getattr(metadata, "notes", []) or [])],
            "weightField": note_metadata.get("weightField"),
            "splitFields": note_metadata.get("splitFields", [])
        }
    }

    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False)


def _coerce_dataframe_cell(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, bool):
        return bool(value)
    if isinstance(value, (int, float)):
        if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
            return None
        return value
    text = str(value)
    if text.strip() == "":
        return None
    return text


def _to_missing_range_item(item: Dict[str, Any]) -> MissingRange | Any:
    lo = item.get("lo")
    hi = item.get("hi")
    if lo is None and hi is None:
        return None
    if lo is None:
        return hi
    if hi is None:
        return lo
    return MissingRange(lo=lo, hi=hi)


def _write_spss(input_path: str, output_path: str, export_format: str) -> None:
    with open(input_path, "r", encoding="utf-8") as handle:
        payload = json.load(handle)

    rows = payload.get("rows", [])
    field_order = payload.get("fieldOrder", [])
    if not isinstance(rows, list):
        raise ValueError("rows must be an array.")
    if not isinstance(field_order, list) or len(field_order) == 0:
        raise ValueError("fieldOrder must be a non-empty array.")

    normalized_rows: List[Dict[str, Any]] = []
    for raw_row in rows:
        row_obj = raw_row if isinstance(raw_row, dict) else {}
        normalized_row = {str(field): _coerce_dataframe_cell(row_obj.get(field)) for field in field_order}
        normalized_rows.append(normalized_row)

    dataframe = pd.DataFrame.from_records(normalized_rows, columns=[str(field) for field in field_order])

    column_labels_raw = payload.get("columnLabels", {})
    column_labels = {
        str(field): str(label)
        for field, label in (column_labels_raw.items() if isinstance(column_labels_raw, dict) else [])
        if str(field).strip() and label is not None and str(label).strip()
    }

    value_labels_raw = payload.get("valueLabels", {})
    variable_value_labels: Dict[str, Dict[Any, str]] = {}
    if isinstance(value_labels_raw, dict):
        for field_name, entries in value_labels_raw.items():
            if not str(field_name).strip() or not isinstance(entries, list):
                continue
            mapping: Dict[Any, str] = {}
            for entry in entries:
                if not isinstance(entry, dict):
                    continue
                label = entry.get("label")
                if label is None or str(label).strip() == "":
                    continue
                value = entry.get("value")
                mapping[value] = str(label)
            if len(mapping) > 0:
                variable_value_labels[str(field_name)] = mapping

    missing_values_raw = payload.get("missingValues", {})
    missing_ranges_raw = payload.get("missingRanges", {})
    missing_ranges: Dict[str, List[Any]] = {}
    if isinstance(missing_values_raw, dict):
        for field_name, values in missing_values_raw.items():
            if not str(field_name).strip() or not isinstance(values, list):
                continue
            entries = [value for value in values if value is not None]
            if len(entries) > 0:
                missing_ranges[str(field_name)] = entries

    if isinstance(missing_ranges_raw, dict):
        for field_name, ranges in missing_ranges_raw.items():
            if not str(field_name).strip() or not isinstance(ranges, list):
                continue
            converted = []
            for item in ranges:
                if not isinstance(item, dict):
                    continue
                range_item = _to_missing_range_item(item)
                if range_item is not None:
                    converted.append(range_item)
            if len(converted) > 0:
                existing = missing_ranges.get(str(field_name), [])
                missing_ranges[str(field_name)] = [*existing, *converted]

    variable_measure_raw = payload.get("variableMeasure", {})
    variable_measure = {
        str(field): str(measure)
        for field, measure in (variable_measure_raw.items() if isinstance(variable_measure_raw, dict) else [])
        if str(field).strip() and str(measure).strip() in {"nominal", "ordinal", "scale", "unknown"}
    }

    raw_notes = payload.get("notes", [])
    notes = [str(item) for item in raw_notes if isinstance(item, (str, int, float)) and str(item).strip()]
    weight_field_raw = payload.get("weightField")
    split_fields_raw = payload.get("splitFields", [])
    split_fields = [str(item).strip() for item in split_fields_raw if isinstance(item, (str, int, float)) and str(item).strip()]
    encoded_meta_note = _encode_meta_note(
        str(weight_field_raw).strip() if isinstance(weight_field_raw, str) else None,
        split_fields
    )
    if encoded_meta_note:
        notes = [note for note in notes if not note.startswith(META_NOTE_PREFIX)]
        notes.append(encoded_meta_note)

    file_label_raw = payload.get("fileLabel")
    file_label = str(file_label_raw).strip() if isinstance(file_label_raw, str) else ""
    compress = export_format.lower() == "zsav"

    pyreadstat.write_sav(
        dataframe,
        output_path,
        file_label=file_label,
        column_labels=column_labels or None,
        compress=compress,
        note=notes or None,
        variable_value_labels=variable_value_labels or None,
        missing_ranges=missing_ranges or None,
        variable_measure=variable_measure or None
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="muStatistics SPSS bridge")
    subparsers = parser.add_subparsers(dest="command", required=True)

    read_parser = subparsers.add_parser("read", help="Read SAV/ZSAV into JSON")
    read_parser.add_argument("--input", required=True)
    read_parser.add_argument("--output", required=True)

    write_parser = subparsers.add_parser("write", help="Write SAV/ZSAV from JSON")
    write_parser.add_argument("--input", required=True)
    write_parser.add_argument("--output", required=True)
    write_parser.add_argument("--format", required=True, choices=["sav", "zsav"])

    args = parser.parse_args()
    if args.command == "read":
        _read_spss(args.input, args.output)
        return 0
    if args.command == "write":
        _write_spss(args.input, args.output, args.format)
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
