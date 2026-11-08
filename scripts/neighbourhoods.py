"""
Shared list of FAKE neighbourhoods and their fake postal prefixes (FSAs).
Imported by seed_data.py and seed_organizations.py so they can't drift apart.

If you change this list, also update the INSERT into public.neighbourhoods
in migration_seed_data.sql (names must match exactly, or the foreign key fails).
"""

NEIGHBOURHOODS: dict[str, list[str]] = {
    "Maple Hollow": ["T2A", "T2B"],
    "Riverbend":    ["T2C", "T2E"],
    "Cedar Ridge":  ["T3A", "T3B"],
    "Parkview":     ["T2H", "T2J"],
    "Lakeside":     ["T3C", "T3E"],
    "Ironwood":     ["T2K", "T2L"],
    "Stonegate":    ["T2M", "T2N"],
    "Birchwood":    ["T2P", "T2R"],
    "Foxglen":      ["T3G", "T3H"],
    "Summit Park":  ["T3J", "T3K"],
}