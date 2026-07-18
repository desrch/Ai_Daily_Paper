import creationsJson from "@/data/demo/creations.json";
import dailyIssueJson from "@/data/demo/daily-issue.json";
import subscriptionsJson from "@/data/demo/subscriptions.json";
import themePosterJson from "@/data/demo/theme-poster.json";
import topicPosterJson from "@/data/demo/topic-poster.json";
import {
  creationSchema,
  dailyIssueSchema,
  mockStoreStateSchema,
  subscriptionBundleSchema,
  themePosterContentSchema,
  topicPosterContentSchema,
} from "@/lib/api/schemas";
import type { Creation } from "@/types";
import type {
  ThemePosterContent,
  TopicPosterContent,
} from "@/types";
import { z } from "zod";

const STORAGE_KEY = "todaypaper:mock-store:v1";

export type MockStoreState = z.infer<typeof mockStoreStateSchema>;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function createInitialState(): MockStoreState {
  const subscriptionBundle =
    subscriptionBundleSchema.parse(subscriptionsJson);

  return mockStoreStateSchema.parse({
    subscriptions: subscriptionBundle.subscriptions,
    deliverySettings: subscriptionBundle.deliverySettings,
    dailyIssues: [dailyIssueSchema.parse(dailyIssueJson)],
    creations: creationSchema.array().parse(creationsJson),
    themePosters: [themePosterContentSchema.parse(themePosterJson)],
    topicPosters: [topicPosterContentSchema.parse(topicPosterJson)],
    lastDeliveryDate: null,
  });
}

let serverState = createInitialState();

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readMockStore(): MockStoreState {
  const storage = getBrowserStorage();

  if (!storage) {
    return clone(serverState);
  }

  const serialized = storage.getItem(STORAGE_KEY);

  if (!serialized) {
    const initialState = createInitialState();
    storage.setItem(STORAGE_KEY, JSON.stringify(initialState));
    return clone(initialState);
  }

  try {
    return mockStoreStateSchema.parse(JSON.parse(serialized));
  } catch {
    const initialState = createInitialState();
    storage.setItem(STORAGE_KEY, JSON.stringify(initialState));
    return clone(initialState);
  }
}

export function writeMockStore(state: MockStoreState): MockStoreState {
  const validatedState = mockStoreStateSchema.parse(state);
  const storage = getBrowserStorage();

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(validatedState));
  } else {
    serverState = clone(validatedState);
  }

  return clone(validatedState);
}

export function updateMockStore(
  updater: (state: MockStoreState) => MockStoreState,
): MockStoreState {
  return writeMockStore(updater(readMockStore()));
}

export function addMockCreation(creation: Creation): MockStoreState {
  const validatedCreation = creationSchema.parse(creation);

  return updateMockStore((state) => ({
    ...state,
    creations: [
      validatedCreation,
      ...state.creations.filter((item) => item.id !== validatedCreation.id),
    ],
  }));
}

export function findMockThemePoster(
  posterId: string,
): ThemePosterContent | null {
  return (
    readMockStore().themePosters.find((poster) => poster.id === posterId) ??
    null
  );
}

export function findMockTopicPoster(
  posterId: string,
): TopicPosterContent | null {
  return (
    readMockStore().topicPosters.find((poster) => poster.id === posterId) ??
    null
  );
}

export function markMockCreationSaved(
  href: string,
): Creation | null {
  let savedCreation: Creation | null = null;

  updateMockStore((state) => ({
    ...state,
    creations: state.creations.map((creation) => {
      if (creation.href !== href) {
        return creation;
      }

      savedCreation = creationSchema.parse({
        ...creation,
        saved: true,
      });
      return savedCreation;
    }),
  }));

  return savedCreation;
}

export function resetMockStore(): MockStoreState {
  const initialState = createInitialState();
  const storage = getBrowserStorage();

  if (storage) {
    storage.removeItem(STORAGE_KEY);
  } else {
    serverState = clone(initialState);
  }

  return clone(initialState);
}
