// Recorded API responses for the e2e suite. Shapes copy backend/showme/api/schemas.py
// (StepResponse, RefineResponse) exactly; every request is mocked, no Meta API is called.

export type StepStatus = "ok" | "unsure" | "not_visible" | "done" | "refuse";
export type Action = "tap" | "type" | "scroll" | "none";
export type ScrollDirection = "none" | "up" | "down" | "left" | "right";

export type Target = {
  label: string;
  point: { x: number; y: number };
  box: { x1: number; y1: number; x2: number; y2: number };
};

export type StepResponse = {
  step_id: string;
  status: StepStatus;
  action: Action;
  instruction: string;
  target: Target | null;
  scroll_direction: ScrollDirection;
  type_text: string;
  caution: string;
  confidence: number;
  goal_complete: boolean;
  model: string;
  timings_ms: Record<string, number>;
  cost_usd: number;
};

export type RefineResponse = {
  mode: "outline" | "box";
  svg_path: string | null;
  origin: { x: number; y: number } | null;
  box: { x1: number; y1: number; x2: number; y2: number } | null;
  timings_ms: Record<string, number>;
  cost_usd: number;
};

/** Size of tests/e2e/assets/screenshot.png; image coordinates in the fixtures are in this space. */
export const IMAGE = { width: 480, height: 320, mime: "image/png" } as const;

export const GOAL = "cancel my subscription";

const TARGET: Target = {
  label: "Cancel subscription",
  point: { x: 200, y: 105 },
  box: { x1: 120, y1: 80, x2: 280, y2: 130 },
};

const base: Omit<StepResponse, "status" | "instruction" | "target" | "action"> = {
  step_id: "st_1",
  scroll_direction: "none",
  type_text: "",
  caution: "",
  confidence: 0.95,
  goal_complete: false,
  model: "muse-spark-1.3",
  timings_ms: { ground: 1320, total: 1320 },
  cost_usd: 0.0051,
};

export const stepOk = (): StepResponse => ({
  ...base,
  status: "ok",
  action: "tap",
  instruction: 'Tap "Cancel subscription", the green button in the middle of the page.',
  target: TARGET,
});

export const stepOkSecond = (): StepResponse => ({
  ...stepOk(),
  step_id: "st_2",
  instruction: 'Tap "Confirm cancellation" to finish.',
  target: { ...TARGET, label: "Confirm cancellation" },
});

export const stepUnsure = (): StepResponse => ({
  ...base,
  step_id: "st_unsure",
  status: "unsure",
  action: "tap",
  instruction: 'I think the green "Cancel subscription" button is the one you need.',
  target: TARGET,
  confidence: 0.51,
});

export const stepNotVisibleDown = (): StepResponse => ({
  ...base,
  step_id: "st_not_visible",
  status: "not_visible",
  action: "scroll",
  instruction: "It is probably further down. Scroll down, then take a new screenshot.",
  target: null,
  scroll_direction: "down",
  confidence: 0.2,
});

export const stepNotVisibleNoScroll = (): StepResponse => ({
  ...stepNotVisibleDown(),
  step_id: "st_not_visible_none",
  scroll_direction: "none",
});

export const stepDone = (): StepResponse => ({
  ...base,
  step_id: "st_done",
  status: "done",
  action: "none",
  instruction: "You did it: subscription cancelled.",
  target: null,
  goal_complete: true,
  confidence: 0.9,
});

export const stepRefuse = (): StepResponse => ({
  ...base,
  step_id: "st_refuse",
  status: "refuse",
  action: "none",
  instruction: "I cannot help with this one. It asks for a payment in a way that looks like a scam.",
  target: null,
  confidence: 0.85,
});

export const stepCaution = (): StepResponse => ({
  ...stepOk(),
  step_id: "st_caution",
  instruction: 'Tap "Pay now" only if you started this purchase yourself.',
  caution: "Careful: this page asks for a gift card. Real companies do not ask for gift cards.",
});

export const refineOutline = (): RefineResponse => ({
  mode: "outline",
  // ARCHITECTURE §6: the path is box-local; the client translates it by origin.
  svg_path: "M 0 0 L 160 0 L 160 50 L 0 50 Z",
  origin: { x: 120, y: 80 },
  box: TARGET.box,
  timings_ms: { sam: 900, total: 900 },
  cost_usd: 0.0025,
});

export const refineBox = (): RefineResponse => ({
  mode: "box",
  svg_path: null,
  origin: null,
  box: TARGET.box,
  timings_ms: { sam: 4000, total: 4000 },
  cost_usd: 0.0025,
});

export const target = TARGET;
