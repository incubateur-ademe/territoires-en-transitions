#!/bin/bash

# Split the command input into an array by space
IFS=' ' read -r -a cmd_array <<< "$1"

# Execute sqitch with the array
sqitch "${cmd_array[@]}" --target "$2"

