import type {
  CreationFilters,
  CreationListResponse,
  Creation,
  DailyIssue,
  DeliveryResult,
  GenerateDailyIssueInput,
  GenerateThemePosterInput,
  GenerateTopicPosterInput,
  SaveCreationInput,
  SaveSubscriptionsInput,
  SearchNewsParams,
  SearchNewsResponse,
  SimulateDailyDeliveryInput,
  SubscriptionBundle,
  ThemePosterContent,
  TopicPosterContent,
} from "@/types";

export type ApiOperation =
  | "searchNews"
  | "generateDailyIssue"
  | "generateThemePoster"
  | "generateTopicPoster"
  | "getThemePoster"
  | "getTopicPoster"
  | "saveCreation"
  | "getSubscriptions"
  | "saveSubscriptions"
  | "getDailyIssues"
  | "getCreations"
  | "simulateDailyDelivery";

export interface TodayPaperApiClient {
  searchNews(params: SearchNewsParams): Promise<SearchNewsResponse>;
  generateDailyIssue(input: GenerateDailyIssueInput): Promise<DailyIssue>;
  generateThemePoster(
    input: GenerateThemePosterInput,
  ): Promise<ThemePosterContent>;
  generateTopicPoster(
    input: GenerateTopicPosterInput,
  ): Promise<TopicPosterContent>;
  getThemePoster(id: string): Promise<ThemePosterContent | null>;
  getTopicPoster(id: string): Promise<TopicPosterContent | null>;
  saveCreation(input: SaveCreationInput): Promise<Creation>;
  getSubscriptions(): Promise<SubscriptionBundle>;
  saveSubscriptions(
    input: SaveSubscriptionsInput,
  ): Promise<SubscriptionBundle>;
  getDailyIssues(): Promise<DailyIssue[]>;
  getCreations(filters?: CreationFilters): Promise<CreationListResponse>;
  simulateDailyDelivery(
    input: SimulateDailyDeliveryInput,
  ): Promise<DeliveryResult>;
}
