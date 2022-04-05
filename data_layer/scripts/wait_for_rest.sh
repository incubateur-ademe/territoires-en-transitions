until curl --fail -X POST 'http://localhost:8000/rest/v1/rpc/is_authenticated' \
            -H "Content-Type: application/json" \
            -H "apikey: $SUPABASE_KEY" \
            -H "Authorization: Bearer $SUPABASE_KEY"; do
    sleep 1
    echo "Waiting for rpc is_authenticated."
done

echo "Done waiting."
exit 0
