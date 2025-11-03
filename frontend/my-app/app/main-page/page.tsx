"use client";

import { useEffect, useState } from "react";

interface User {
  name: string;
  surname: string;
  admin: boolean;
}

export default function Welcome() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not authorized");
        return res.json();
      })
      .then((data: User) => {
        if (data.admin) {
          // redirect admins to admin page
          window.location.href = "/admin-page";
        } else {
          setUser(data); // set non-admin user
        }
      })
      .catch(() => {
        // if not logged in, redirect to login page
        window.location.href = "/login";
      });
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold">
        Welcome {user.name} {user.surname}
      </h1>
      <p className="mt-2 text-gray-700">You are successfully logged in.</p>
    </div>
  );
}
