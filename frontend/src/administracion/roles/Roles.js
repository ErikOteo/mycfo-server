import * as React from 'react';
import { useChatbotScreenContext } from "../../shared-components/useChatbotScreenContext";

export default function Roles(props) {
  const chatbotContext = React.useMemo(
    () => ({
      screen: "roles",
      estado: "sin-datos",
    }),
    []
  );

  useChatbotScreenContext(chatbotContext);

  return (
    <>

    </>
  );
}
