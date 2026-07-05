"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { defaultLearningCategories } from "@/features/category/constants";
import { getCategories } from "@/features/category/services/category.service";

export function useCategories() {
  const [categories, setCategories] = useState(defaultLearningCategories);

  useEffect(() => {
    const supabase = getSupabase();
    let mounted = true;

    if (!supabase) return;

    getCategories(supabase)
      .then((data) => {
        if (mounted && data.length > 0) setCategories(data);
      })
      .catch(() => {
        if (mounted) setCategories(defaultLearningCategories);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return categories;
}
