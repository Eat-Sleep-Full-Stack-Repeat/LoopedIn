import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Storage } from "@/utils/storage";

type SizeContextType = {
  currentSize: "medium" | "large";
  toggleSize: () => void;
};

export const SizeContext = createContext<SizeContextType>({
  currentSize: "medium", //default size
  toggleSize: () => {},
});

export const SizeProvider = ({ children }: { children: ReactNode }) => {
  const [size, setSize] = useState<"medium" | "large">("medium");

  useEffect(() => {
    const getSize = async () => {
      try {
        const value = await Storage.getItem("user-size");
        if (value === "medium" || value === "large") {
          console.log("Size in storage:", value);
          setSize(value);
        }
      } catch (e) {
        console.log(e);
      }
    };
    getSize();
    console.log("Got size");
  }, []);

  const toggleSize = async () => {
    // find the new size and switch it
    const newSize = size === "medium" ? "large" : "medium";
    setSize(newSize);
    try {
      // update the storage
      await Storage.setItem("user-size", newSize);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SizeContext.Provider value={{ currentSize: size, toggleSize }}>
      {children}
    </SizeContext.Provider>
  );
};

export const useSize = () => useContext(SizeContext);
