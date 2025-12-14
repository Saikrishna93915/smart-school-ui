import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, roleLabels } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  School,
  User,
  GraduationCap,
  Users,
  BookOpen,
  Building2,
  Eye,
  EyeOff,
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password, selectedRole);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL – BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-secondary blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-primary-foreground">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary shadow-glow">
              <School className="h-8 w-8 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI School ERP</h1>
              <p className="text-primary-foreground/80">
                Smart Education Platform
              </p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              Transform Your School with Intelligent Management
            </h2>
            <p className="text-lg text-primary-foreground/80">
              Powered by AI to manage students, automate attendance, track
              performance, and make data-driven decisions.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { label: "Students Managed", value: "50,000+" },
                { label: "Schools Trust Us", value: "200+" },
                { label: "Attendance Accuracy", value: "99.9%" },
                { label: "AI Insights Daily", value: "10,000+" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-primary-foreground/10 rounded-lg p-4"
                >
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-primary-foreground/70">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL – LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* ROLE SELECTION */}
            <div className="space-y-3">
              <Label>Select Your Role</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {roleOptions.map(({ role, icon: Icon }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                      selectedRole === role
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium capitalize">
                      {role}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {
                  roleOptions.find((r) => r.role === selectedRole)
                    ?.description
                }
              </p>
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading
                ? "Signing in..."
                : `Sign in as ${roleLabels[selectedRole]}`}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
