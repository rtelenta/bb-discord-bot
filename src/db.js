const { createClient } = require("@supabase/supabase-js")
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require("./constants")

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

module.exports = supabase
