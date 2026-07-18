export const MIN_TOPIC_ARTICLES = 3;
export const MAX_TOPIC_ARTICLES = 5;

export function canGenerateTopicPoster(selectedIds: readonly string[]) {
  return (
    selectedIds.length >= MIN_TOPIC_ARTICLES &&
    selectedIds.length <= MAX_TOPIC_ARTICLES
  );
}

export function toggleSelectedArticle(
  selectedIds: readonly string[],
  articleId: string,
  maxItems = MAX_TOPIC_ARTICLES,
) {
  if (selectedIds.includes(articleId)) {
    return selectedIds.filter((id) => id !== articleId);
  }

  if (selectedIds.length >= maxItems) {
    return [...selectedIds];
  }

  return [...selectedIds, articleId];
}

export function moveSelectedArticle(
  selectedIds: readonly string[],
  articleId: string,
  direction: "up" | "down",
) {
  const currentIndex = selectedIds.indexOf(articleId);

  if (currentIndex === -1) {
    return [...selectedIds];
  }

  const nextIndex =
    direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0 || nextIndex >= selectedIds.length) {
    return [...selectedIds];
  }

  const nextIds = [...selectedIds];
  [nextIds[currentIndex], nextIds[nextIndex]] = [
    nextIds[nextIndex],
    nextIds[currentIndex],
  ];

  return nextIds;
}
