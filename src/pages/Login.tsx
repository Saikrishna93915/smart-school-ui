import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, roleLabels } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast"; // ✅ Import Toast
import {
  School,
  User,
  GraduationCap,
  Users,
  BookOpen,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const roleOptions: {
  role: UserRole;
  icon: React.ElementType;
  description: string;
}[] = [
  { role: "admin", icon: User, description: "Manage school operations" },
  { role: "owner", icon: Building2, description: "View analytics & reports" },
  { role: "teacher", icon: GraduationCap, description: "Classes & attendance" },
  { role: "parent", icon: Users, description: "Track child progress" },
  { role: "student", icon: BookOpen, description: "Access learning portal" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast(); // ✅ Initialize Toast

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password, selectedRole);
      
      // Success Pop-up
      toast({
        title: "Login Successful",
        description: `Welcome back, ${username}!`,
        variant: "default",
      });
      
      navigate("/dashboard");
    } catch (err: any) {
      // ✅ TOP-RIGHT ERROR POP-UP
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: err.message || "Invalid credentials. Please check your password.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isEmailRole = selectedRole === "admin" || selectedRole === "owner" || selectedRole === "teacher";

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* LEFT PANEL – BRANDING & STATS */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-secondary blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-primary-foreground">
          <div className="flex items-center gap-4 mb-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary shadow-2xl">
              <School className="h-10 w-10 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">AI School ERP</h1>
              <p className="text-primary-foreground/80 font-bold uppercase text-xs tracking-widest">Smart Education Platform</p>
            </div>
          </div>

          <div className="space-y-8 max-w-lg">
            <h2 className="text-5xl font-black leading-[1.1] tracking-tighter italic">
              TRANSFORM YOUR SCHOOL WITH INTELLIGENT AI
            </h2>
            <p className="text-xl text-primary-foreground/80 leading-relaxed font-medium">
              The next generation of school management. Automate attendance, 
              track performance, and empower teachers with AI-driven insights.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-8">
              {[
                { label: "Students Managed", value: "50,000+" },
                { label: "Attendance Accuracy", value: "99.9%" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
                  <p className="text-3xl font-black italic">{stat.value}</p>
                  <p className="text-sm font-bold text-primary-foreground/60 uppercase tracking-tighter">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL – LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white lg:rounded-l-[3rem] shadow-[-20px_0_50px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Welcome Back</h2>
            <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Secure Portal Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            {/* ROLE SELECTION */}
            <div className="space-y-4">
              <Label className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">Select Identity</Label>
              <div className="grid grid-cols-5 gap-3">
                {roleOptions.map(({ role, icon: Icon }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 group",
                      selectedRole === role
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100 scale-105"
                        : "border-slate-100 hover:border-indigo-200 text-slate-400"
                    )}
                  >
                    <Icon className={cn("h-6 w-6 transition-transform group-hover:scale-110", selectedRole === role ? "fill-indigo-600/10" : "")} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">
                      {role}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* IDENTIFIER */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">
                {selectedRole === "student" ? "Admission Number" : "Email Address"}
              </Label>
              <Input
                type={isEmailRole ? "email" : "text"}
                placeholder={selectedRole === "student" ? "ADM-2025-001" : "name@school.edu"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-lg font-bold"
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">Password</Label>
                <button type="button" className="text-xs text-indigo-600 hover:text-indigo-800 font-black uppercase tracking-tighter">
                  Reset?
                </button>
              </div>
              <div className="relative group">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all pr-14 text-lg font-bold"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 text-xl font-black italic tracking-tight transition-all active:scale-95" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-3">
                   <div className="h-5 w-5 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                   VERIFYING...
                </div>
              ) : (
                `SIGN IN AS ${selectedRole.toUpperCase()}`
              )}
            </Button>
          </form>

          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-tighter">
            System Issue? <button className="text-indigo-600 hover:underline">Contact Tech Support</button>
          </p>
        </div>
      </div>
    </div>
  );
}