export const YEARS = [2021, 2022, 2023, 2024, 2025] as const;

export type FamilySeries = {
  total: readonly number[];
  couple: readonly number[];
  oneParent: readonly number[];
};

export const CANADA: FamilySeries = {
  total: [10_334_973, 10_488_748, 10_716_184, 11_011_839, 11_111_244],
  couple: [8_563_575, 8_698_572, 8_901_705, 9_158_584, 9_246_244],
  oneParent: [1_771_398, 1_790_176, 1_814_479, 1_853_255, 1_865_000],
};

export const ALBERTA: FamilySeries = {
  total: [1_173_845, 1_191_550, 1_235_764, 1_295_704, 1_323_571],
  couple: [987_384, 1_001_737, 1_040_774, 1_093_993, 1_116_680],
  oneParent: [186_461, 189_813, 194_990, 201_711, 206_891],
};

export const CALGARY = { oneParentFamilies: 52_170, childrenInOneParentFamilies: 80_495 };

export const CENSUS_2021 = {
  ledByWomenPct: 77.2,
  ledByMenPct: 22.8,
  childrenInOneParentFamilies: 2_600_000,
  childrenSharePct: 25,
  youngChildFamilies: 268_170,
  youngChildFamiliesLedByMothersPct: 81.2,
};

export const SOURCES = {
  estimates: {
    label: "Statistics Canada, Table 17-10-0061-01, Estimates of the number of census families on July 1st",
    url: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1710006101",
  },
  diversity: {
    label: "Statistics Canada, StatsCAN Plus: The diversity of families in Canada",
    url: "https://www.statcan.gc.ca/o1/en/plus/7574-diversity-families-canada",
  },
} as const;
