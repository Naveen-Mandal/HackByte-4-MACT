const SECTION_KEYWORDS = [
  "project",
  "projects",
  "academic projects",
  "personal projects",
  "key projects",
  "selected projects",
];

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function toKeywords(parts = []) {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  const tokens = text.match(/[a-z][a-z0-9.+#-]{1,29}/g) || [];
  const stopWords = new Set([
    "with",
    "using",
    "built",
    "project",
    "projects",
    "that",
    "this",
    "from",
    "into",
    "have",
    "your",
    "their",
    "over",
    "under",
    "about",
    "application",
    "system",
    "platform",
    "website",
    "based",
  ]);

  return [...new Set(tokens.filter((token) => !stopWords.has(token)).slice(0, 15))];
}

function normalizeProject(project) {
  if (!project || typeof project !== "object") {
    return null;
  }

  const name = normalizeWhitespace(String(project.name || ""));
  const description = normalizeWhitespace(String(project.description || ""));
  const technologies = Array.isArray(project.technologies)
    ? project.technologies.map((value) => normalizeWhitespace(String(value))).filter(Boolean)
    : [];

  if (!name && !description) {
    return null;
  }

  return {
    name: name || description.split(" ").slice(0, 4).join(" "),
    description,
    technologies,
    keywords: toKeywords([name, description, technologies.join(" ")]),
    source: "structured",
  };
}

function looksLikeHeading(line) {
  const normalized = line.toLowerCase().replace(/[:|]/g, "").trim();
  return SECTION_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function parseProjectLine(line) {
  const cleaned = normalizeWhitespace(line.replace(/^[-*•]\s*/, ""));
  if (!cleaned || cleaned.length < 6) {
    return null;
  }

  const [namePart, ...rest] = cleaned.split(/\s[-|:]\s/);
  const name = normalizeWhitespace(namePart || "");
  const description = normalizeWhitespace(rest.join(" - "));

  if (!name) {
    return null;
  }

  return {
    name,
    description,
    technologies: [],
    keywords: toKeywords([name, description]),
    source: "resumeText",
  };
}

function extractProjectsFromResumeText(resumeText) {
  if (!resumeText || typeof resumeText !== "string") {
    return [];
  }

  const lines = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const projects = [];
  let inProjectSection = false;

  for (const line of lines) {
    if (looksLikeHeading(line)) {
      inProjectSection = true;
      continue;
    }

    if (inProjectSection && /^[A-Z\s]{4,}$/.test(line) && !line.includes(" ")) {
      inProjectSection = false;
    }

    if (!inProjectSection) {
      continue;
    }

    const parsed = parseProjectLine(line);
    if (parsed) {
      projects.push(parsed);
    }
  }

  return projects.slice(0, 8);
}

function extractResumeProjects({ resumeText, resumeProjects }) {
  const textProjects = extractProjectsFromResumeText(resumeText);
  const structuredProjects = Array.isArray(resumeProjects)
    ? resumeProjects.map(normalizeProject).filter(Boolean)
    : [];

  return [...structuredProjects, ...textProjects].slice(0, 10);
}

module.exports = {
  extractResumeProjects,
};
