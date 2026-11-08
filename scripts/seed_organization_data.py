"""
Seed data for ORGANIZATIONS (daycares, support programs, child services,
government assistance, outreach...). All organizations are FAKE.
Run:  python scripts/seed_organization_data.py
Outputs: organizations.json and organizations.csv in data/.

Fields each organization supplies:
  location               -> neighbourhood, address, postal_code
  suitable_ages          -> list of age bands (same bands as families.json, plus "Adults")
  suitable_genders       -> ["All"] or a list like ["Woman"], ["Girl", "Boy"]
  description            -> what activities/supports they provide
Extras added for the UI/matching: id, name, type.

Neighbourhood names and postal prefixes match scripts/seed_user_data.py, so families and
organizations can be matched by neighbourhood.
"""
import csv
import json
import random

random.seed(7)

NEIGHBOURHOODS = {
    "Maple Hollow": ["T2A", "T2B"],
    "Riverbend": ["T2C", "T2E"],
    "Cedar Ridge": ["T3A", "T3B"],
    "Parkview": ["T2H", "T2J"],
    "Lakeside": ["T3C", "T3E"],
}
STREETS = ["Elm St", "Birch Ave", "Willow Rd", "Aspen Way", "Harbour Dr",
           "Sunrise Blvd", "Pine Crescent", "Oak Lane", "Station Rd", "Meadow Ct"]

ALL_AGES_CHILD = ["0-2", "3-5", "6-9", "10-13", "14-17"]

# (name, type, neighbourhood, suitable_ages, suitable_genders, description)
ORGS = [
    # --- Daycares / child care ---
    ("Little Sprouts Early Learning", "Daycare", "Maple Hollow", ["0-2", "3-5"], ["All"],
     "Licensed full-day child care for infants and preschoolers with play-based learning, "
     "hot lunches, and flexible hours for shift workers."),
    ("Sunny Days Child Care", "Daycare", "Riverbend", ["3-5"], ["All"],
     "Half-day and full-day preschool with a sliding-scale fee for low-income families."),
    ("Rainbow Playhouse Out-of-School Care", "Daycare", "Parkview", ["6-9", "10-13"], ["All"],
     "Before- and after-school care with homework help, snacks, and holiday day camps."),
    ("Drop-In Playroom", "Daycare", "Cedar Ridge", ["0-2", "3-5"], ["All"],
     "Short-term drop-in child care (up to 3 hours) so parents can attend appointments or run errands."),

    # --- Support programs ---
    ("Single Parents Circle", "Support program", "Maple Hollow", ["Adults"], ["All"],
     "Weekly peer support meetups for single parents with a shared meal, guest speakers, "
     "and free child-minding on site."),
    ("Moms Together Peer Group", "Support program", "Lakeside", ["Adults"], ["Woman"],
     "Women-only peer group offering friendship, parenting workshops, and monthly wellness mornings."),
    ("Dads Connect", "Support program", "Riverbend", ["Adults"], ["Man"],
     "Support group for fathers raising kids on their own, with parenting skills sessions and weekend family activities."),
    ("Parent Respite Nights", "Support program", "Parkview", ["0-2", "3-5", "6-9", "10-13"], ["All"],
     "Monthly evenings where trained volunteers care for kids so parents can rest; includes dinner for the children."),
    ("Calm Harbour Parent Wellness", "Support program", "Cedar Ridge", ["Adults"], ["All"],
     "Free group counselling and stress-management workshops for parents, with evening and online options."),

    # --- Child services ---
    ("Family Wellness Child Services", "Child services", "Riverbend", ALL_AGES_CHILD + ["Adults"], ["All"],
     "Family counselling, parenting coaching, and referrals to community resources for families facing hardship."),
    ("Young Minds Counselling", "Child services", "Parkview", ["6-9", "10-13", "14-17"], ["All"],
     "Child and youth counselling covering anxiety, school stress, grief, and family change."),
    ("Early Years Development Clinic", "Child services", "Maple Hollow", ["0-2", "3-5"], ["All"],
     "Developmental screening, speech and language support, and early intervention for young children."),

    # --- Government assistance ---
    ("Regional Family Support Office", "Government assistance", "Riverbend", ["Adults"], ["All"],
     "Help applying for child benefits, income support, and emergency assistance; walk-ins and appointments."),
    ("Child Care Subsidy Office", "Government assistance", "Maple Hollow", ["Adults"], ["All"],
     "Eligibility checks and applications for child care fee subsidies, with a same-day pre-screening service."),
    ("Housing Assistance Intake Centre", "Government assistance", "Lakeside", ["Adults"], ["All"],
     "Intake for rental assistance, affordable housing waitlists, and eviction-prevention support."),

    # --- Outreach / community ---
    ("Neighbourhood Outreach Hub", "Outreach", "Cedar Ridge", ALL_AGES_CHILD + ["Adults"], ["All"],
     "Drop-in centre connecting families to food, clothing, transit passes, and local services, with a friendly front desk."),
    ("Community Food Pantry & Meal Share", "Outreach", "Maple Hollow", ALL_AGES_CHILD + ["Adults"], ["All"],
     "Weekly grocery hampers and a community dinner open to all families, no questions asked."),
    ("Newcomer Family Welcome Centre", "Outreach", "Parkview", ALL_AGES_CHILD + ["Adults"], ["All"],
     "Settlement support, language classes, and family events for people new to the country."),
    ("Family Legal Aid Clinic", "Outreach", "Riverbend", ["Adults"], ["All"],
     "Free legal advice on custody, support payments, and tenancy, offered by volunteer lawyers twice a week."),

    # --- Youth / recreation (gender-specific and open) ---
    ("Girls Rising Youth Club", "Youth program", "Lakeside", ["10-13", "14-17"], ["Girl"],
     "After-school club for girls with mentoring, coding workshops, and outdoor activities."),
    ("Big Steps Boys Mentorship", "Youth program", "Cedar Ridge", ["10-13", "14-17"], ["Boy"],
     "Mentoring and sports for boys, paired with trained volunteer mentors."),
    ("Saturday Kids Activity Club", "Youth program", "Parkview", ["6-9", "10-13"], ["All"],
     "Free weekend arts, games, and sports sessions run by neighbourhood volunteers."),
    ("Youth Drop-In Centre", "Youth program", "Maple Hollow", ["14-17"], ["All"],
     "Safe evening drop-in space for teens with snacks, homework help, and a counsellor on site."),
    ("Parent & Child Swim and Play", "Youth program", "Riverbend", ["0-2", "3-5", "Adults"], ["All"],
     "Weekly parent-and-child swim sessions followed by a playgroup; a good first step for isolated parents."),
]


def fake_postal_code(prefix: str) -> str:
    letters = "ABCEGHJKLMNPRSTVWXYZ"
    return f"{prefix} {random.randint(1, 9)}{random.choice(letters)}{random.randint(1, 9)}"


def make_org(i: int, row: tuple) -> dict:
    name, org_type, hood, ages, genders, desc = row
    return {
        "id": f"org_{i:03d}",
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
    orgs = [make_org(i + 1, row) for i, row in enumerate(ORGS)]

    with open("data/organizations.json", "w") as f:
        json.dump(orgs, f, indent=2)

    with open("data/organizations.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(orgs[0].keys()))
        writer.writeheader()
        for o in orgs:
            row = dict(o)
            row["suitable_ages"] = "|".join(o["suitable_ages"])
            row["suitable_genders"] = "|".join(o["suitable_genders"])
            writer.writerow(row)

    print(f"Wrote {len(orgs)} fake organizations to organizations.json and organizations.csv")


if __name__ == "__main__":
    main()