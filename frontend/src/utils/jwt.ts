import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  userId: string;
  email: string;
  exp: number;
}

export function getUserIdFromToken(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded.userId;
  } catch (err) {
    console.error("Token decoding failed:", err);
    return null;
  }
}
