export interface Capability {
  description: string;
  collection: string;
  filters: (args: Record<string, any>) => Record<string, any>;
  fields?: string[];
  parameters: {
    type: "object";
    properties: Record<string, { type: string }>;
    required?: string[];
  };
}

export const CAPABILITIES: Record<string, Capability> = {
  find_deals: {
    description: "Find travel deals between two cities",
    collection: "api::deal.deal",
    filters: (args) => ({
      from: { $containsi: args.origin },
      to: { $containsi: args.destination },
    }),
    fields: ["from", "to", "fare", "description"],
    parameters: {
      type: "object",
      properties: {
        origin: { type: "string" },
        destination: { type: "string" },
      },
      required: ["origin", "destination"],
    },
  },

  find_flight_schedule: {
    description: "Find flight schedules between two cities",
    collection: "api::flight.flight",
    filters: (args) => ({
      origin: { $containsi: args.origin },
      destination: { $containsi: args.destination },
    }),
    fields: ["origin","destination","fare"],
    parameters: {
      type: "object",
      properties: {
        origin: { type: "string" },
        destination: { type: "string" },
      },
      required: ["origin", "destination"],
    },
  },
};
