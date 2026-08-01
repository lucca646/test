import { apiFetch } from "./http";

const extractTagsCache = new Map();

function extractTagsCacheKey(text, jobTarget) {
  return `${(text || "").trim()}\0${(jobTarget || "").trim()}`;
}

/** POST /api/skills/extract-tags — phrase → puces courtes (IA). */
export async function apiExtractSkillTags({ text, job_target }) {
  const normalizedText = (text || "").trim();
  const normalizedJob = (job_target || "").trim();
  const cacheKey = extractTagsCacheKey(normalizedText, normalizedJob);
  if (extractTagsCache.has(cacheKey)) {
    return extractTagsCache.get(cacheKey);
  }

  const data = await apiFetch("/api/skills/extract-tags", {
    method: "POST",
    body: JSON.stringify({
      text: normalizedText,
      job_target: normalizedJob,
    }),
  });
  if (data.status !== "success") {
    throw new Error(data.message || "Extraction des compétences impossible.");
  }
  const skills = Array.isArray(data.skills)
    ? data.skills.map((s) => String(s).trim()).filter(Boolean)
    : [];
  extractTagsCache.set(cacheKey, skills);
  return skills;
}
