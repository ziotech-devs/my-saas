export type Ticket = {
  key: string;
  summary: string;
  description: string;
};

// Toggles for the optional post-implementation pipeline steps.
// Omitted flags default to enabled in handleTicket.
export type PipelineOptions = {
  review?: boolean;
  lint?: boolean;
  test?: boolean;
};
