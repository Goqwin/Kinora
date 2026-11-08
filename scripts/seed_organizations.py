"""
Seed data for ORGANIZATIONS (daycares, support programs, child services,
government assistance, outreach...). All organizations are FAKE.
Run from the repo root:  python scripts/seed_organizations.py
Outputs: data/organizations.json and data/organizations.csv.

Needs neighbourhoods.py in the same folder. Python 3.10+.

Fields each organization supplies:
  location               -> neighbourhood, address, postal_code
  suitable_ages          -> list of age bands (same bands as families.json, plus "Adults")
  suitable_genders       -> ["All"] or a list like ["Woman"], ["Girl", "Boy"]
  description            -> what activities/supports they provide
Extras for the UI/matching/DB: id, slug, name, type.

How it scales: the orgs below are TEMPLATES. Each neighbourhood gets
ORGS_PER_NEIGHBOURHOOD +/- ORG_SPREAD of them, with at least one of every
type, and the neighbourhood is appended to the name, e.g.
"Dads Connect (Ironwood)", so names and slugs stay unique.
"""
import csv
import json
import random
import re

from neighbourhoods import NEIGHBOURHOODS

random.seed(7)

ORGS_PER_NEIGHBOURHOOD = 15
ORG_SPREAD = 3  # 12 to 18 per neighbourhood (capped by the number of templates)

STREETS = ["Elm St", "Birch Ave", "Willow Rd", "Aspen Way", "Harbour Dr",
           "Sunrise Blvd", "Pine Crescent", "Oak Lane", "Station Rd", "Meadow Ct"]

ALL_AGES_CHILD = ["0-2", "3-5", "6-9", "10-13", "14-17"]

# (name, type, suitable_ages, suitable_genders, description)
TEMPLATES = [
    # --- Daycares / child care ---
    ("Little Sprouts Early Learning", "Daycare", ["0-2", "3-5"], ["All"],
     "Licensed full-day child care for infants and preschoolers with play-based learning, "
     "hot lunches, and flexible hours for shift workers."),
    ("Sunny Days Child Care", "Daycare", ["3-5"], ["All"],
     "Half-day and full-day preschool with a sliding-scale fee for low-income families."),
    ("Rainbow Playhouse Out-of-School Care", "Daycare", ["6-9", "10-13"], ["All"],
     "Before- and after-school care with homework help, snacks, and holiday day camps."),
    ("Drop-In Playroom", "Daycare", ["0-2", "3-5"], ["All"],
     "Short-term drop-in child care (up to 3 hours) so parents can attend appointments or run errands."),

    # --- Support programs ---
    ("Single Parents Circle", "Support program", ["Adults"], ["All"],
     "Weekly peer support meetups for single parents with a shared meal, guest speakers, "
     "and free child-minding on site."),
    ("Moms Together Peer Group", "Support program", ["Adults"], ["Woman"],
     "Women-only peer group offering friendship, parenting workshops, and monthly wellness mornings."),
    ("Dads Connect", "Support program", ["Adults"], ["Man"],
     "Support group for fathers raising kids on their own, with parenting skills sessions and weekend family activities."),
    ("Parent Respite Nights", "Support program", ["0-2", "3-5", "6-9", "10-13"], ["All"],
     "Monthly evenings where trained volunteers care for kids so parents can rest; includes dinner for the children."),
    ("Calm Harbour Parent Wellness", "Support program", ["Adults"], ["All"],
     "Free group counselling and stress-management workshops for parents, with evening and online options."),

    # --- Child services ---
    ("Family Wellness Child Services", "Child services", ALL_AGES_CHILD + ["Adults"], ["All"],
     "Family counselling, parenting coaching, and referrals to community resources for families facing hardship."),
    ("Young Minds Counselling", "Child services", ["6-9", "10-13", "14-17"], ["All"],
     "Child and youth counselling covering anxiety, school stress, grief, and family change."),
    ("Early Years Development Clinic", "Child services", ["0-2", "3-5"], ["All"],
     "Developmental screening, speech and language support, and early intervention for young children."),

    # --- Government assistance ---
    ("Regional Family Support Office", "Government assistance", ["Adults"], ["All"],
     "Help applying for child benefits, income support, and emergency assistance; walk-ins and appointments."),
    ("Child Care Subsidy Office", "Government assistance", ["Adults"], ["All"],
     "Eligibility checks and applications for child care fee subsidies, with a same-day pre-screening service."),
    ("Housing Assistance Intake Centre", "Government assistance", ["Adults"], ["All"],
     "Intake for rental assistance, affordable housing waitlists, and eviction-prevention support."),

    # --- Outreach / community ---
    ("Neighbourhood Outreach Hub", "Outreach", ALL_AGES_CHILD + ["Adults"], ["All"],
     "Drop-in centre connecting families to food, clothing, transit passes, and local services, with a friendly front desk."),
    ("Community Food Pantry & Meal Share", "Outreach", ALL_AGES_CHILD + ["Adults"], ["All"],
     "Weekly grocery hampers and a community dinner open to all families, no questions asked."),
    ("Newcomer Family Welcome Centre", "Outreach", ALL_AGES_CHILD + ["Adults"], ["All"],
     "Settlement support, language classes, and family events for people new to the country."),
    ("Family Legal Aid Clinic", "Outreach", ["Adults"], ["All"],
     "Free legal advice on custody, support payments, and tenancy, offered by volunteer lawyers twice a week."),

    # --- Youth / recreation (gender-specific and open) ---
    ("Girls Rising Youth Club", "Youth program", ["10-13", "14-17"], ["Girl"],
     "After-school club for girls with mentoring, coding workshops, and outdoor activities."),
    ("Big Steps Boys Mentorship", "Youth program", ["10-13", "14-17"], ["Boy"],
     "Mentoring and sports for boys, paired with trained volunteer mentors."),
    ("Saturday Kids Activity Club", "Youth program", ["6-9", "10-13"], ["All"],
     "Free weekend arts, games, and sports sessions run by neighbourhood volunteers."),
    ("Youth Drop-In Centre", "Youth program", ["14-17"], ["All"],
     "Safe evening drop-in space for teens with snacks, homework help, and a counsellor on site."),
    ("Parent & Child Swim and Play", "Youth program", ["0-2", "3-5", "Adults"], ["All"],
     "Weekly parent-and-child swim sessions followed by a playgroup; a good first step for isolated parents."),
]

