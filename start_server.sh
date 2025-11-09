#!/bin/bash
cd /home/ubuntu
pnpm dev > /tmp/server.log 2>&1 &
echo $! > /tmp/server.pid

