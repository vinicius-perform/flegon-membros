export function extractYouTubeId(urlOrId?: string | null): string {
  if (!urlOrId) return 'dQw4w9WgXcQ';
  const trimmed = urlOrId.trim();

  // If already a clean 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common YouTube patterns (watch, embed, v, shorts, youtu.be)
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  if (match && match[1]) {
    return match[1];
  }

  // Try URL parser query param 'v'
  try {
    const urlObj = new URL(trimmed);
    const vParam = urlObj.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }
  } catch {
    // Ignore URL parse error
  }

  return trimmed || 'dQw4w9WgXcQ';
}
