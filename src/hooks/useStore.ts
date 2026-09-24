import { useCallback, useEffect, useMemo, useState } from 'react'
import { v4 as uuid } from 'uuid'
import {
  advancePayDate,
  isDueOrOverdue,
  loadData,
  resolveProfilePayDate,
  saveData,
} from '../storage'
import type {
  AppData,
  Profile,
  ProfileInput,
  TestInput,
  TestProblemInput,
  TestRecord,
} from '../types'

export function useStore() {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  const replaceAll = useCallback((next: AppData) => {
    setData(next)
  }, [])

  const addProfile = useCallback((input: ProfileInput) => {
    const now = new Date().toISOString()
    const paymentDate = resolveProfilePayDate(input)
    const profile: Profile = {
      ...input,
      paymentDate,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    }
    setData((prev) => ({ ...prev, profiles: [profile, ...prev.profiles] }))
  }, [])

  const updateProfile = useCallback((id: string, input: ProfileInput) => {
    setData((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => {
        if (p.id !== id) return p
        return {
          ...p,
          ...input,
          paymentDate: resolveProfilePayDate(input, p),
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
  }, [])

  const deleteProfile = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      profiles: prev.profiles.filter((p) => p.id !== id),
    }))
  }, [])

  const markProfilePaid = useCallback((profileId: string) => {
    setData((prev) => {
      const profile = prev.profiles.find((p) => p.id === profileId)
      if (!profile || !profile.paymentDate) return prev
      const now = new Date().toISOString()
      const payDate = profile.paymentDate
      const payment = {
        id: uuid(),
        profileId: profile.id,
        profileName: profile.name || profile.country || 'Unnamed',
        anydeskId: profile.anydeskId,
        payDate,
        amount: profile.paymentAmount,
        createdAt: now,
      }
      return {
        ...prev,
        payments: [payment, ...prev.payments],
        profiles: prev.profiles.map((p) =>
          p.id === profileId
            ? {
                ...p,
                paymentDate: advancePayDate(payDate, p.paymentMethod),
                updatedAt: now,
              }
            : p,
        ),
      }
    })
  }, [])

  const deletePayment = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => p.id !== id),
    }))
  }, [])

  const addTest = useCallback((input: TestInput) => {
    const now = new Date().toISOString()
    const test: TestRecord = { ...input, id: uuid(), createdAt: now, updatedAt: now }
    setData((prev) => ({ ...prev, tests: [test, ...prev.tests] }))
  }, [])

  const addTests = useCallback((inputs: TestInput[]) => {
    if (inputs.length === 0) return
    const now = new Date().toISOString()
    const next = inputs.map((input) => ({
      ...input,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    }))
    setData((prev) => ({ ...prev, tests: [...next, ...prev.tests] }))
  }, [])

  const updateTest = useCallback((id: string, input: TestInput) => {
    setData((prev) => ({
      ...prev,
      tests: prev.tests.map((t) =>
        t.id === id ? { ...t, ...input, updatedAt: new Date().toISOString() } : t,
      ),
    }))
  }, [])

  const deleteTest = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      tests: prev.tests.filter((t) => t.id !== id),
    }))
  }, [])

  const updateProblem = useCallback((id: number, input: TestProblemInput) => {
    setData((prev) => ({
      ...prev,
      problems: prev.problems.map((p) =>
        p.id === id ? { ...p, title: input.title, content: input.content } : p,
      ),
    }))
  }, [])

  const dueTests = useMemo(
    () =>
      data.tests.filter(
        (t) => t.status === 'pending' && isDueOrOverdue(t.endTestDate),
      ),
    [data.tests],
  )

  const duePayments = useMemo(
    () =>
      data.profiles.filter(
        (p) => p.paymentDate && isDueOrOverdue(p.paymentDate),
      ),
    [data.profiles],
  )

  return {
    data,
    replaceAll,
    addProfile,
    updateProfile,
    deleteProfile,
    markProfilePaid,
    deletePayment,
    addTest,
    addTests,
    updateTest,
    deleteTest,
    updateProblem,
    dueTests,
    duePayments,
  }
}
