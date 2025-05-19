
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Login from "@/components/auth/Login";
import Register from "@/components/auth/Register";
import Dashboard from "@/components/dashboard/Dashboard";
import { User } from "@/types";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>("login");

  // Handle successful authentication
  const handleAuthSuccess = (user: User) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {!isAuthenticated ? (
        <div className="container mx-auto px-4 py-16 max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">DigiWallet</h1>
            <p className="text-slate-600">Secure digital wallet with advanced fraud detection</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Login onLoginSuccess={handleAuthSuccess} />
              </TabsContent>
              <TabsContent value="register">
                <Register onRegistrationSuccess={() => setActiveTab("login")} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        <Dashboard user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default Index;
