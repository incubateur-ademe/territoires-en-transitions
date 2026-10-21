-- Deploy tet:demarche/pcaet_plan_actions_tableurs to pg
-- requires: demarche/pcaet_plan_actions_inclusion_declaree

BEGIN;

-- Une pièce peut restreindre ses formats autrement que son type de démarche :
-- NULL garde ceux de demarche_definition.
ALTER TABLE public.demarche_document_definition
    ADD COLUMN formats_autorises    text[] NULL,
    ADD COLUMN mime_types_autorises text[] NULL;

COMMENT ON COLUMN public.demarche_document_definition.formats_autorises IS
    'Extensions acceptées pour cette pièce, sans le point et en minuscules. NULL = celles du type de démarche (demarche_definition.documents_formats_autorises).';
COMMENT ON COLUMN public.demarche_document_definition.mime_types_autorises IS
    'Types MIME acceptés pour cette pièce. NULL = ceux du type de démarche.';

-- Le programme d'actions s'importe en plan : il accepte aussi les tableurs que
-- l'import sait lire. Un CSV arrive souvent en application/vnd.ms-excel sous
-- Windows ; l'extension écarte un vrai .xls.
UPDATE public.demarche_document_definition
SET formats_autorises    = ARRAY['pdf', 'xlsx', 'csv'],
    mime_types_autorises = ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/csv',
        'application/vnd.ms-excel'
    ],
    modified_at          = now()
WHERE id = 'pcaet_plan_actions';

COMMIT;
