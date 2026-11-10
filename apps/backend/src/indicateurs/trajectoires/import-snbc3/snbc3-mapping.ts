/**
 * Correspondance des sous-secteurs SNBC 3 (`code_traj_supra` de
 * `resultats_territorialises.parquet`) vers les indicateurs TeT non calculés.
 *
 * Tranchée le 04/11/2026 (page Notion « Correspondance des sous-secteurs,
 * points à trancher », TT-39). Détail et justification : plan du lot 1 de la
 * trajectoire SNBC 3.
 *
 * - Plusieurs codes vers un même indicateur : leurs valeurs sont sommées.
 * - `sign: -1` : TeT stocke la séquestration et les captages en positif,
 *   la SNBC 3 en émissions négatives.
 * - `SNBC3_IGNORED` : code connu, volontairement non importé, et exclu de
 *   `cae_1.aa`.
 * - Aucun code n'alimente `cae_2.l_pcaet`, `cae_63.cc` ni `cae_63.cd`.
 * - Les totaux (`cae_1.a`, `cae_1.i`, `cae_2.a`, `cae_63.a`…) ne sont pas
 *   importés : leurs formules les recalculent.
 *
 * En tertiaire, `ter_ch` désigne le chauffage et `ter_clim` la climatisation
 * (codes `ter_ch_MI` et `ter_ch_LC` avant la release V2.1). La climatisation est
 * rangée dans « autres usages », en résidentiel comme en tertiaire.
 */
export type Snbc3Target = {
  identifiant: string;
  sign: 1 | -1;
};

export const SNBC3_IGNORED = 'ignored' as const;

const target = (identifiant: string, sign: 1 | -1 = 1): Snbc3Target => ({
  identifiant,
  sign,
});

export const SNBC3_MAPPING: Readonly<
  Record<string, Snbc3Target | typeof SNBC3_IGNORED>
> = {
  // GES — résidentiel
  emi_res_ch_MI: target('cae_1.ca'),
  emi_res_ch_LC: target('cae_1.cb'),
  emi_res_autres: target('cae_1.cc'),
  emi_res_clim: target('cae_1.cc'),
  // GES — tertiaire
  emi_ter_ch: target('cae_1.da'),
  emi_ter_autres: target('cae_1.db'),
  emi_ter_clim: target('cae_1.db'),
  // GES — industrie
  emi_ind_met: target('cae_1.ia'),
  emi_ind_chim: target('cae_1.ib'),
  emi_ind_nonmet: target('cae_1.ic'),
  emi_ind_iaa: target('cae_1.id'),
  emi_ind_equip: target('cae_1.ie'),
  emi_ind_pap: target('cae_1.if'),
  emi_ind_ind_autres: target('cae_1.ig'),
  emi_ind_const: target('cae_1.ih'),
  // GES — agriculture
  emi_agr_ener: target('cae_1.ga'),
  emi_agr_elev_bovins: target('cae_1.gb'),
  emi_agr_elev_porcins: target('cae_1.gb'),
  emi_agr_elev_volailles: target('cae_1.gb'),
  emi_agr_elev_autres: target('cae_1.gb'),
  emi_agr_cult_engrais_min: target('cae_1.gc'),
  emi_agr_cult_engrais_org: target('cae_1.gc'),
  emi_agr_cult_pature: target('cae_1.gc'),
  emi_agr_cult_autres: target('cae_1.gc'),
  // GES — transport routier : mobilité locale / autre routier
  emi_mob_vp_domtra: target('cae_1.ea'),
  emi_mob_vp_2roues: target('cae_1.ea'),
  emi_mob_vp_bus: target('cae_1.ea'),
  emi_mob_vp_autre: target('cae_1.eb'),
  emi_fret_vul: target('cae_1.eb'),
  emi_fret_pl: target('cae_1.eb'),
  // GES — autres secteurs
  emi_tra_autres: target('cae_1.f'),
  emi_dech: target('cae_1.h'),
  emi_en: target('cae_1.j'),
  // GES — captage et stockage du carbone, non recalé
  emi_CSC_beccs_en: target('cae_1.csc', -1),
  emi_CSC_beccs_ind: target('cae_1.csc', -1),
  emi_CSC_dac: target('cae_1.csc', -1),
  // Séquestration ; sols forestiers ajoutés aux forêts
  emi_UTCATF_for: target('cae_63.b', -1),
  emi_UTCATF_solfor: target('cae_63.b', -1),
  emi_UTCATF_cult: target('cae_63.ca', -1),
  emi_UTCATF_prai: target('cae_63.cb', -1),
  emi_UTCATF_zohu: target('cae_63.da', -1),
  emi_UTCATF_arti: target('cae_63.db', -1),
  emi_UTCATF_prbo: target('cae_63.e', -1),
  emi_UTCATF_aut: SNBC3_IGNORED,
  emi_UTCATF_bar: SNBC3_IGNORED,
  // Consommation — résidentiel
  cons_res_ch_MI: target('cae_2.ea'),
  cons_res_ch_LC: target('cae_2.eb'),
  cons_res_autres: target('cae_2.ec'),
  cons_res_clim: target('cae_2.ec'),
  // Consommation — tertiaire
  cons_ter_ch: target('cae_2.fa'),
  cons_ter_autres: target('cae_2.fb'),
  cons_ter_clim: target('cae_2.fb'),
  // Consommation — industrie
  cons_ind_met: target('cae_2.ka'),
  cons_ind_chim: target('cae_2.kb'),
  cons_ind_nonmet: target('cae_2.kc'),
  cons_ind_iaa: target('cae_2.kd'),
  cons_ind_equip: target('cae_2.ke'),
  cons_ind_pap: target('cae_2.kf'),
  cons_ind_ind_autres: target('cae_2.kg'),
  // Procédé de captage compté comme process industriel
  cons_csc: target('cae_2.kg'),
  cons_ind_const: target('cae_2.kh'),
  // Consommation — autres secteurs
  cons_agr: target('cae_2.i'),
  // `cons_mob_vp_autre` couvre déjà fret, bus et deux-roues
  cons_mob_vp_domtra: target('cae_2.g'),
  cons_mob_vp_autre: target('cae_2.g'),
  cons_tra_autres: target('cae_2.h'),
  cons_dech: target('cae_2.j'),
};

/** Total net des émissions : somme des codes `emi_*` importés, hors ignorés. */
export const SNBC3_NET_EMISSIONS_IDENTIFIANT = 'cae_1.aa';

/**
 * `cae_2.g` n'est écrit pour une année que si `cons_mob_vp_autre` est renseigné :
 * sans lui, la valeur se réduirait au domicile-travail.
 */
export const SNBC3_ROAD_CONSUMPTION_IDENTIFIANT = 'cae_2.g';
export const SNBC3_ROAD_CONSUMPTION_REQUIRED_CODE = 'cons_mob_vp_autre';

export const SNBC3_ZONE_HEXAGONE = 'HEXAGONE';

/** Identifiants TeT écrits par l'import, `cae_1.aa` compris. */
export const SNBC3_IMPORTED_IDENTIFIANTS: readonly string[] = [
  ...new Set([
    ...Object.values(SNBC3_MAPPING).flatMap((t) =>
      t === SNBC3_IGNORED ? [] : [t.identifiant]
    ),
    SNBC3_NET_EMISSIONS_IDENTIFIANT,
  ]),
].sort();
