# Démon clamd de l'analyse antivirus des fichiers déposés. Même image en local,
# sur Koyeb et sur Coolify : seule la configuration réseau change.
#
# L'image officielle embarque les signatures du jour de sa publication ;
# freshclam les tient ensuite à jour (contrôle toutes les heures, ici).
FROM clamav/clamav:1.5.4

# Appliqués à clamd.conf / freshclam.conf par l'entrypoint de l'image.
#
# StreamMaxLength : 25M par défaut, sous la limite de 50 Mio de Supabase
# Storage ; au-delà, clamd refuse le flux et le fichier reste non analysé.
#
# AlertEncrypted reste à sa valeur par défaut (no) : sinon tout PDF ou archive
# protégé par mot de passe serait déclaré infecté.
ENV CLAMD_CONF_StreamMaxLength=60M \
    CLAMD_CONF_LogFile=/dev/stdout \
    FRESHCLAM_CHECKS=24

EXPOSE 3310

HEALTHCHECK --interval=30s --timeout=10s --start-period=5m --retries=3 \
    CMD clamdcheck.sh
