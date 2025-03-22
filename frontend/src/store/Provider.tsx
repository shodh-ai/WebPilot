"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { appStore } from "./store";
import Pilot from "@/components/Pilot";

interface ReduxProviderProps {
  children: ReactNode;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={appStore}>
      <Pilot />
      {children}
    </Provider>
  );
}
