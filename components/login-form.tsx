"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export type LoginRequestT = {
  email: string;
  password: string;
  redirect: boolean;
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequestT>();
  const [loading, setLoading] = useState(false);

  const onSubmit: SubmitHandler<LoginRequestT> = async (data) => {
    setLoading(true);
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    }).then((result) => {
      if (result?.error) {
        console.error(result.error);
        toast.error("Login failed: " + result.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
        console.log("Login successful");
        toast.success("Welcome back!");
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    if (errors.email || errors.password) {
      toast.error(
        "Please fill in all required fields." +
          (errors.email ? " Email is required." : "") +
          (errors.password ? " Password is required." : ""),
      );
    }
  }, [errors.email, errors.password]);

  return (
    <form
      className={cn(
        "flex flex-col gap-6 sm:gap-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500",
        className,
      )}
      {...props}
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Header Section */}
      <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
        <div className="mb-1 sm:mb-2">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground mb-2">
            Welcome Back
          </h1>
          <div className="h-px w-12 bg-border mx-auto" />
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm font-light leading-relaxed max-w-sm px-2">
          Enter your credentials to access your account
        </p>
      </div>

      {/* Form Fields */}
      <div className="grid gap-4 sm:gap-6">
        {/* Email Field */}
        <div className="grid gap-2 sm:gap-2.5">
          <Label
            htmlFor="email"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5 sm:mb-1"
          >
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            className={cn(
              "h-10 sm:h-11 text-sm sm:text-base transition-all duration-200",
              errors.email && "border-destructive",
            )}
            {...register("email", {
              required: true,
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1 animate-in fade-in-0">
              {errors.email.message || "Email is required"}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="grid gap-2 sm:gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor="password"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Password
            </Label>
            {/* <Link
              href="/password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline font-normal whitespace-nowrap"
            >
              Forgot password?
            </Link> */}
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            className={cn(
              "h-10 sm:h-11 text-sm sm:text-base transition-all duration-200",
              errors.password && "border-destructive",
            )}
            {...register("password", { required: true })}
          />
          {errors.password && (
            <p className="text-xs text-destructive mt-1 animate-in fade-in-0">
              {errors.password.message || "Password is required"}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-10 sm:h-11 mt-2 text-sm sm:text-base font-medium tracking-wide transition-all duration-200 shadow-sm hover:shadow-md"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </div>

      {/* Divider */}
      {/* <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-4 text-muted-foreground font-light tracking-wider">
            Secure Access
          </span>
        </div>
      </div> */}

      {/* Footer */}
      {/* <div className="text-center space-y-1.5 sm:space-y-2 pt-1 sm:pt-2">
        <p className="text-xs text-muted-foreground font-light px-2">
          Don&apos;t have an account?
        </p>
        <p className="text-xs px-2">
          <a
            href="mailto:support@abc.com"
            className="text-foreground hover:text-primary transition-colors duration-200 underline-offset-4 hover:underline font-medium break-all sm:break-normal"
          >
            Contact support@abc.com
          </a>
        </p>
      </div> */}
    </form>
  );
}
