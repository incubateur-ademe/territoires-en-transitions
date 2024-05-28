/** Crée le client avec le contexte d'authentification de l'utilisateur connecté */
export declare const getSupabaseClient: (req: Request) => any;
/** Crée le client avec le contexte d'authentification "Service" */
export declare const getSupabaseClientWithServiceRole: () => any;
export type TSupabaseClient = ReturnType<typeof getSupabaseClient>;
//# sourceMappingURL=getSupabaseClient.d.ts.map