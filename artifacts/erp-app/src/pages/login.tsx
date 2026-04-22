import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ username, password });
    } catch (error) {
      // Error is handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-background">
      {/* Decorative background elements */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Abstract Background" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      </div>

      <div className="relative z-10 w-full flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="glass-panel p-8 sm:p-10 rounded-3xl relative overflow-hidden">
            {/* Top accent glow */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            
            <div className="flex flex-col items-center mb-8">
              <div className="h-16 w-16 bg-gradient-to-br from-primary to-accent rounded-2xl p-[2px] shadow-lg shadow-primary/20 mb-6">
                <div className="h-full w-full bg-card rounded-[14px] flex items-center justify-center">
                  <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="h-10 w-10 rounded-lg" />
                </div>
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground text-center">Nexus ERP</h1>
              <p className="text-muted-foreground mt-2 text-center">Enterprise Resource Planning</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground/80">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary/20 h-12 rounded-xl transition-all"
                  placeholder="Enter your username"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground/80">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background/50 border-white/10 focus:border-primary focus:ring-primary/20 h-12 rounded-xl transition-all"
                  placeholder="••••••••"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Secure Login
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-xs text-muted-foreground/60">
                Authorized access only. Protected by enterprise security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
