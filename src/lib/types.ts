// Database table types for Murtaza's CRM (Supabase / Postgres)

export type ProspectStage =
  | 'new'
  | 'contacted'
  | 'replied'
  | 'interested'
  | 'won'
  | 'lost'

export type OutreachDirection = 'outbound' | 'inbound'

export type DealStage =
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | string

// ---------------------------------------------------------------------------
// prospects
// ---------------------------------------------------------------------------

export interface Prospect {
  id: string
  business_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  industry: string | null
  current_website: string | null
  website_quality: string | null
  lead_temp: string | null
  source: string | null
  fit_notes: string | null
  stage: ProspectStage
  created_at: string
  updated_at: string
}

// Fields the database fills in automatically are omitted; defaulted fields are optional.
export type ProspectInsert = Omit<
  Prospect,
  'id' | 'created_at' | 'updated_at' | 'stage' | 'lead_temp'
> & {
  stage?: ProspectStage
  lead_temp?: string | null
}

export type ProspectUpdate = Partial<ProspectInsert>

// ---------------------------------------------------------------------------
// outreach
// ---------------------------------------------------------------------------

export interface Outreach {
  id: string
  prospect_id: string
  channel: string | null
  direction: OutreachDirection
  subject: string | null
  body: string | null
  outcome: string | null
  sent_at: string | null
}

export type OutreachInsert = Omit<Outreach, 'id' | 'direction'> & {
  direction?: OutreachDirection
}

export type OutreachUpdate = Partial<OutreachInsert>

// ---------------------------------------------------------------------------
// follow_ups
// ---------------------------------------------------------------------------

export interface FollowUp {
  id: string
  prospect_id: string
  due_date: string | null
  note: string | null
  done: boolean
  created_at: string
}

export type FollowUpInsert = Omit<FollowUp, 'id' | 'created_at' | 'done'> & {
  done?: boolean
}

export type FollowUpUpdate = Partial<FollowUpInsert>

// ---------------------------------------------------------------------------
// deals
// ---------------------------------------------------------------------------

export interface Deal {
  id: string
  prospect_id: string
  package: string | null
  value: number | null
  currency: string
  stage: DealStage
  expected_close: string | null
  closed_at: string | null
  created_at: string
}

export type DealInsert = Omit<
  Deal,
  'id' | 'created_at' | 'currency' | 'stage'
> & {
  currency?: string
  stage?: DealStage
}

export type DealUpdate = Partial<DealInsert>

// ---------------------------------------------------------------------------
// contacts
// ---------------------------------------------------------------------------

export interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at'>

export type ContactUpdate = Partial<ContactInsert>

// ---------------------------------------------------------------------------
// Composite
// ---------------------------------------------------------------------------

export interface ProspectWithRelations extends Prospect {
  outreach: Outreach[]
  follow_ups: FollowUp[]
  deals: Deal[]
}
