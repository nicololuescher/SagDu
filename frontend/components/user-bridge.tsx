"use client";

import { useUserStore } from "@/lib/store/user";
import { useEffect } from "react";

export default function UserBridge() {
  const { user, setUser } = useUserStore();

  useEffect(() => {
    if (!user) {
      setUser({
        id: "1",
        name: "Duck Robert",
        email: "duck@example.com",
        duckHealth: 30,
      });
    }
  });

  return null;
}
