#!/bin/bash

echo "Safely killing all my-chat-brain running applications..."

# Function to kill processes on a specific port
kill_on_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "Found processes on port $port: $pids"
        echo "Sending TERM signal..."
        echo "$pids" | xargs kill -TERM 2>/dev/null
        sleep 3
        # Check if still running
        local remaining=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$remaining" ]; then
            echo "Processes still running, sending KILL signal..."
            echo "$remaining" | xargs kill -KILL 2>/dev/null
        fi
        echo "Processes on port $port terminated."
    else
        echo "No processes found on port $port."
    fi
}

# Kill processes on common dev ports
kill_on_port 3000
kill_on_port 3001

# Kill any remaining npm/node processes related to my-chat-brain
echo "Checking for any remaining my-chat-brain processes..."
pkill -TERM -f "npm.*dev" 2>/dev/null
pkill -TERM -f "node.*my-chat-brain" 2>/dev/null
sleep 2
pkill -KILL -f "npm.*dev" 2>/dev/null
pkill -KILL -f "node.*my-chat-brain" 2>/dev/null

echo "All my-chat-brain applications have been safely terminated."