"use client";

import { useState, useCallback } from "react";

/**
 * A custom hook to wrap server actions.
 * This gives us loading, data, and error states.
 */
export const useFetch = (action) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Forward every argument (e.g. updateTransaction(id, data) takes two)
  const fn = useCallback(async (...args) => {
    setLoading(true);
    setData(null);
    setError(null);

    try {
      // Call the server action
      const result = await action(...args);

      // The action can return an error object
      if (result?.error) {
        setError(result);
        setData(null);
      } else {
        // Or it can return a success object
        setData(result);
        setError(null);
      }
    } catch (e) {
      // Handle any unexpected errors
      const err = { error: e.message || "An unexpected error occurred" };
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [action]);

  return { loading, fn, data, error };
};