// ThemeToggle.tsx
"use client";
import React, { useContext } from "react";
import { Context } from "@/context/ContextProvider";
import { Moon, Sun } from "react-feather";
import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {}

const ThemeToggle: React.FC<ThemeToggleProps> = () => {
  const { theme, toggle } = useContext(Context);

  return (
    <div className={styles.container}>
      <Moon size={16} className={styles.icon} />
      <div
        className={styles.toggle}
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <div
          className={`${styles.toggleThumb} ${theme === "dark" ? styles.toggleDark : styles.toggleLight}`}
        >
          {theme === "dark" ? (
            <Moon size={10} color="white" />
          ) : (
            <Sun size={10} color="white" />
          )}
        </div>
      </div>
      <Sun size={16} className={styles.icon} />
    </div>
  );
};

export default ThemeToggle;