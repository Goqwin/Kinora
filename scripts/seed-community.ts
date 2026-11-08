/**
 * Seed demo community board posts (published) so /community is not empty.
 * Re-runnable: upserts demo authors and replaces their posts/replies.
 *
 *   pnpm db:seed:community
 */
import { loadEnvLocal } from "../lib/env/load-env-local";

loadEnvLocal();

import { inArray } from "drizzle-orm";

import { shouldSeedOpenToMeet } from "../lib/community/circle-privacy";
import { closeDb, getDb } from "../lib/db";
import {
  communityPosts,
  communityReplies,
  resources,
  userPreferences,
  users,
} from "../lib/db/schema";
import type { CommunityPostCategory } from "../lib/db/schema-constants";

async function setOpenFlags(
  db: ReturnType<typeof getDb>,
  userIds: string[],
  open: boolean,
) {
  const chunkSize = 100;
  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;
    await db
      .update(userPreferences)
      .set({ openToMeetParents: open, updatedAt: new Date() })
      .where(inArray(userPreferences.userId, chunk));
  }
}

const SEED_MODERATION = {
  pii: false,
  harassment: false,
  scam_or_promo: false,
  unsafe_advice: false,
  crisis: false,
  confidence: 1,
  model: "seed",
  prompt_version: "seed-community-v1",
} as const;

type SeedAuthor = {
  auth0Sub: string;
  displayName: string;
  email: string;
};

type SeedPost = {
  authorSub: string;
  category: CommunityPostCategory;
  title: string;
  body: string;
  helpfulCount: number;
  resourceSlug?: string;
  replies?: { authorSub: string; body: string }[];
};

const AUTHORS: SeedAuthor[] = [
  {
    auth0Sub: "seed|community-maya",
    displayName: "Maya R.",
    email: "seed-maya@example.invalid",
  },
  {
    auth0Sub: "seed|community-jordan",
    displayName: "Jordan K.",
    email: "seed-jordan@example.invalid",
  },
  {
    auth0Sub: "seed|community-priya",
    displayName: "Priya S.",
    email: "seed-priya@example.invalid",
  },
  {
    auth0Sub: "seed|community-alex",
    displayName: "Alex M.",
    email: "seed-alex@example.invalid",
  },
  {
    auth0Sub: "seed|community-sam",
    displayName: "Sam T.",
    email: "seed-sam@example.invalid",
  },
  {
    auth0Sub: "seed|community-lee",
    displayName: "Lee N.",
    email: "seed-lee@example.invalid",
  },
];

const POSTS: SeedPost[] = [
  {
    authorSub: "seed|community-maya",
    category: "other",
    title: "Anyone up for a Saturday coffee walk near Beltline?",
    body: "Single parent of a 6-year-old. Looking for other parents who want a low-pressure hangout — coffee, walk the block, then home. No networking pitch, just company. Happy to meet near Centennial Park around 10am.",
    helpfulCount: 12,
    replies: [
      {
        authorSub: "seed|community-jordan",
        body: "I’m in. Bring a stroller or kid scooter? I can do next Saturday.",
      },
      {
        authorSub: "seed|community-lee",
        body: "Same — lonely weekends are hard. Message me if you make a small group chat.",
      },
    ],
  },
  {
    authorSub: "seed|community-jordan",
    category: "other",
    title: "Grocery run buddy in SW — trade lists and split the trip",
    body: "I hate shopping alone after bedtime. Would anyone want to carpool to Costco or Co-op once every couple weeks? We can text lists ahead so it’s quick. Kids can stay home with a sitter or come if yours are chill.",
    helpfulCount: 8,
  },
  {
    authorSub: "seed|community-priya",
    category: "other",
    title: "Chore-share swap: laundry + meal prep Sundays",
    body: "Idea from another single parent: one of us hosts laundry while the other chops veggies for the week. Looking for 1–2 people in Bridgeland / Renfrew who want to try it for a month.",
    helpfulCount: 15,
    replies: [
      {
        authorSub: "seed|community-sam",
        body: "Love this. I can host every other Sunday if we keep it under 2 hours.",
      },
    ],
  },
  {
    authorSub: "seed|community-alex",
    category: "childcare",
    title: "What worked for evening care when I work nights?",
    body: "I finally landed a rotating night schedule. Drop-in playrooms helped on the short nights, but I still needed a backup neighbour. Curious what others use when daycare is closed and grandma isn’t free.",
    helpfulCount: 21,
    resourceSlug: "team-org-004",
    replies: [
      {
        authorSub: "seed|community-maya",
        body: "I keep a printed backup list: one neighbour, one paid sitter, one church evening program. Rotating who I ask so nobody burns out.",
      },
    ],
  },
  {
    authorSub: "seed|community-sam",
    category: "financial",
    title: "Child care subsidy paperwork — what slowed me down",
    body: "Bring pay stubs AND a letter confirming your schedule. I got bounced twice because my hours weren’t on the stub. Also screenshot every portal confirmation — the wait message disappeared on me once.",
    helpfulCount: 19,
    resourceSlug: "team-org-013",
  },
  {
    authorSub: "seed|community-lee",
    category: "housing",
    title: "Rent help before eviction notice — timing tip",
    body: "Don’t wait for the formal notice. I called housing navigation the week I knew rent would be short and they still had slots. Bring ID, lease, and a simple budget. It felt scary but staff were practical, not judgy.",
    helpfulCount: 17,
    resourceSlug: "team-org-015",
  },
  {
    authorSub: "seed|community-maya",
    category: "food",
    title: "Food bank first visit — what to bring",
    body: "Photo ID, proof of address (even a bill), and kids’ birth years helped. Lines move faster mid-week mornings in my area. They also pointed me to a meal-share night which was less intimidating for my teen.",
    helpfulCount: 14,
    resourceSlug: "team-org-017",
  },
  {
    authorSub: "seed|community-jordan",
    category: "health_family",
    title: "Kid counselling waitlist — what I did while waiting",
    body: "We were on a waitlist for months. School counsellor gave weekly check-ins and a parenting coach group kept me from spiralling. Not a replacement for therapy, but it helped us hold on until a spot opened.",
    helpfulCount: 11,
    resourceSlug: "team-org-011",
  },
  {
    authorSub: "seed|community-priya",
    category: "activities",
    title: "Free weekend clubs for 8–12 without feeling like daycare",
    body: "Looking for coding or maker clubs that don’t require two working parents to register at 6am. Free or sliding-scale preferred. Has anyone had luck with weekend programs that actually email confirmations?",
    helpfulCount: 9,
    resourceSlug: "team-org-020",
    replies: [
      {
        authorSub: "seed|community-alex",
        body: "We tried a library maker Saturday — smaller group, no pressure. Worth calling the branch, not just the website.",
      },
    ],
  },
  {
    authorSub: "seed|community-alex",
    category: "other",
    title: "Dads / non-moms coffee meetups — where do you go?",
    body: "Most parent groups skew moms-only in my neighbourhood. Looking for chill hangouts (not formal workshops) where dads and non-binary parents also show up. Open to rotating parks or a quiet cafe.",
    helpfulCount: 13,
    replies: [
      {
        authorSub: "seed|community-lee",
        body: "I found a peer circle that meets monthly and a few of us peel off for coffee after. Worth asking the community board hosts.",
      },
    ],
  },
];

