"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClientWithServiceRole = exports.getSupabaseClient = void 0;
const supabase_js_2_1 = require("https://esm.sh/@supabase/supabase-js@2");
/** Crée le client avec le contexte d'authentification de l'utilisateur connecté */
const getSupabaseClient = (req) => (0, supabase_js_2_1.createClient)(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    db: { schema: 'public' },
    global: { headers: { Authorization: req.headers.get('Authorization') } },
    auth: {
        // évite un avertissement avec deno hors du navigateur.
        persistSession: false,
    },
});
exports.getSupabaseClient = getSupabaseClient;
/** Crée le client avec le contexte d'authentification "Service" */
const getSupabaseClientWithServiceRole = () => (0, supabase_js_2_1.createClient)(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), {
    db: {
        schema: 'public',
    },
    auth: {
        // Pour fonctionner avec deno hors du navigateur.
        persistSession: false,
    },
});
exports.getSupabaseClientWithServiceRole = getSupabaseClientWithServiceRole;
//# sourceMappingURL=getSupabaseClient.js.map