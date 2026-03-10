import { ApiReference } from "@scalar/nextjs-api-reference"

// Older Scalar versions expect the OpenAPI URL as `spec.url`
export const GET = ApiReference({
  spec: {
    url: "/api/openapi",
  },
})

