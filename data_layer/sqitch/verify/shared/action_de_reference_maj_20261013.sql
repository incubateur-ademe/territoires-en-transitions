-- Verify tet:shared/action_de_reference_maj_20261013 on pg

BEGIN;

DO
$$
    BEGIN
        ASSERT (
            SELECT count(*) = 0 OR count(*) = 76
            FROM public.action_de_reference
            WHERE code IN ('AR001', 'AR002', 'AR005', 'AR006', 'AR008', 'AR010', 'AR011', 'AR012', 'AR013', 'AR014', 'AR015', 'AR016', 'AR017', 'AR018', 'AR019', 'AR020', 'AR021', 'AR022', 'AR023', 'AR024', 'AR025', 'AR026', 'AR027', 'AR028', 'AR029', 'AR032', 'AR034', 'AR035', 'AR038', 'AR039', 'AR040', 'AR041', 'AR042', 'AR043', 'AR044', 'AR045', 'AR052', 'AR053', 'AR054', 'AR055', 'AR056', 'AR057', 'AR058', 'AR059', 'AR060', 'AR061', 'AR062', 'AR063', 'AR064', 'AR065', 'AR067', 'AR068', 'AR069', 'AR070', 'AR071', 'AR079', 'AR080', 'AR085', 'AR086', 'AR087', 'AR088', 'AR097', 'AR098', 'AR099', 'AR100', 'AR101', 'AR102', 'AR103', 'AR105', 'AR106', 'AR107', 'AR108', 'AR109', 'AR110', 'AR111', 'AR112')
        ), 'La mise a jour doit laisser les 76 actions du tableur, ou aucune sur une base neuve';
    END
$$;

ROLLBACK;
