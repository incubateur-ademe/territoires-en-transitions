until curl --head --fail -X GET 'http://localhost:3000'; do
    sleep 1
    echo "Waiting for front app."
done

echo "Done waiting."
exit 0
