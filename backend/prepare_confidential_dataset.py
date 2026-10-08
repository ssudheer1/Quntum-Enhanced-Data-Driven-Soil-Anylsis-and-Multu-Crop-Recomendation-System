"""
Prepare a private farmer soil-test file for local ML validation.

Usage:
1. Put the private CSV/XLSX file somewhere outside version control.
2. Change INPUT_FILE below to its filename/path.
3. Run: python prepare_confidential_dataset.py

The source file is never modified. The output contains no names, phone
numbers, addresses, QR names, or survey numbers.
"""

from pathlib import Path
import re
import sys

import numpy as np
import pandas as pd


# Change only this value. Absolute paths are recommended for confidential files.
INPUT_FILE = r"C:\PrivateFarmData\your_confidential_file.xlsx"
OUTPUT_FILE = r"C:\PrivateFarmData\farmer_soil_cleaned.csv"


def normalized_name(value):
    """Make column names comparable despite spaces, punctuation, or case."""
    return re.sub(r"[^a-z0-9]", "", str(value).strip().lower())


ALIASES = {
    "test_id": ["testid", "test_id", "sampleid", "sample_id", "id"],
    "state": ["state"],
    "district": ["district"],
    "village": ["village", "voillage"],
    "block": ["block", "mandal"],
    "latitude": ["latitude", "lat"],
    "longitude": ["longitude", "lon", "lng"],
    "crop_details": ["crop", "cropdetails", "cropname", "cropinformation"],
    "ph": ["ph", "soilph"],
    "ec": ["ec", "electricalconductivity"],
    "oc": ["oc", "organiccarbon"],
    "n": ["n", "nitrogen"],
    "p": ["p", "phosphorus"],
    "k": ["k", "potassium"],
    "s": ["s", "sulphur", "sulfur"],
    "b": ["b", "boron"],
    "zn": ["zn", "zinc"],
    "fe": ["fe", "iron"],
    "mn": ["mn", "manganese"],
    "cu": ["cu", "copper"],
    "area": ["area", "landarea", "lotarea"],
    "sample_collection_date": [
        "samplecollectiondate", "sampledate", "collectiondate"
    ],
    "test_completion_date": [
        "testcompletiondate", "completiondate", "resultdate"
    ],
    "temperature": ["temperature", "temp"],
    "humidity": ["humidity"],
    "rainfall": ["rainfall", "rain"],
}


PRIVATE_COLUMNS = {
    "farmer", "farmername", "name", "phone", "mobilenumber", "mobile",
    "address", "qrname", "qrcode", "surveynumber", "survey no", "survey_no",
}

NUMERIC_COLUMNS = [
    "latitude", "longitude", "ph", "ec", "oc", "n", "p", "k", "s", "b",
    "zn", "fe", "mn", "cu", "area", "temperature", "humidity", "rainfall",
]

OUTPUT_COLUMNS = [
    "test_id", "state", "district", "village", "block", "latitude", "longitude",
    "crop_name", "days_to_grow", "crop_type", "irrigation_type", "season",
    "ph", "ec", "oc", "n", "p", "k", "s", "b", "zn", "fe", "mn", "cu",
    "area", "sample_collection_date", "test_completion_date", "temperature",
    "humidity", "rainfall",
]


def read_source(path):
    if not path.exists():
        raise FileNotFoundError(f"Input file was not found: {path}")
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)
    if path.suffix.lower() in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    raise ValueError("Use a .csv, .xlsx, or .xls input file")


def rename_known_columns(frame):
    lookup = {normalized_name(column): column for column in frame.columns}
    renamed = {}
    used_sources = set()

    for target, aliases in ALIASES.items():
        for alias in aliases:
            source = lookup.get(normalized_name(alias))
            if source is not None and source not in used_sources:
                renamed[source] = target
                used_sources.add(source)
                break

    return frame.rename(columns=renamed)


def parse_crop_details(value):
    """Parse values such as 'Paddy / 120 days / Rice / Irrigated / Kharif'."""
    if pd.isna(value):
        return pd.Series([np.nan, np.nan, np.nan, np.nan, np.nan])

    parts = [part.strip() for part in re.split(r"\s*/\s*", str(value)) if part.strip()]
    crop_name = parts[0] if parts else np.nan
    days_to_grow = np.nan
    days_index = None

    for index, part in enumerate(parts):
        match = re.search(r"(\d+(?:\.\d+)?)\s*(?:days?|day)?", part, re.IGNORECASE)
        if match and ("day" in part.lower() or index == 1):
            days_to_grow = float(match.group(1))
            days_index = index
            break

    remaining = [part for index, part in enumerate(parts) if index not in {0, days_index}]
    crop_type = remaining[0] if len(remaining) > 0 else np.nan
    irrigation_type = remaining[1] if len(remaining) > 1 else np.nan
    season = remaining[2] if len(remaining) > 2 else np.nan

    return pd.Series([crop_name, days_to_grow, crop_type, irrigation_type, season])


def clean_dataset(frame):
    frame = frame.copy()
    frame.columns = [str(column).strip() for column in frame.columns]

    # Remove personal fields before any output is written.
    private_matches = {
        column for column in frame.columns if normalized_name(column) in PRIVATE_COLUMNS
    }
    frame = frame.drop(columns=list(private_matches), errors="ignore")
    frame = rename_known_columns(frame)

    required = {"test_id", "ph", "n", "p", "k"}
    missing = sorted(required - set(frame.columns))
    if missing:
        raise ValueError(
            "Required columns were not found after cleanup: " + ", ".join(missing)
        )

    if "crop_details" in frame.columns:
        parsed = frame["crop_details"].apply(parse_crop_details)
        parsed.columns = [
            "crop_name", "days_to_grow", "crop_type", "irrigation_type", "season"
        ]
        frame = pd.concat([frame.drop(columns=["crop_details"]), parsed], axis=1)

    for column in NUMERIC_COLUMNS + ["days_to_grow"]:
        if column in frame.columns:
            frame[column] = pd.to_numeric(frame[column], errors="coerce")

    for column in ["sample_collection_date", "test_completion_date"]:
        if column in frame.columns:
            frame[column] = pd.to_datetime(frame[column], errors="coerce").dt.strftime("%Y-%m-%d")

    for column in frame.select_dtypes(include="object").columns:
        frame[column] = frame[column].astype("string").str.strip()
        frame[column] = frame[column].replace({"": pd.NA, "nan": pd.NA, "None": pd.NA})

    frame = frame.drop_duplicates(subset=["test_id"], keep="first")
    frame = frame.dropna(subset=["test_id", "ph", "n", "p", "k"])
    frame = frame[(frame["ph"] >= 0) & (frame["ph"] <= 14)]

    for column in OUTPUT_COLUMNS:
        if column not in frame.columns:
            frame[column] = pd.NA

    return frame[OUTPUT_COLUMNS].reset_index(drop=True)


def main():
    source_path = Path(INPUT_FILE)
    output_path = Path(OUTPUT_FILE)
    source = read_source(source_path)
    cleaned = clean_dataset(source)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cleaned.to_csv(output_path, index=False)

    print(f"Source rows: {len(source)}")
    print(f"Clean rows:  {len(cleaned)}")
    print(f"Output:      {output_path}")
    print("Personal identifiers were excluded from the output.")
    missing_weather = [
        column for column in ["temperature", "humidity", "rainfall"]
        if cleaned[column].isna().all()
    ]
    if missing_weather:
        print("Warning: add weather values before using the existing crop model: "
              + ", ".join(missing_weather))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)