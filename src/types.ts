export type PaymentMethod = 'weekly' | 'monthly'
export type TestStatus = 'pending' | 'end' | 'fresh'
export type TestResult = 'pass' | 'fail' | null

export interface Profile {
  id: string
  country: string
  name: string
  linkedinUrl: string
  anydeskId: string
  password: string
  rentStartDate: string
  paymentMethod: PaymentMethod
  paymentAmount: number
  /** Next pay date — calculated from rent start + method, advanced when marked paid */
  paymentDate: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface PaymentRecord {
  id: string
  profileId: string
  profileName: string
  anydeskId: string
  payDate: string
  amount: number
  createdAt: string
}

export interface TestRecord {
  id: string
  profileName: string
  linkedinUrl: string
  email: string
  startTestDate: string
  endTestDate: string
  status: TestStatus
  result: TestResult
  answers: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type ProfileInput = Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>
export type TestInput = Omit<TestRecord, 'id' | 'createdAt' | 'updatedAt'>

export interface TestProblem {
  id: number
  title: string
  content: string
}

export type TestProblemInput = Omit<TestProblem, 'id'>

export interface AppData {
  profiles: Profile[]
  tests: TestRecord[]
  payments: PaymentRecord[]
  problems: TestProblem[]
}
