import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { Storage } from "@/utils/storage";

type ThemeContextType = {
  currentTheme: 'light' | 'dark';
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  currentTheme: "light",
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<"light" | "dark">(
    Appearance.getColorScheme() || "light"
  );

  useEffect(() => {
    const getTheme = async () => {
        try {
            const value = await Storage.getItem('user-theme');
            if (value === 'light' || value === 'dark'){
                console.log("Theme in storage:", value);
                setTheme(value);
            }
        } catch (e) {
            console.log(e);
        }
    }
    getTheme();
    console.log("Got theme");
    console.log(Appearance.getColorScheme());
  }, []);

  const toggleTheme = async () => {
    // find the new theme and switch it
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    try {
      // update the storage
      await Storage.setItem("user-theme", newTheme);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme: theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext)