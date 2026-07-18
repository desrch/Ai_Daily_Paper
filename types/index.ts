export type NewsAngle = "政策" | "技术" | "产业" | "应用" | "市场";
export type NewsTimeRange = "24h" | "7d" | "30d";
export type PosterTemplate = "classic" | "modern";

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  category: string;
  imageUrl?: string;
  keywords: string[];
  relevanceScore?: number;
}

export interface DailyIssue {
  id: string;
  userId: string;
  issueDate: string;
  newspaperName: string;
  topics: string[];
  leadArticleId: string;
  dailyBriefing: string;
  sections: {
    title: string;
    articles: NewsArticle[];
  }[];
  quickNews: string[];
  watchNext: string[];
  createdAt: string;
}

export interface TopicPosterContent {
  id: string;
  keyword: string;
  topicTitle: string;
  introduction: string;
  articles: {
    id: string;
    headline: string;
    summary: string;
    angle: NewsAngle;
    source: string;
    sourceUrl?: string;
    publishedAt: string;
    imageUrl?: string;
    relevanceScore: number;
  }[];
  trendSummary: string;
  keyTakeaways: string[];
  keywords: string[];
  template: PosterTemplate;
  createdAt: string;
}

export interface ThemePosterContent {
  id: string;
  theme: string;
  title: string;
  introduction: string;
  articles: NewsArticle[];
  trendSummary: string;
  keywords: string[];
  template: PosterTemplate;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  topic: string;
  keywords: string[];
  enabled: boolean;
  todayUpdateCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverySettings {
  email: string;
  dailyDelivery: boolean;
  deliveryTime: "08:00";
}

export interface SubscriptionBundle {
  subscriptions: Subscription[];
  deliverySettings: DeliverySettings;
}

export type CreationType =
  | "daily_issue"
  | "theme_poster"
  | "topic_poster";

export interface Creation {
  id: string;
  type: CreationType;
  title: string;
  description: string;
  coverImageUrl: string;
  createdAt: string;
  href: string;
  saved: boolean;
}

export type GenerationStage =
  | "fetching"
  | "ranking"
  | "summarizing"
  | "layout";

export type AsyncState =
  | "idle"
  | "loading"
  | "success"
  | "partial_success"
  | "error";

export interface GenerationStatus {
  state: AsyncState;
  stage?: GenerationStage;
  completedStages: GenerationStage[];
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface SearchNewsItem extends NewsArticle {
  angle: NewsAngle;
}

export interface SearchNewsParams {
  keyword: string;
  timeRange?: NewsTimeRange;
}

export interface SearchNewsResponse {
  query: string;
  timeRange: NewsTimeRange;
  items: SearchNewsItem[];
  total: number;
}

export interface GenerateDailyIssueInput {
  userId: string;
  topics: string[];
  issueDate?: string;
}

export interface GenerateThemePosterInput {
  theme: string;
  articleCount: 3 | 4 | 5;
  summaryLength: "brief" | "standard";
  template: PosterTemplate;
}

export interface GenerateTopicPosterInput {
  keyword: string;
  articleIds: string[];
  template: PosterTemplate;
}

export interface SaveSubscriptionsInput {
  subscriptions: {
    id?: string;
    topic: string;
    keywords: string[];
    enabled: boolean;
  }[];
  deliverySettings: DeliverySettings;
}

export interface SaveCreationInput {
  href: string;
}

export interface CreationFilters {
  type?: CreationType | "all";
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
  offset?: number;
  limit?: number;
}

export interface CreationListResponse {
  items: Creation[];
  total: number;
  offset: number;
  limit: number;
}

export interface SimulateDailyDeliveryInput {
  userId: string;
  issueDate?: string;
}

export interface DeliveryResult {
  issue: DailyIssue;
  emailSent: boolean;
  status: "completed" | "partial";
  message: string;
}

export interface DemoScenarios {
  loading: GenerationStatus;
  empty: {
    title: string;
    description: string;
  };
  error: ApiError;
  partialSuccess: {
    emailSent: false;
    status: "partial";
    message: string;
  };
}
