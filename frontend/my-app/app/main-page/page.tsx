"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  username: string;
  phone_number: string;
  admin: boolean;
  suspended: boolean;
}

export default function Welcome() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/me`, {
      credentials: "include",
    })
      .then((res) => {
        // Check if response is JSON first
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned HTML instead of JSON');
        }
        
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
      .catch((error) => {
        console.error('Auth check failed:', error);
        // if not logged in, redirect to login page
        window.location.href = "/login";
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Redirecting...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold">
        Welcome {user.name} {user.surname}
      </h1>
      <p className="mt-2 text-gray-700">You are successfully logged in.</p>
    </div>
  );
}