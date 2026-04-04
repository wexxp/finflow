import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hcobitmrsisshexspfnv.supabase.co'
const SUPABASE_KEY = 'sb_publishable_yGtTsP6_eErfSB8BUpSRKg_-Dt8_T2e'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
