declare module "swagger-ui-react" {
  import type { ComponentType } from "react";

  interface SwaggerUIProps {
    url?: string;
    spec?: Record<string, unknown>;
    docExpansion?: "list" | "full" | "none";
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    displayOperationId?: boolean;
    filter?: boolean | string;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    supportedSubmitMethods?: string[];
    tryItOutEnabled?: boolean;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
