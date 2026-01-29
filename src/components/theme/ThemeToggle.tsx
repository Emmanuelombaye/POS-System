import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 h-10 w-10 transition-transform hover:scale-105 active:scale-95 shadow-sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-brand-gold" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-brand-burgundy dark:text-blue-400" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
