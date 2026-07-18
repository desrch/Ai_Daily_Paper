export type TimeRange = "24h" | "7d" | "30d";
export type NewsAngle = "政策" | "技术" | "产业" | "应用" | "市场";
export type PosterTemplate = "classic" | "modern";
export type SummaryLength = "brief" | "standard";
export type CreationType = "daily_issue" | "theme_poster" | "topic_poster";

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

export interface SearchNewsItem extends NewsArticle {
  angle: NewsAngle;
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

export interface DeliveryResult {
  issue: DailyIssue;
  emailSent: boolean;
  status: "completed" | "partial";
  message: string;
}

export interface SearchNewsResponse {
  query: string;
  timeRange: TimeRange;
  items: SearchNewsItem[];
  total: number;
}

export interface CreationListResponse {
  items: Creation[];
  total: number;
  offset: number;
  limit: number;
}
