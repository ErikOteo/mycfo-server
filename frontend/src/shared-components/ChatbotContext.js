import * as React from "react";

const ChatbotContext = React.createContext({
  context: null,
  setContext: () => {},
});

export const ChatbotContextProvider = ({ children }) => {
  const [context, setContext] = React.useState(null);

  const value = React.useMemo(
    () => ({
      context,
      setContext,
    }),
    [context]
  );

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbotContext = () => React.useContext(ChatbotContext);

