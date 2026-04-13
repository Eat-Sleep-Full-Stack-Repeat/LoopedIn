import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Storage } from "@/utils/storage";
import { useWindowDimensions } from "react-native";

type SizeContextType = {
  currentSize: "medium" | "large";
  toggleSize: () => void;
};

export const SizeContext = createContext<SizeContextType>({
  currentSize: "medium", //default size
  toggleSize: () => {},
});

type SizeOption = "medium" | "large";

export const SizeProvider = ({ children }: { children: ReactNode }) => {
  const { width } = useWindowDimensions();
  // function to get the default size (large screens default to on - AKA large)
  const getDefault = (): SizeOption => {
    return width >= 768 ? "large" : "medium";
  };

  const [size, setSize] = useState<SizeOption>(getDefault());

  useEffect(() => {
    const getSize = async () => {
      try {
        const value = await Storage.getItem("user-size");
        if (value === "medium" || value === "large") {
          console.log("Size in storage:", value);
          setSize(value);
        } else {
          const tempSize = getDefault();
          setSize(tempSize);
          await Storage.setItem("user-size", tempSize);
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
