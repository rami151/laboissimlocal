"use client"

import { useState, useEffect } from "react"

export interface TeamMember {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  profile?: {
    phone: string | null
    bio: string | null
    profile_image: string | null
    location: string | null
    institution: string | null
    website: string | null
    linkedin: string | null
    twitter: string | null
    github: string | null
  } | null
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  try {
    const response = await fetch("http://localhost:8000/api/team-members/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching team members:", error)
    return []
  }
}

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTeamMembers() {
      setLoading(true)
      setError(null)
      try {
        const teamMembers = await fetchTeamMembers()
        setMembers(teamMembers)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load team members")
      } finally {
        setLoading(false)
      }
    }

    loadTeamMembers()
  }, [])

  return { members, loading, error }
}
