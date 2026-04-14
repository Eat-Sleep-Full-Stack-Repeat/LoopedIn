import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";

import API_URL from "@/utils/config";

type ServerStatusContextType = {
  isServerDisconnected: boolean;
  isRetrying: boolean;
  retryConnection: () => Promise<void>;
};

const ServerStatusContext = createContext<ServerStatusContextType>({
  isServerDisconnected: false,
  isRetrying: false,
  retryConnection: async () => {},
});

type FetchInput = RequestInfo | URL;
type FetchInit = RequestInit | undefined;
type FetchFunction = (input: FetchInput, init?: FetchInit) => Promise<Response>;

const getRequestUrl = (input: FetchInput) => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if ("url" in input) return input.url;
  return "";
};

const isBackendRequest = (input: FetchInput) => {
  const url = getRequestUrl(input);
  return url.startsWith(API_URL);
};

const isConnectionError = (error: unknown) => {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed")
  );
};

export const ServerStatusProvider = ({ children }: { children: ReactNode }) => {
  const [isServerDisconnected, setIsServerDisconnected] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const originalFetchRef = useRef<FetchFunction | null>(null);
  const disconnectedRef = useRef(false);

  useEffect(() => {
    disconnectedRef.current = isServerDisconnected;
  }, [isServerDisconnected]);

  useEffect(() => {
    const originalFetch = globalThis.fetch.bind(globalThis) as FetchFunction;
    originalFetchRef.current = originalFetch;

    globalThis.fetch = (async (input: FetchInput, init?: FetchInit) => {
      try {
        const response = await originalFetch(input, init);

        if (isBackendRequest(input) && disconnectedRef.current) {
          setIsServerDisconnected(false);
        }

        return response;
      } catch (error) {
        if (isBackendRequest(input) && isConnectionError(error)) {
          setIsServerDisconnected(true);
        }

        throw error;
      }
    }) as typeof globalThis.fetch;

    return () => {
      globalThis.fetch = originalFetch;
    };
  }, []);

  const retryConnection = async () => {
    const originalFetch = originalFetchRef.current;

    if (!originalFetch || isRetrying) return;

    setIsRetrying(true);

    try {
      const response = await originalFetch(`${API_URL}/`);
      setIsServerDisconnected(!response.ok);
    } catch (error) {
      if (isConnectionError(error)) {
        setIsServerDisconnected(true);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const value = useMemo(
    () => ({
      isServerDisconnected,
      isRetrying,
      retryConnection,
    }),
    [isRetrying, isServerDisconnected]
  );

  return (
    <ServerStatusContext.Provider value={value}>
      {children}
    </ServerStatusContext.Provider>
  );
};

export const useServerStatus = () => useContext(ServerStatusContext);
