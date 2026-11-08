"""
Seed data generator for the single-parent community project.
All data is FAKE. Run:  python scripts/seed_user_data.py
Outputs: families.json and families.csv in data/.
"""
import csv
import json
import random

random.seed(42)  # same output every run, so the whole team shares identical data

N_FAMILIES = 30

# Made-up neighbourhoods with fake Canadian-format postal prefixes (FSAs).
# Swap in real local neighbourhoods if you want the demo to feel closer to home.
NEIGHBOURHOODS = {
    "Maple Hollow": ["T2A", "T2B"],
    "Riverbend": ["T2C", "T2E"],
    "Cedar Ridge": ["T3A", "T3B"],
    "Parkview": ["T2H", "T2J"],
    "Lakeside": ["T3C", "T3E"],
}

# Weights per neighbourhood so some pods are denser (makes matching more interesting)
NEIGHBOURHOOD_WEIGHTS = [0.28, 0.24, 0.18, 0.18, 0.12]

CHILD_AGE_RANGES = ["0-2", "3-5", "6-9", "10-13", "14-17"]

# Options for each child's gender (optional field)
CHILD_GENDERS = ["Girl", "Boy", "Non-binary", "Prefer not to say"]
CHILD_GENDER_WEIGHTS = [0.48, 0.48, 0.02, 0.02]

# Options for the "parent's gender" field (used for support-group preferences)
GENDERS = ["Woman", "Man", "Non-binary", "Prefer not to say"]
GENDER_WEIGHTS = [0.78, 0.17, 0.02, 0.03]  # single-parent households skew toward mothers

# Display names are first name + last initial only (privacy-friendly demo)
FIRST_NAMES = [
    "Maria", "Priya", "Sam", "Aisha", "Daniel", "Chloe", "Jamal", "Mei",
    "Fatima", "Liam", "Sofia", "Omar", "Hannah", "Diego", "Nadia", "Ben",
    "Tasha", "Kenji", "Leila", "Marcus", "Grace", "Andre", "Yuna", "Rosa",
    "Ethan", "Amara", "Noor", "Colin", "Bianca", "Tariq",
]
LAST_INITIALS = list("ABCDEFGHJKLMNPRSTW")

# Chance an optional field is left blank (shows the app handles missing data)
P_MISSING_AGES = 0.10
P_MISSING_CHILD_GENDERS = 0.20  # applied on top of missing ages


def fake_postal_code(prefix: str) -> str:
    """Build a made-up postal code like 'T2A 4K7' (letter-digit-letter digit-letter-digit)."""
    letters = "ABCEGHJKLMNPRSTVWXYZ"
    return f"{prefix} {random.randint(1, 9)}{random.choice(letters)}{random.randint(1, 9)}"


def make_children() -> tuple[list[str] | None, list[str] | None]:
    """
    Returns (age_ranges, genders). Both are lists in the SAME ORDER, so
    children_genders[i] is the gender of the child in children_age_ranges[i].
    Either (or both) can be None because both fields are optional.
    Genders are only generated when ages exist, so the lists always line up.
    """
    if random.random() < P_MISSING_AGES:
        return None, None
    n_kids = random.choices([1, 2, 3], weights=[0.45, 0.40, 0.15])[0]
    ages = random.sample(CHILD_AGE_RANGES, k=min(n_kids, len(CHILD_AGE_RANGES)))
    ages = sorted(ages, key=CHILD_AGE_RANGES.index)
    if random.random() < P_MISSING_CHILD_GENDERS:
        return ages, None
    genders = random.choices(CHILD_GENDERS, weights=CHILD_GENDER_WEIGHTS, k=len(ages))
    return ages, genders


def make_family(i: int, name: str) -> dict:
    hood = random.choices(list(NEIGHBOURHOODS), weights=NEIGHBOURHOOD_WEIGHTS)[0]
    prefix = random.choice(NEIGHBOURHOODS[hood])
    ages, genders = make_children()
    return {
        "id": f"fam_{i:03d}",
        "display_name": f"{name} {random.choice(LAST_INITIALS)}.",
        "neighbourhood": hood,
        "postal_code": fake_postal_code(prefix),
        "children_age_ranges": ages,      # optional
        "children_genders": genders,      # optional, same order as ages
        "parent_gender": random.choices(GENDERS, weights=GENDER_WEIGHTS)[0],
    }


def main() -> None:
    names = random.sample(FIRST_NAMES, k=N_FAMILIES)
    families = [make_family(i + 1, n) for i, n in enumerate(names)]

    with open("data/families.json", "w") as f:
        json.dump(families, f, indent=2)

    with open("data/families.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(families[0].keys()))
        writer.writeheader()
        for fam in families:
            row = dict(fam)
            # CSV can't hold lists, so join list fields with a pipe
            for key in ("children_age_ranges", "children_genders"):
                row[key] = "|".join(fam[key]) if fam[key] else ""
            writer.writerow(row)

    print(f"Wrote {len(families)} fake families to families.json and families.csv")


if __name__ == "__main__":
    main()