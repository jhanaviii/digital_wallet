
import { User } from "@/types";

// Mock user database
const users = [
  {
    id: "user-1",
    username: "admin",
    email: "admin@example.com",
    password: "admin123", // In a real app, this would be hashed
    isAdmin: true,
    createdAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "user-2",
    username: "user",
    email: "user@example.com",
    password: "user123",
    isAdmin: false,
    createdAt: "2023-01-02T00:00:00Z",
  },
];

// Mock login function
export const mockLogin = (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users.find((u) => u.email === email);
      
      if (!user) {
        reject(new Error("User not found"));
        return;
      }

      if (user.password !== password) {
        reject(new Error("Invalid password"));
        return;
      }

      // Don't send the password back
      const { password: _, ...userWithoutPassword } = user;
      resolve(userWithoutPassword as User);
    }, 800); // Simulate network delay
  });
};

// Mock register function
export const mockRegister = (
  username: string,
  email: string,
  password: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Check if user already exists
      const existingUser = users.find(
        (u) => u.email === email || u.username === username
      );
      
      if (existingUser) {
        reject(new Error("User with this email or username already exists"));
        return;
      }

      // Create new user (in a real app, we would save to a database)
      const newUser = {
        id: `user-${users.length + 1}`,
        username,
        email,
        password,
        isAdmin: false,
        createdAt: new Date().toISOString(),
      };
      
      users.push(newUser);
      resolve();
    }, 800); // Simulate network delay
  });
};
