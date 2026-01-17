import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MinecraftButton } from '../../components/MinecraftButton'

export function LoginForm({ className, onToggleView, ...props }: React.ComponentPropsWithoutRef<'div'> & { onToggleView?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // User is now logged in, App.tsx will handle the session via auth listener
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Login</CardTitle>
          <CardDescription className="text-xl">Sign in to your existing account here.</CardDescription>

        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label className="text-2xl" htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="text-xl"
                  placeholder="quackers@u.nus.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label className="text-2xl" htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="text-xl"
                  placeholder="quackers secret password!"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <MinecraftButton type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </MinecraftButton>
            </div>
            <div className="mt-4 text-center text-lg">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={onToggleView}
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign up
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
