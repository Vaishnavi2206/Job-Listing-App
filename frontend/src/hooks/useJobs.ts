import { useContext } from "react";
import JobsContext from "../context/JobsContext";
import type { JobsContextValue } from "../context/JobsContext";

export const useJobs = (): JobsContextValue => {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error("useJobs must be used within a JobsProvider");
  }
  return context;
};
