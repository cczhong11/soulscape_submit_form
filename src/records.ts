import { pickField, toStringArray, type Track } from "./fields";

export function buildApplicationsFields(
  track: Track,
  fields: Record<string, any>,
): Record<string, any> {
  const applicationsFields: Record<string, any> = {
    Track: track,
    Status: pickField(fields, ["Status", "status"]) ?? "Submitted",
  };
  const reviewer = pickField(fields, ["Reviewer", "reviewer"]);
  if (reviewer) applicationsFields["Reviewer"] = reviewer;
  const reviewerNotes = pickField(fields, ["Reviewer Notes", "reviewerNotes"]);
  if (reviewerNotes) applicationsFields["Reviewer Notes"] = reviewerNotes;
  return applicationsFields;
}

export function buildVisionaryFields(
  applicationId: string,
  fields: Record<string, any>,
): Record<string, any> {
  const visionaryFields: Record<string, any> = {
    "Application ID": applicationId,
  };
  const fullName = pickField(fields, ["Full Name", "fullName", "name"]);
  if (fullName) visionaryFields["Full Name"] = fullName;
  const titleRole = pickField(fields, ["Title", "title", "Title / Role", "titleRole", "role"]);
  if (titleRole) visionaryFields["Title"] = titleRole;
  const professionalLink = pickField(fields, ["Professional Link", "professionalLink", "portfolio"]);
  if (professionalLink) visionaryFields["Professional Link"] = professionalLink;
  //const headshot = pickField(fields, ["Headshot", "headshot"]);
  //if (headshot) visionaryFields["Headshot"] = headshot;
  const roleSelection = pickField(fields, ["Role Selection", "roleSelection"]);
  if (roleSelection) visionaryFields["Role Selection"] = roleSelection;
  const sfAvailability = pickField(fields, ["SF Availability", "sfAvailability"]);
  if (sfAvailability) visionaryFields["SF Availability"] = sfAvailability;
  const soulOverSlop = pickField(fields, ["Soul over Slop", "soulOverSlop"]);
  if (soulOverSlop) visionaryFields["Soul over Slop"] = soulOverSlop;
  return visionaryFields;
}

export function buildMentorFields(
  applicationId: string,
  fields: Record<string, any>,
): Record<string, any> {
  const mentorFields: Record<string, any> = {
    "Application ID": applicationId,
  };
  const handle = pickField(fields, ["Handle", "handle"]);
  if (handle) mentorFields["Handle"] = handle;
  const primaryPlatform = pickField(fields, ["Primary Platform", "primaryPlatform"]);
  if (primaryPlatform) mentorFields["Primary Platform"] = primaryPlatform;
  const followerCount = pickField(fields, ["Follower Count", "followerCount"]);
  if (followerCount !== undefined && followerCount !== "") {
    const count = Number(followerCount);
    if (!Number.isNaN(count)) mentorFields["Follower Count"] = count;
  }
  const portfolioLink = pickField(fields, ["Portfolio Link", "portfolioLink"]);
  if (portfolioLink) mentorFields["Portfolio Link"] = toUrlField(portfolioLink);
  const superpower = pickField(fields, ["Superpower", "superpower"]);
  if (superpower) mentorFields["Superpower"] = superpower;
  const missionCard = pickField(fields, ["Mission Card", "missionCard"]);
  if (missionCard) mentorFields["Mission Card"] = missionCard;
  const proudWorkLink = pickField(fields, ["Proud Work Link", "proudWorkLink"]);
  if (proudWorkLink) mentorFields["Proud Work Link"] = toUrlField(proudWorkLink);
  const toolsInput = pickField(fields, ["Tools", "tools", "Tool", "tool"]);
  const tools = toStringArray(toolsInput);
  if (tools.length > 0) mentorFields["Tools"] = tools;
  return mentorFields;
}

function toUrlField(value: string): { link: string; text: string } {
  const link = value.trim();
  return { link, text: link };
}
