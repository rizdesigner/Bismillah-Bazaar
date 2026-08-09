import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "admin" | "customer";
    status: "pending_approval" | "active" | "suspended";
    restaurantName: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: "admin" | "customer";
      status: "pending_approval" | "active" | "suspended";
      restaurantName: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "customer";
    status: "pending_approval" | "active" | "suspended";
    restaurantName: string | null;
  }
}
