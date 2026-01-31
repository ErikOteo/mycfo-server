import * as React from "react";
import { useChatbotContext } from "./ChatbotContext";

const stableStringify = (value) => {
  try {
    return JSON.stringify(value ?? null);
  } catch (error) {
    return "";
  }
};

export const useChatbotScreenContext = (context) => {
  const { setContext } = useChatbotContext();
  const serialized = React.useMemo(() => stableStringify(context), [context]);

  React.useEffect(() => {
    if (!setContext) return;
    setContext(context ?? null);
    return () => setContext(null);
  }, [setContext, serialized]);
};

