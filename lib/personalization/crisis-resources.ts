/**
 * Crisis resources shown FIRST whenever a crisis is flagged. There is one list
 * for the whole app, in lib/safety/crisis.ts (static, works with no database
 * and no AI). This module only re-exports it for the pipeline.
 */
export { CRISIS_RESOURCES, crisisResourcesFor, type CrisisResource } from "@/lib/safety/crisis";
