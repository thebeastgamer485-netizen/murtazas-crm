import { supabase } from './supabase'
import type {
  Contact,
  ContactInsert,
  ContactUpdate,
  Deal,
  DealInsert,
  DealUpdate,
  FollowUp,
  FollowUpInsert,
  FollowUpUpdate,
  Outreach,
  OutreachInsert,
  OutreachUpdate,
  Prospect,
  ProspectInsert,
  ProspectUpdate,
  ProspectWithRelations,
} from './types'

// Throws on a Supabase error, otherwise returns the (non-null) data.
function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.data as T
}

// ---------------------------------------------------------------------------
// prospects
// ---------------------------------------------------------------------------

export const prospects = {
  async list(): Promise<Prospect[]> {
    return unwrap(
      await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false }),
    )
  },

  async get(id: string): Promise<Prospect> {
    return unwrap(
      await supabase.from('prospects').select('*').eq('id', id).single(),
    )
  },

  async create(input: ProspectInsert): Promise<Prospect> {
    return unwrap(
      await supabase.from('prospects').insert(input).select().single(),
    )
  },

  async update(id: string, changes: ProspectUpdate): Promise<Prospect> {
    return unwrap(
      await supabase
        .from('prospects')
        .update(changes)
        .eq('id', id)
        .select()
        .single(),
    )
  },

  async remove(id: string): Promise<void> {
    // Remove dependent rows first — the FKs aren't declared ON DELETE CASCADE.
    for (const table of ['outreach', 'follow_ups', 'deals'] as const) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('prospect_id', id)
      if (error) throw new Error(error.message)
    }
    const { error } = await supabase.from('prospects').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  // Insert many prospects in chunks; returns the count actually inserted.
  async createMany(
    rows: ProspectInsert[],
    chunkSize = 100,
  ): Promise<number> {
    let inserted = 0
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      const { data, error } = await supabase
        .from('prospects')
        .insert(chunk)
        .select('id')
      if (error) throw new Error(error.message)
      inserted += data?.length ?? 0
    }
    return inserted
  },
}

// ---------------------------------------------------------------------------
// outreach
// ---------------------------------------------------------------------------

export const outreach = {
  async list(): Promise<Outreach[]> {
    return unwrap(
      await supabase
        .from('outreach')
        .select('*')
        .order('sent_at', { ascending: false }),
    )
  },

  async listByProspect(prospectId: string): Promise<Outreach[]> {
    return unwrap(
      await supabase
        .from('outreach')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('sent_at', { ascending: false }),
    )
  },

  async get(id: string): Promise<Outreach> {
    return unwrap(
      await supabase.from('outreach').select('*').eq('id', id).single(),
    )
  },

  async create(input: OutreachInsert): Promise<Outreach> {
    return unwrap(
      await supabase.from('outreach').insert(input).select().single(),
    )
  },

  async update(id: string, changes: OutreachUpdate): Promise<Outreach> {
    return unwrap(
      await supabase
        .from('outreach')
        .update(changes)
        .eq('id', id)
        .select()
        .single(),
    )
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('outreach').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// ---------------------------------------------------------------------------
// follow_ups
// ---------------------------------------------------------------------------

export const followUps = {
  async list(): Promise<FollowUp[]> {
    return unwrap(
      await supabase
        .from('follow_ups')
        .select('*')
        .order('due_date', { ascending: true }),
    )
  },

  async listByProspect(prospectId: string): Promise<FollowUp[]> {
    return unwrap(
      await supabase
        .from('follow_ups')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('due_date', { ascending: true }),
    )
  },

  async listDue(onOrBefore: string): Promise<FollowUp[]> {
    return unwrap(
      await supabase
        .from('follow_ups')
        .select('*')
        .eq('done', false)
        .lte('due_date', onOrBefore)
        .order('due_date', { ascending: true }),
    )
  },

  async get(id: string): Promise<FollowUp> {
    return unwrap(
      await supabase.from('follow_ups').select('*').eq('id', id).single(),
    )
  },

  async create(input: FollowUpInsert): Promise<FollowUp> {
    return unwrap(
      await supabase.from('follow_ups').insert(input).select().single(),
    )
  },

  async update(id: string, changes: FollowUpUpdate): Promise<FollowUp> {
    return unwrap(
      await supabase
        .from('follow_ups')
        .update(changes)
        .eq('id', id)
        .select()
        .single(),
    )
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('follow_ups').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// ---------------------------------------------------------------------------
// deals
// ---------------------------------------------------------------------------

export const deals = {
  async list(): Promise<Deal[]> {
    return unwrap(
      await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false }),
    )
  },

  async listByProspect(prospectId: string): Promise<Deal[]> {
    return unwrap(
      await supabase
        .from('deals')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('created_at', { ascending: false }),
    )
  },

  async get(id: string): Promise<Deal> {
    return unwrap(await supabase.from('deals').select('*').eq('id', id).single())
  },

  async create(input: DealInsert): Promise<Deal> {
    return unwrap(await supabase.from('deals').insert(input).select().single())
  },

  async update(id: string, changes: DealUpdate): Promise<Deal> {
    return unwrap(
      await supabase
        .from('deals')
        .update(changes)
        .eq('id', id)
        .select()
        .single(),
    )
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// ---------------------------------------------------------------------------
// contacts
// ---------------------------------------------------------------------------

export const contacts = {
  async list(): Promise<Contact[]> {
    return unwrap(
      await supabase.from('contacts').select('*').order('name', {
        ascending: true,
      }),
    )
  },

  async create(input: ContactInsert): Promise<Contact> {
    return unwrap(
      await supabase.from('contacts').insert(input).select().single(),
    )
  },

  async update(id: string, changes: ContactUpdate): Promise<Contact> {
    return unwrap(
      await supabase
        .from('contacts')
        .update(changes)
        .eq('id', id)
        .select()
        .single(),
    )
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// ---------------------------------------------------------------------------
// Composite query
// ---------------------------------------------------------------------------

/**
 * Fetch a single prospect together with its related outreach, follow_ups,
 * and deals in one round-trip via PostgREST embedded resources.
 */
export async function getProspectWithRelations(
  id: string,
): Promise<ProspectWithRelations> {
  return unwrap(
    await supabase
      .from('prospects')
      .select('*, outreach(*), follow_ups(*), deals(*)')
      .eq('id', id)
      .single(),
  )
}
