const IMPORTANT_FILE_PATTERNS = [
  /^readme(?:\..+)?$/i,
  /^package\.json$/i,
  /^package-lock\.json$/i,
  /^requirements\.txt$/i,
  /^pyproject\.toml$/i,
  /^pom\.xml$/i,
  /^build\.gradle(?:\.kts)?$/i,
  /^dockerfile$/i,
  /^vite\.config\..+$/i,
  /^next\.config\..+$/i,
  /^tsconfig\.json$/i,
  /^angular\.json$/i,
  /^composer\.json$/i,
];

const TECHNOLOGY_PATTERNS = [
  "react",
  "next",
  "node",
  "express",
  "mongodb",
  "postgres",
  "mysql",
  "redis",
  "typescript",
  "javascript",
  "python",
  "django",
  "flask",
  "fastapi",
  "java",
  "spring",
  "kotlin",
  "docker",
  "kubernetes",
  "aws",
  "firebase",
  "tailwind",
  "vite",
  "graphql",
  "rest",
  "jwt",
];

function isImportantFile(fileName) {
  return IMPORTANT_FILE_PATTERNS.some((pattern) => pattern.test(fileName));
}

function extractPackageJsonKeywords(content) {
  try {
    const pkg = JSON.parse(content);
    return {
      dependencies: Object.keys(pkg.dependencies || {}).slice(0, 12),
      devDependencies: Object.keys(pkg.devDependencies || {}).slice(0, 8),
      scripts: Object.keys(pkg.scripts || {}).slice(0, 8),
    };
  } catch {
    return null;
  }
}

function extractRequirementsKeywords(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split(/[<>=~!]/)[0].trim())
    .slice(0, 15);
}

function extractPomKeywords(content) {
  const matches = [...content.matchAll(/<artifactId>([^<]+)<\/artifactId>/g)];
  return matches.map((match) => match[1]).slice(0, 15);
}

function extractReadmeKeywords(content) {
  const lowered = content.toLowerCase();
  return TECHNOLOGY_PATTERNS.filter((term) => lowered.includes(term)).slice(0, 12);
}

function summarizeImportantFile(fileName, content) {
  const trimmed = content.slice(0, 12000);
  const summary = {
    fileName,
    keywords: [],
  };

  if (/^package\.json$/i.test(fileName)) {
    const packageSummary = extractPackageJsonKeywords(trimmed);
    if (packageSummary) {
      summary.package = packageSummary;
      summary.keywords = [
        ...packageSummary.dependencies,
        ...packageSummary.devDependencies,
        ...packageSummary.scripts,
      ].slice(0, 15);
      return summary;
    }
  }

  if (/^requirements\.txt$/i.test(fileName)) {
    summary.keywords = extractRequirementsKeywords(trimmed);
    return summary;
  }

  if (/^pom\.xml$/i.test(fileName) || /^build\.gradle(?:\.kts)?$/i.test(fileName)) {
    summary.keywords = extractPomKeywords(trimmed);
    return summary;
  }

  if (/^readme/i.test(fileName)) {
    summary.keywords = extractReadmeKeywords(trimmed);
    summary.preview = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 5)
      .join(" ")
      .slice(0, 300);
    return summary;
  }

  const keywordMatches = TECHNOLOGY_PATTERNS.filter((term) =>
    trimmed.toLowerCase().includes(term),
  );
  summary.keywords = keywordMatches.slice(0, 12);
  return summary;
}

module.exports = {
  isImportantFile,
  summarizeImportantFile,
};
