'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Mail, Lock, Eye, EyeOff, LogIn, Loader2, ShieldCheck, Sparkles, BookOpen, Users, Award, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuthStore } from '@/lib/auth-store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { ABUAD_INFO } from '@/lib/constants'
import { ThemeToggle } from '@/components/theme-toggle'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore((s) => s.setUser)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      })
      setUser(res.user, res.accessToken)
      toast.success(`Welcome back, ${res.user.firstName}!`)
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left: Hero Section */}
      <div className="lg:w-1/2 bg-abuad-gradient text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ABUAD</h1>
              <p className="text-xs text-white/80">{ABUAD_INFO.shortName} Portal</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 max-w-md"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Part-Time Course Registration
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold leading-tight tracking-tight">
              {ABUAD_INFO.name}
            </h2>
            <p className="text-base lg:text-lg text-white/85 leading-relaxed">
              A comprehensive academic management system designed for part-time students. Register courses, track approvals, manage payments, and access your academic records — all in one place.
            </p>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span className="font-semibold italic">{ABUAD_INFO.motto}</span>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-12">
          {[
            { icon: Users, label: 'Students', value: '80+' },
            { icon: BookOpen, label: 'Courses', value: '400+' },
            { icon: Building2, label: 'Colleges', value: '6' },
            { icon: Award, label: 'Departments', value: '26' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3, duration: 0.5 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-3 lg:p-4 border border-white/15"
            >
              <stat.icon className="h-5 w-5 mb-2 text-amber-300" />
              <div className="text-xl lg:text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-white/70">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 shadow-xl">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Welcome Back</CardTitle>
                  <CardDescription>Sign in to access your portal</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@abuad.edu.ng"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button type="button" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <Label htmlFor="remember" className="text-sm cursor-pointer">Remember me</Label>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Secured
                  </span>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Signing in...</>
                  ) : (
                    <>Sign In <LogIn className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            © 2025 {ABUAD_INFO.name}. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