ORG_TYPES = list(dict.fromkeys(t[1] for t in TEMPLATES))  # unique, in order


def fake_postal_code(prefix: str) -> str:
    letters = "ABCEGHJKLMNPRSTVWXYZ"
    return f"{prefix} {random.randint(1, 9)}{random.choice(letters)}{random.randint(1, 9)}"


def slugify(text: str) -> str:
    """'Parent & Child Swim and Play (Summit Park)' -> 'parent-child-swim-and-play-summit-park'"""
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def pick_templates_for(n: int) -> list[tuple]:
    """
    Pick n templates for one neighbourhood with no repeats:
    first one of every type (so every neighbourhood has a daycare, a support
    program, etc.), then fill the rest at random.
    """
    n = max(len(ORG_TYPES), min(n, len(TEMPLATES)))
    chosen = [random.choice([t for t in TEMPLATES if t[1] == org_type]) for org_type in ORG_TYPES]
    remaining = [t for t in TEMPLATES if t not in chosen]
    chosen += random.sample(remaining, k=n - len(chosen))
    return sorted(chosen, key=TEMPLATES.index)  # keep a stable, readable order


def make_org(i: int, template: tuple, hood: str) -> dict:
    base_name, org_type, ages, genders, desc = template
    name = f"{base_name} ({hood})"
    return {
        "id": f"org_{i:03d}",
        "slug": slugify(name),
        "name": name,
        "type": org_type,
        "neighbourhood": hood,
        "address": f"{random.randint(10, 999)} {random.choice(STREETS)}",
        "postal_code": fake_postal_code(random.choice(NEIGHBOURHOODS[hood])),
        "suitable_ages": ages,
        "suitable_genders": genders,
        "description": desc,
    }


def main() -> None:
    orgs: list[dict] = []
    counts: dict[str, int] = {}

    for hood in NEIGHBOURHOODS:
        n = random.randint(ORGS_PER_NEIGHBOURHOOD - ORG_SPREAD, ORGS_PER_NEIGHBOURHOOD + ORG_SPREAD)
        picked = pick_templates_for(n)
        counts[hood] = len(picked)
        for template in picked:
            orgs.append(make_org(len(orgs) + 1, template, hood))

    with open("data/organizations.json", "w", encoding="utf-8") as f:
        json.dump(orgs, f, indent=2)

    with open("data/organizations.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(orgs[0].keys()))
        writer.writeheader()
        for o in orgs:
            row = dict(o)
            row["suitable_ages"] = "|".join(o["suitable_ages"])
            row["suitable_genders"] = "|".join(o["suitable_genders"])
            writer.writerow(row)

    print(f"Wrote {len(orgs)} fake organizations to data/organizations.json and data/organizations.csv")
    for hood, n in counts.items():
        print(f"  {hood:<13} {n}")


if __name__ == "__main__":
    main()