async function main() {
  const db = getDb();

  const authorIds = new Map<string, string>();

  for (const author of AUTHORS) {
    const [row] = await db
      .insert(users)
      .values({
        auth0Sub: author.auth0Sub,
        displayName: author.displayName,
        email: author.email,
        role: "user",
        rulesAcceptedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.auth0Sub,
        set: {
          displayName: author.displayName,
          email: author.email,
          rulesAcceptedAt: new Date(),
        },
      })
      .returning({ id: users.id });

    if (!row) {
      throw new Error(`Failed to upsert author ${author.auth0Sub}`);
    }
    authorIds.set(author.auth0Sub, row.id);
  }

  const seedAuthorIds = [...authorIds.values()];

  // Remove prior seed posts (replies cascade).
  await db
    .delete(communityPosts)
    .where(inArray(communityPosts.authorId, seedAuthorIds));

  const resourceIdBySlug = new Map<string, string>();
  const slugs = [
    ...new Set(
      POSTS.map((post) => post.resourceSlug).filter(
        (slug): slug is string => Boolean(slug),
      ),
    ),
  ];
  if (slugs.length > 0) {
    const rows = await db
      .select({ id: resources.id, slug: resources.slug })
      .from(resources)
      .where(inArray(resources.slug, slugs));
    for (const row of rows) {
      resourceIdBySlug.set(row.slug, row.id);
    }
  }

  let postCount = 0;
  let replyCount = 0;

  for (const post of POSTS) {
    const authorId = authorIds.get(post.authorSub);
    if (!authorId) {
      throw new Error(`Missing author ${post.authorSub}`);
    }

    const resourceId = post.resourceSlug
      ? (resourceIdBySlug.get(post.resourceSlug) ?? null)
      : null;

    const createdAt = new Date(Date.now() - postCount * 24 * 60 * 60 * 1000);

    const [inserted] = await db
      .insert(communityPosts)
      .values({
        authorId,
        category: post.category,
        title: post.title,
        body: post.body,
        status: "published",
        helpfulCount: post.helpfulCount,
        resourceId,
        moderation: SEED_MODERATION,
        createdAt,
        updatedAt: createdAt,
      })
      .returning({ id: communityPosts.id });

    if (!inserted) {
      throw new Error(`Failed to insert post: ${post.title}`);
    }
    postCount += 1;

    for (const reply of post.replies ?? []) {
      const replyAuthorId = authorIds.get(reply.authorSub);
      if (!replyAuthorId) {
        throw new Error(`Missing reply author ${reply.authorSub}`);
      }
      await db.insert(communityReplies).values({
        postId: inserted.id,
        authorId: replyAuthorId,
        body: reply.body,
        status: "published",
        moderation: SEED_MODERATION,
        helpfulCount: 2,
      });
      replyCount += 1;
    }
  }

  // Flip ~28% of existing prefs to open_to_meet so circle counts look alive.
  const prefs = await db
    .select({ userId: userPreferences.userId })
    .from(userPreferences);

  const openIds: string[] = [];
  const closedIds: string[] = [];
  for (const row of prefs) {
    if (shouldSeedOpenToMeet(row.userId)) openIds.push(row.userId);
    else closedIds.push(row.userId);
  }

  await setOpenFlags(db, openIds, true);
  // Keep deterministic: clear flag for the complement so re-runs stay stable.
  await setOpenFlags(db, closedIds, false);

  console.log(
    `Seeded ${postCount} published community posts and ${replyCount} replies across ${AUTHORS.length} demo parents.`,
  );
  console.log(
    `Set open_to_meet_parents=true for ${openIds.length} of ${prefs.length} preference rows.`,
  );
  await closeDb();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await closeDb();
  } catch {
    // ignore
  }
  process.exit(1);
});
