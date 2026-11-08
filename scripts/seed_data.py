"""
Seed data generator for the single-parent community project.
All data is FAKE. Run from the repo root:  python scripts/seed_data.py
Outputs: data/families.json and data/families.csv.

Needs neighbourhoods.py in the same folder. Python 3.10+.
"""
import csv
import json
import random

from neighbourhoods import NEIGHBOURHOODS

random.seed(42)  # same output every run, so the whole team shares identical data

# Each neighbourhood gets FAMILIES_PER_NEIGHBOURHOOD +/- FAMILY_SPREAD families
# (40 to 60), so some pods are denser than others (makes matching more interesting).
FAMILIES_PER_NEIGHBOURHOOD = 50
FAMILY_SPREAD = 10

CHILD_AGE_RANGES = ["0-2", "3-5", "6-9", "10-13", "14-17"]

# Options for each child's gender (optional field)
CHILD_GENDERS = ["Girl", "Boy", "Non-binary", "Prefer not to say"]
CHILD_GENDER_WEIGHTS = [0.48, 0.48, 0.02, 0.02]

# Options for the "parent's gender" field (used for support-group preferences)
GENDERS = ["Woman", "Man", "Non-binary", "Prefer not to say"]
GENDER_WEIGHTS = [0.78, 0.17, 0.02, 0.03]  # single-parent households skew toward mothers

# Display names are first name + last initial only (privacy-friendly demo).
# 80 names x 18 initials = 1,440 combinations, well above the ~600 max needed,
# and users.display_name is UNIQUE, so unique_display_name() avoids repeats.
FIRST_NAMES = [
    "Maria", "Priya", "Sam", "Aisha", "Daniel", "Chloe", "Jamal", "Mei",
    "Fatima", "Liam", "Sofia", "Omar", "Hannah", "Diego", "Nadia", "Ben",
    "Tasha", "Kenji", "Leila", "Marcus", "Grace", "Andre", "Yuna", "Rosa",
    "Ethan", "Amara", "Noor", "Colin", "Bianca", "Tariq",
    "Olivia", "Arjun", "Zara", "Lucas", "Ines", "Kwame", "Hana", "Mateo",
    "Elena", "Raj", "Simone", "Felix", "Ayesha", "Theo", "Camila", "Dev",
    "Naomi", "Jonah", "Lina", "Victor", "Imani", "Oscar", "Sana", "Pablo",
    "Keira", "Hassan", "Freya", "Malik", "Anika", "Jasper", "Lucia", "Emeka",
    "Ruth", "Kai", "Mira", "Tomas", "Esther", "Yusuf", "Clara", "Ravi",
    "Ingrid", "Musa", "Talia", "Nico", "Wren", "Idris", "Paloma", "Aaron",
    "Selin", "Joel",
]
LAST_INITIALS = list("ABCDEFGHJKLMNPRSTW")

# Chance an optional field is left blank (shows the app handles missing data)
P_MISSING_AGES = 0.10
P_MISSING_CHILD_GENDERS = 0.20  # applied on top of missing ages


def fake_postal_code(prefix: str) -> str:
    """Build a made-up postal code like 'T2A 4K7' (letter-digit-letter digit-letter-digit)."""
    letters = "ABCEGHJKLMNPRSTVWXYZ"
    return f"{prefix} {random.randint(1, 9)}{random.choice(letters)}{random.randint(1, 9)}"


def unique_display_name(used: set[str]) -> str:
    """Random 'First L.' that hasn't been used yet (users.display_name is UNIQUE)."""
    if len(used) >= len(FIRST_NAMES) * len(LAST_INITIALS):
        raise RuntimeError("Ran out of unique display names; add more FIRST_NAMES.")
    while True:
        name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_INITIALS)}."
        if name not in used:
            used.add(name)
            return name


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


def make_family(i: int, hood: str, display_name: str) -> dict:
    prefix = random.choice(NEIGHBOURHOODS[hood])
    ages, genders = make_children()
    return {
        "id": f"fam_{i:03d}",
        "display_name": display_name,
        "neighbourhood": hood,
        "postal_code": fake_postal_code(prefix),
        "children_age_ranges": ages,      # optional
        "children_genders": genders,      # optional, same order as ages
        "parent_gender": random.choices(GENDERS, weights=GENDER_WEIGHTS)[0],
    }


def main() -> None:
    families: list[dict] = []
    used_names: set[str] = set()
    counts: dict[str, int] = {}

    for hood in NEIGHBOURHOODS:
        n = random.randint(FAMILIES_PER_NEIGHBOURHOOD - FAMILY_SPREAD,
                           FAMILIES_PER_NEIGHBOURHOOD + FAMILY_SPREAD)
        counts[hood] = n
        for _ in range(n):
            families.append(make_family(len(families) + 1, hood, unique_display_name(used_names)))

    with open("data/families.json", "w", encoding="utf-8") as f:
        json.dump(families, f, indent=2)

    with open("data/families.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(families[0].keys()))
        writer.writeheader()
        for fam in families:
            row = dict(fam)
            # CSV can't hold lists, so join list fields with a pipe
            for key in ("children_age_ranges", "children_genders"):
                row[key] = "|".join(fam[key]) if fam[key] else ""
            writer.writerow(row)

    print(f"Wrote {len(families)} fake families to data/families.json and data/families.csv")
    for hood, n in counts.items():
        print(f"  {hood:<13} {n}")


if __name__ == "__main__":
    main()