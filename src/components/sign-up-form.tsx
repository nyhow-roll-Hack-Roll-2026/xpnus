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

export function SignUpForm({ className, onToggleView, ...props }: React.ComponentPropsWithoutRef<'div'> & { onToggleView?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    const supabase = createClient()
    e.preventDefault()
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      return
    }
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Thank you for signing up!</CardTitle>
            <CardDescription>Check your email to confirm</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You've successfully signed up. Please check your email to confirm your account before
              signing in.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Sign up</CardTitle>
            <CardDescription className="text-xl">Create a new account here.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label className="text-2xl" htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="quackers@u.nus.edu"
                    className="text-xl"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label
                      className="text-2xl" htmlFor="password">Password</Label>
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
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label
                      className="text-2xl" htmlFor="repeat-password">Repeat Password</Label>
                  </div>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="text-xl"
                    placeholder="quackers secret password!"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <MinecraftButton type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating an account...' : 'Sign Up'}
                </MinecraftButton>
              </div>
              <div className="mt-4 text-center text-lg">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onToggleView}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Login
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
